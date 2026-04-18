"use client"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { IconColumns3, IconGripVertical } from "@tabler/icons-react"
import type { ColumnDef, ColumnOrderState } from "@tanstack/react-table"
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

interface SortableColumnItemProps {
  id: string
  displayName: string
  isVisible: boolean
  onToggleVisibility: (visible: boolean) => void
  canDrag: boolean
}

function getColumnId<TData, TValue>(column: ColumnDef<TData, TValue>): string | null {
  if ("id" in column && typeof column.id === "string") {
    return column.id
  }

  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey
  }

  return null
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
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 pr-2">
      {canDrag && (
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing pl-2"
          tabIndex={0}
        >
          <IconGripVertical className="size-3.5" />
          <span className="sr-only">Drag to reorder</span>
        </button>
      )}
      <DropdownMenuCheckboxItem
        checked={isVisible}
        onCheckedChange={onToggleVisibility}
        className="capitalize text-xs flex-1 break-words py-1.5"
        onSelect={(e) => e.preventDefault()}
      >
        {displayName}
      </DropdownMenuCheckboxItem>
    </div>
  )
}

export interface DraggableColumnDropdownProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  columnVisibility: Record<string, boolean>
  onToggleColumn: (columnId: string, visible: boolean) => void
  columnOrder: ColumnOrderState
  onColumnOrderChange: (order: ColumnOrderState) => void
  /** Columns that order first and aren't draggable */
  fixedStartColumns?: string[]
  /** Columns that order last and aren't draggable */
  fixedEndColumns?: string[]
  /** Custom accessor to rename a column for the label */
  getColumnName?: (columnId: string) => string
}

export function DraggableColumnDropdown<TData, TValue>({
  columns,
  columnVisibility,
  onToggleColumn,
  columnOrder,
  onColumnOrderChange,
  fixedStartColumns = [],
  fixedEndColumns = [],
  getColumnName,
}: DraggableColumnDropdownProps<TData, TValue>) {
  // Build toggleable columns list — exclude fixed columns
  const toggleableColumns = columns
    .map((column) => ({ column, id: getColumnId(column) }))
    .filter((entry): entry is { column: ColumnDef<TData, TValue>; id: string } => (
      entry.id !== null &&
      !fixedStartColumns.includes(entry.id) &&
      !fixedEndColumns.includes(entry.id)
    ))

  // Get column IDs ordered according to columnOrder state, or use default order
  const orderedColumnIds = columnOrder.length > 0
    ? columnOrder.filter((id) => toggleableColumns.some((column) => column.id === id))
    : toggleableColumns.map((column) => column.id)

  // Add any missing columns (new fields, etc.)
  const allToggleableIds = toggleableColumns.map((column) => column.id)
  const missingIds = allToggleableIds.filter((id) => !orderedColumnIds.includes(id))
  const finalColumnIds = Array.from(new Set([...orderedColumnIds, ...missingIds]))

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
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

      const newColumnOrder = [...fixedStartColumns, ...newColumnIds, ...fixedEndColumns]
      onColumnOrderChange(newColumnOrder)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2 text-sm shrink-0">
          <IconColumns3 className="size-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 max-h-[400px] overflow-y-auto overflow-x-hidden">
        <DropdownMenuLabel className="text-xs font-semibold py-1">Toggle & reorder columns</DropdownMenuLabel>
        <DropdownMenuSeparator className="mb-0" />
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext items={finalColumnIds as UniqueIdentifier[]} strategy={verticalListSortingStrategy}>
            {finalColumnIds.map((colId) => {
              const columnEntry = toggleableColumns.find((column) => column.id === colId)
              if (!columnEntry) return null
              const col = columnEntry.column

              let displayName = ""
              if (getColumnName) {
                displayName = getColumnName(colId)
              } else {
                displayName = typeof col.header === "string"
                  ? col.header
                  : String(colId).replace(/_/g, " ")
              }

              const isVisible = columnVisibility[colId] !== false

              return (
                <SortableColumnItem
                  key={colId}
                  id={colId}
                  displayName={displayName}
                  isVisible={isVisible}
                  onToggleVisibility={(v) => onToggleColumn(colId, v)}
                  canDrag={true}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
