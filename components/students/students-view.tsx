"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ColumnOrderState, VisibilityState, RowSelectionState } from "@tanstack/react-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import type {
  StudentWithLevelRating,
  StudentField,
  Level,
  Group,
  ScheduleWithRelations,
} from "@/lib/types"

import { StudentDataTable } from "./student-data-table"
import { buildFullColumns } from "./columns"
import { getStudentSearchString } from "./helpers"
import { StudentsPageToolbar } from "./students-page-toolbar"
import { useStudentFilters } from "@/lib/store"
import {
  PageToolbar,
  PageToolbarActions,
  PageToolbarGroup,
  PageToolbarSearch,
} from "@/components/shell"

import { DataTableFilterPopover } from "@/components/ui/data-table-filter-popover"
import { DataTableBulkActions } from "@/components/ui/data-table-bulk-actions"
import { ActiveFilterBadges } from "@/components/ui/active-filter-badges"
import { DraggableColumnDropdown } from "@/components/ui/draggable-column-dropdown"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { withAcademyPath } from "@/components/helpers/sidebar"

// ─── Persistence Keys ─────────────────────────────────────────

const COLUMN_VISIBILITY_KEY = "edra-students-column-visibility"
const COLUMN_ORDER_KEY = "edra-students-column-order"

const DEFAULT_HIDDEN: VisibilityState = {
  created_at: false,
}

export interface StudentsViewProps {
  academyId: string
  students: StudentWithLevelRating[]
  schedules: ScheduleWithRelations[]
  levels: Level[]
  groups: Group[]
  fields: StudentField[]
  /** When set (e.g. from use-data), called after mutations. Defaults to router.refresh(). */
  onDataRefresh?: () => void | Promise<void>
}

