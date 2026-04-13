"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconColumns3,
  IconTrash,
  IconArchive,
  IconX,
  IconGripVertical,
} from "@tabler/icons-react"
import type { StudentField, Level, Branch, Schedule } from "@/lib"
import type { ColumnDef } from "@tanstack/react-table"
import type { StudentWithLevelRating } from "@/lib"
import type { ColumnOrderState } from "@tanstack/react-table"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ─── Types ────────────────────────────────────────────────────

interface InlineFiltersProps {
  /** All column definitions — used to build the column toggle dropdown */
  columns: ColumnDef<StudentWithLevelRating>[]
  /** Column visibility state */
  columnVisibility: Record<string, boolean>
  /** Callback to toggle a column's visibility */
  onToggleColumn: (columnId: string, visible: boolean) => void
  /** Column order state */
  columnOrder: ColumnOrderState
  /** Callback to update column order */
  onColumnOrderChange: (order: ColumnOrderState) => void
  fields: StudentField[]
  levels: Level[]
  branches: Branch[]
  schedules: Schedule[]
  levelFilter: string
  branchFilter: string
  scheduleFilter: string
  onLevelFilterChange: (v: string) => void
  onBranchFilterChange: (v: string) => void
  onScheduleFilterChange: (v: string) => void
}

interface SecondaryToolbarProps {
  levels: Level[]
  branches: Branch[]
  schedules: Schedule[]
  levelFilter: string
  branchFilter: string
  scheduleFilter: string
  onLevelFilterChange: (v: string) => void
  onBranchFilterChange: (v: string) => void
  onScheduleFilterChange: (v: string) => void
  selectedCount: number
  onBulkArchive: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
}

// ─── Sortable Column Item ───────────────────────────────────────

interface SortableColumnItemProps {
  id: string
  displayName: string
  isVisible: boolean
  onToggleVisibility: (visible: boolean) => void
  canDrag: boolean
}

function SortableColumnItem({
  id,
  displayName,
  isVisible,
  onToggleVisibility,
  canDrag,
}: SortableColumnItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !canDrag,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      {canDrag && (
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          tabIndex={0}
        >
          <IconGripVertical className="size-3.5" />
          <span className="sr-only">Drag to reorder</span>
        </button>
      )}
      <DropdownMenuCheckboxItem
        checked={isVisible}
        onCheckedChange={onToggleVisibility}
        className="capitalize text-xs flex-1"
        onSelect={(e) => e.preventDefault()}
      >
        {displayName}
      </DropdownMenuCheckboxItem>
    </div>
  )
}

// ─── Inline Filters (sits next to search bar) ─────────────────