export function StudentsView({
  academyId,
  students,
  schedules,
  levels,
  groups,
  fields: rawFields,
  onDataRefresh,
}: StudentsViewProps) {
  const router = useRouter()
  const pathname = usePathname()

  const fields = useMemo(
    () => rawFields.filter((f) => f.is_active !== false),
    [rawFields]
  )

  const refresh = useCallback(() => {
    if (onDataRefresh) {
      void Promise.resolve(onDataRefresh())
    } else {
      router.refresh()
    }
  }, [onDataRefresh, router])

  const {
    levelFilter,
    groupFilter,
    scheduleFilter,
    showArchived,
    setLevelFilter,
    setGroupFilter,
    setScheduleFilter,
    setShowArchived,
    resetFilters,
  } = useStudentFilters()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return DEFAULT_HIDDEN
    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_HIDDEN
    } catch {
      return DEFAULT_HIDDEN
    }
  })
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(COLUMN_ORDER_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as string[]
        const withoutFixed = parsed.filter((id) => id !== "actions" && id !== "select" && id !== "full_name")
        return ["select", "full_name", ...withoutFixed, "actions"]
      }
      return []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility))
    }
  }, [columnVisibility])

  useEffect(() => {
    if (typeof window !== "undefined" && columnOrder.length > 0) {
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder))
    }
  }, [columnOrder])

  const [deleteTarget, setDeleteTarget] = useState<StudentWithLevelRating | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<StudentWithLevelRating | null>(null)
  const [bulkAction, setBulkAction] = useState<"delete" | "archive" | null>(null)
  const [isActioning, setIsActioning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [searchQuery])

  const filteredData = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase()

    return students.filter((s) => {
      if (!showArchived && s.is_archived) return false
      if (levelFilter !== "all" && s.level_id?.toString() !== levelFilter) return false
      if (groupFilter !== "all" && s.group_id?.toString() !== groupFilter) return false
      if (scheduleFilter !== "all") {
        const hasSchedule = s.schedule_enrollments?.some(
          (ss) => ss.schedule?.id?.toString() === scheduleFilter
        )
        if (!hasSchedule) return false
      }
      if (normalizedQuery.length >= 2) {
        const searchStr = getStudentSearchString(s, fields)
        if (!searchStr.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [students, levelFilter, groupFilter, scheduleFilter, showArchived, debouncedSearchQuery, fields])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (levelFilter !== "all") count++
    if (groupFilter !== "all") count++
    if (scheduleFilter !== "all") count++
    if (showArchived) count++
    return count
  }, [levelFilter, groupFilter, scheduleFilter, showArchived])

  const availableLevels = useMemo(() => levels, [levels])

  const availableGroups = useMemo(() => {
    if (levelFilter === "all") return []
    return groups.filter((g) => g.level_id?.toString() === levelFilter)
  }, [groups, levelFilter])

  const availableSchedules = useMemo(() => {
    if (levelFilter === "all") return []
    return schedules
      .filter((s) => s.level_id?.toString() === levelFilter)
      .map((s) => ({ id: s.id, name: s.name }))
  }, [schedules, levelFilter])

  const handleEdit = useCallback(
    (student: StudentWithLevelRating) => {
      router.push(withAcademyPath(pathname, `/students/edit/${student.id}`))
    },
    [router, pathname]
  )

  const columns = useMemo(
    () => buildFullColumns(fields, handleEdit, setDeleteTarget, setArchiveTarget),
    [fields, handleEdit]
  )

  const handleSingleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsActioning(true)
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.details || "Failed to delete")
      }
      setDeleteTarget(null)
      setRowSelection({})
      toast.success(`Deleted ${deleteTarget.full_name}`)
      refresh()
    } catch (err: any) {
      toast.error(err?.message || "Could not delete student")
    } finally {
      setIsActioning(false)
    }
  }, [deleteTarget, refresh])

  const handleSingleArchive = useCallback(async () => {
    if (!archiveTarget) return
    setIsActioning(true)
    try {
      const isArchived = archiveTarget.is_archived
      const res = await fetch(`/api/students/${archiveTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: !isArchived }),
      })
      if (!res.ok) throw new Error("Failed to update student")
      setArchiveTarget(null)
      toast.success(isArchived ? "Unarchived" : "Archived")
      refresh()
    } catch (err: any) {
      toast.error(err?.message || "Could not update student")
    } finally {
      setIsActioning(false)
    }
  }, [archiveTarget, refresh])

  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((k) => filteredData[parseInt(k)]?.id)
      .filter(Boolean)
  }, [rowSelection, filteredData])

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedIds.length === 0) return
    setIsActioning(true)
    try {
      if (bulkAction === "delete") {
        await Promise.all(
          selectedIds.map((id) => fetch(`/api/students/${id}`, { method: "DELETE" }))
        )
        toast.success(`Deleted ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}`)
      } else if (bulkAction === "archive") {
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`/api/students/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_archived: true }),
            })
          )
        )
        toast.success(`Archived ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}`)
      }
      setRowSelection({})
      setBulkAction(null)
      refresh()
    } catch (err: any) {
      toast.error(err?.message || "Bulk action failed")
    } finally {
      setIsActioning(false)
    }
  }, [bulkAction, selectedIds, refresh])

  return (
    <div className="space-y-4">
      <PageToolbar>
        <PageToolbarSearch
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search all columns..."
        />

        <PageToolbarActions>
          <PageToolbarGroup>
            <DataTableFilterPopover
              activeFilterCount={activeFilterCount}
              onClear={resetFilters}
              iconOnly
              tooltip="Filters"
              triggerSize="icon"
            >
              <Select
                value={levelFilter}
                onValueChange={(v) => {
                  setLevelFilter(v)
                  setGroupFilter("all")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {availableLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Select
                        value={groupFilter}
                        onValueChange={setGroupFilter}
                        disabled={levelFilter === "all" || availableGroups.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Groups</SelectItem>
                          {availableGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  {levelFilter === "all" && (
                    <TooltipContent>
                      <p>Select a level first</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Select
                        value={scheduleFilter}
                        onValueChange={setScheduleFilter}
                        disabled={levelFilter === "all"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Schedules</SelectItem>
                          {availableSchedules.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  {levelFilter === "all" && (
                    <TooltipContent>
                      <p>Select a level first</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center justify-between py-1">
                <Label htmlFor="students-show-archived" className="text-sm cursor-pointer">
                  Show Archived
                </Label>
                <Switch
                  id="students-show-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                  size="sm"
                />
              </div>
            </DataTableFilterPopover>

            <DraggableColumnDropdown
              columns={columns}
              columnVisibility={columnVisibility}
              onToggleColumn={(colId, visible) =>
                setColumnVisibility((prev) => ({ ...prev, [colId]: visible }))
              }
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              fixedStartColumns={["select", "full_name"]}
              fixedEndColumns={["actions"]}
              getColumnName={(id) => {
                const field = fields.find((f) => `field_${f.id}` === id)
                return field ? field.name : id.replace(/_/g, " ")
              }}
              iconOnly
              tooltip="Columns"
              triggerSize="icon"
            />
          </PageToolbarGroup>

          <PageToolbarGroup>
            <StudentsPageToolbar
              academyId={academyId}
              levels={levels}
              groups={groups}
              fields={fields}
              schedules={schedules}
              existingStudentNames={students.map((student) => student.full_name)}
              onRefresh={refresh}
            />
          </PageToolbarGroup>
        </PageToolbarActions>
      </PageToolbar>

      <DataTableBulkActions
        selectedCount={selectedCount}
        onClear={() => setRowSelection({})}
        label={`${selectedCount} student${selectedCount !== 1 ? "s" : ""} selected`}
        actions={[
          {
            label: "Archive",
            onClick: () => setBulkAction("archive"),
            disabled: isActioning,
            loading: isActioning && bulkAction === "archive",
          },
          {
            label: "Delete",
            onClick: () => setBulkAction("delete"),
            disabled: isActioning,
            loading: isActioning && bulkAction === "delete",
            variant: "destructive",
          },
        ]}
      />

      <ActiveFilterBadges
        filters={[
          ...(levelFilter !== "all"
            ? [
                {
                  id: "level",
                  label: "Level",
                  value: levels.find((l) => l.id.toString() === levelFilter)?.name || levelFilter,
                },
              ]
            : []),
          ...(groupFilter !== "all"
            ? [
                {
                  id: "group",
                  label: "Group",
                  value: groups.find((g) => g.id.toString() === groupFilter)?.name || groupFilter,
                },
              ]
            : []),
          ...(scheduleFilter !== "all"
            ? [
                {
                  id: "schedule",
                  label: "Schedule",
                  value: schedules.find((s) => s.id.toString() === scheduleFilter)?.name || scheduleFilter,
                },
              ]
            : []),
          ...(showArchived ? [{ id: "archived", label: "Archived", value: "Shown" }] : []),
        ]}
        onRemove={(id) => {
          if (id === "level") {
            setLevelFilter("all")
            setGroupFilter("all")
          } else if (id === "group") setGroupFilter("all")
          else if (id === "schedule") setScheduleFilter("all")
          else if (id === "archived") setShowArchived(false)
        }}
        onClearAll={resetFilters}
      />

      <StudentDataTable
        data={filteredData}
        columns={columns}
        paginated
        defaultPageSize={10}
        selectable
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        emptyMessage={
          debouncedSearchQuery.trim().length >= 2 ||
          levelFilter !== "all" ||
          groupFilter !== "all" ||
          scheduleFilter !== "all"
            ? "No students match your search or filters"
            : "No students yet"
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        variant="delete"
        entity="student"
        targetIdentifier={deleteTarget?.full_name}
        onConfirm={handleSingleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isActioning}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        variant="archive"
        title={`${archiveTarget?.is_archived ? "Unarchive" : "Archive"} Student`}
        description={
          archiveTarget?.is_archived
            ? "This student will be unarchived and will appear in the main list."
            : "This student will be archived and hidden from the main list. You can unarchive them later."
        }
        confirmLabel={archiveTarget?.is_archived ? "Unarchive" : "Archive"}
        onConfirm={handleSingleArchive}
        onCancel={() => setArchiveTarget(null)}
        loading={isActioning}
      />

      <ConfirmDialog
        open={!!bulkAction}
        onOpenChange={(open) => !open && setBulkAction(null)}
        variant={bulkAction === "delete" ? "delete" : "archive"}
        title={`${bulkAction === "delete" ? "Delete" : "Archive"} Students`}
        description={
          bulkAction === "delete"
            ? "This will permanently delete the selected students and all their associated data. This cannot be undone."
            : "The selected students will be archived. You can unarchive them later."
        }
        confirmLabel={bulkAction === "delete" ? "Delete" : "Archive"}
        onConfirm={handleBulkAction}
        loading={isActioning}
      />
    </div>
  )
}