export function StudentsInlineFilters({
  columns,
  columnVisibility,
  onToggleColumn,
  columnOrder,
  onColumnOrderChange,
  fields,
  levels,
  branches,
  schedules,
  levelFilter,
  branchFilter,
  scheduleFilter,
  onLevelFilterChange,
  onBranchFilterChange,
  onScheduleFilterChange,
}: InlineFiltersProps) {
  const availableBranches =
    levelFilter === "all"
      ? branches
      : branches.filter((b) => b.level_id?.toString() === levelFilter)

  // Eligible schedules: schedules that match the selected level and branch
  const eligibleSchedules = useMemo(() => {
    if (levelFilter === "all") return []
    return schedules.filter((s) => {
      const matchesLevel = s.level_id?.toString() === levelFilter
      const matchesBranch = branchFilter === "all" || s.branch_id?.toString() === branchFilter
      return matchesLevel && matchesBranch
    })
  }, [levelFilter, branchFilter, schedules])

  // Build toggleable columns list — exclude select, actions, full_name (always visible)
  const toggleableColumns = columns.filter((col) => {
    const id = col.id || (col as any).accessorKey
    return id !== "select" && id !== "actions" && id !== "full_name"
  })

  // Get column IDs ordered according to columnOrder state, or use default order
  // Exclude select, actions, full_name from reorderable items - they are fixed positions
  // Select is always first, full_name second, actions at the very end
  const orderedColumnIds = columnOrder.length > 0
    ? columnOrder.filter((id) => toggleableColumns.some((col) => {
      const colId = col.id || (col as any).accessorKey
      return colId === id
    }))
    : toggleableColumns.map((col) => col.id || (col as any).accessorKey)

  // Add any missing columns (new fields, etc.)
  const allToggleableIds = toggleableColumns.map((col) => col.id || (col as any).accessorKey)
  const missingIds = allToggleableIds.filter((id) => !orderedColumnIds.includes(id))
  const finalColumnIds = [...orderedColumnIds, ...missingIds]

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      const oldIndex = finalColumnIds.indexOf(active.id as string)
      const newIndex = finalColumnIds.indexOf(over.id as string)
      const newColumnIds = arrayMove(finalColumnIds, oldIndex, newIndex)

      // Build complete column order including fixed columns
      // Select is always first, full_name second, actions at the very end
      const fixedStartColumns = ["select", "full_name"]
      const fixedEndColumns = ["actions"]
      const newColumnOrder = [...fixedStartColumns, ...newColumnIds, ...fixedEndColumns]
      onColumnOrderChange(newColumnOrder)
    }
  }

  return (
    <div className="flex items-center gap-2 h-11">
      <Select
        value={levelFilter}
        onValueChange={(v) => {
          onLevelFilterChange(v)
          onBranchFilterChange("all")
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {levels.map((l) => (
            <SelectItem key={l.id} value={l.id.toString()}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {availableBranches.length > 0 && (
        <Select value={branchFilter} onValueChange={onBranchFilterChange} disabled={levelFilter === "all"}>
          <SelectTrigger>
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {availableBranches.map((b) => (
              <SelectItem key={b.id} value={b.id.toString()}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/** Schedule Filter (Don't show unless level is selected) */}
      {eligibleSchedules.length > 0 && (
        <Select value={scheduleFilter} onValueChange={onScheduleFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Schedule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schedules</SelectItem>
            {eligibleSchedules.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}


      {/* Column visibility toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-sm">
            <IconColumns3 className="size-4" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">Toggle & reorder columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext items={finalColumnIds as UniqueIdentifier[]} strategy={verticalListSortingStrategy}>
              {finalColumnIds.map((colId) => {
                const col = toggleableColumns.find((c) => (c.id || (c as any).accessorKey) === colId)
                if (!col) return null

                const field = fields.find((f) => `field_${f.id}` === colId)
                const displayName = field ? field.name : (colId || "").replace(/_/g, " ")
                const isVisible = columnVisibility[colId] !== false
                const canDrag = true // All toggleable columns can be reordered

                return (
                  <SortableColumnItem
                    key={colId}
                    id={colId}
                    displayName={displayName}
                    isVisible={isVisible}
                    onToggleVisibility={(v) => onToggleColumn(colId, v)}
                    canDrag={canDrag}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── Secondary Toolbar (filter chips + bulk actions) ──────────

export function StudentsSecondaryToolbar({
  levels,
  branches,
  schedules,
  levelFilter,
  branchFilter,
  scheduleFilter,
  onLevelFilterChange,
  onBranchFilterChange,
  onScheduleFilterChange,
  selectedCount,
  onBulkArchive,
  onBulkDelete,
  onClearSelection,
}: SecondaryToolbarProps) {
  const hasFilters = levelFilter !== "all" || branchFilter !== "all" || scheduleFilter !== "all"

  // Get eligible schedules for display
  const eligibleSchedules = schedules.filter((s) => {
    const matchesLevel = levelFilter === "all" || s.level_id?.toString() === levelFilter
    const matchesBranch = branchFilter === "all" || s.branch_id?.toString() === branchFilter
    return matchesLevel && matchesBranch
  })

  if (!hasFilters && selectedCount === 0) return null

  return (
    <>
      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {levelFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs pl-2 pr-1">
              Level: {levels.find((l) => l.id.toString() === levelFilter)?.name}
              <button
                onClick={() => {
                  onLevelFilterChange("all")
                  onBranchFilterChange("all")
                }}
                className="ml-0.5 hover:text-foreground"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          )}
          {branchFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs pl-2 pr-1">
              Branch: {branches.find((b) => b.id.toString() === branchFilter)?.name}
              <button
                onClick={() => onBranchFilterChange("all")}
                className="ml-0.5 hover:text-foreground"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          )}
          {scheduleFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs pl-2 pr-1">
              Schedule: {eligibleSchedules.find((s) => s.id.toString() === scheduleFilter)?.name}
              <button
                onClick={() => onScheduleFilterChange("all")}
                className="ml-0.5 hover:text-foreground"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          )}
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              onLevelFilterChange("all")
              onBranchFilterChange("all")
              onScheduleFilterChange("all")
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 h-11 px-4 py-2.5 rounded-lg border bg-muted/30 animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={onBulkArchive}
          >
            <IconArchive className="size-3.5" />
            Archive
          </Button>
          <Button
            size="sm"
            className="h-6.5 text-xs gap-1.5 border-destructive bg-destructive/20 border-1 hover:bg-destructive/30"
            onClick={onBulkDelete}
          >
            <IconTrash className="size-3.5" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      )}
    </>
  )
}
