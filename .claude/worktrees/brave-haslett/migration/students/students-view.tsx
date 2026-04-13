"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { ColumnOrderState, VisibilityState, RowSelectionState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { IconUserPlus, IconUpload, IconColumns3 } from "@tabler/icons-react"
import { toast } from "sonner"
import type { StudentWithLevelRating } from "@/lib"

import { StudentDataTable } from "./student-data-table"
import { StudentSheet } from "./student-sheet"
import { StudentImportDialog } from "./student-import-dialog"
import { buildFullColumns } from "./columns"
import { getStudentSearchString } from "./helpers"
import { getCurrentUserAcademy } from "@/lib"

// Data hooks and stores
import {
  useStudents,
  useSchedules,
  useBranches,
  useLevels,
  useFields,
  invalidateStudents,
  invalidateFields,
} from "@/lib/hooks/use-data"
import { useStudentFilters } from "@/lib/store"

// Generic UI
import { DataTableFilterPopover } from "@/components/ui/data-table-filter-popover"
import { DataTableBulkActions } from "@/components/ui/data-table-bulk-actions"
import { ActiveFilterBadges } from "@/components/ui/active-filter-badges"
import { DraggableColumnDropdown } from "@/components/ui/draggable-column-dropdown"
import { DeleteDialog } from "../delete-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataSkeleton } from "../ui/data-skeleton"
import { Header } from "../header"
import { Refresh } from "../refresh"
import { SiteHeader } from "../site-header"

// ─── Persistence Keys ─────────────────────────────────────────

const COLUMN_VISIBILITY_KEY = "edra-students-column-visibility"
const COLUMN_ORDER_KEY = "edra-students-column-order"

const DEFAULT_HIDDEN: VisibilityState = {
  email: false,
  created_at: false,
}

// ─── Main Component ───────────────────────────────────────────

export function StudentsView() {
  const [academyId, setAcademyId] = useState<string | null>(null)

  // 1. Academy setup
  useEffect(() => {
    async function init() {
      const id = await getCurrentUserAcademy()
      if (id) {
        setAcademyId(id)
      } else {
        toast.error("Failed to load academy information")
      }
    }
    init()
  }, [])

  // 2. Data fetching
  const { data: rawStudents, loading: loadingStudents, refresh: refreshStudentsFn } = useStudents(academyId)
  const { data: rawSchedules, loading: loadingSchedules } = useSchedules(academyId)
  const { data: rawBranches, loading: loadingBranches } = useBranches(academyId)
  const { data: rawLevels, loading: loadingLevels } = useLevels(academyId)
  const { data: rawFields, loading: loadingFields, refresh: refreshFieldsFn } = useFields(academyId)

  const loading = loadingStudents || loadingSchedules || loadingBranches || loadingLevels || loadingFields || !academyId

  const students = rawStudents || []
  const schedules = rawSchedules || []
  const branches = rawBranches || []
  const levels = rawLevels || []
  const fields = useMemo(() => (rawFields || []).filter((f) => f.is_active !== false), [rawFields])

  // Refresh helper for mutations
  const refreshStudents = useCallback(() => {
    invalidateStudents()
    refreshStudentsFn()
    invalidateFields()
    refreshFieldsFn()
  }, [refreshStudentsFn, refreshFieldsFn])

  // 3. Filters
  const {
    levelFilter,
    branchFilter,
    scheduleFilter,
    showArchived,
    setLevelFilter,
    setBranchFilter,
    setScheduleFilter,
    setShowArchived,
    resetFilters,
  } = useStudentFilters()

  // 4. Persistence for Table
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

  // 5. Dialogs & UI states
  const [deleteTarget, setDeleteTarget] = useState<StudentWithLevelRating | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<StudentWithLevelRating | null>(null)

  const [bulkAction, setBulkAction] = useState<"delete" | "archive" | null>(null)
  const [isActioning, setIsActioning] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithLevelRating | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // ── Filtered data ──────────────────────────────────────────
  const filteredData = useMemo(() => {
    return students.filter((s) => {
      // Archived
      if (!showArchived && s.is_archived) return false

      // Level
      if (levelFilter !== "all" && s.level_id?.toString() !== levelFilter) return false

      // Branch
      if (branchFilter !== "all" && s.branch_id?.toString() !== branchFilter) return false

      // Schedule
      if (scheduleFilter !== "all") {
        const hasSchedule = s.schedule_enrollments?.some(
          (ss) => ss.schedule?.id?.toString() === scheduleFilter
        )
        if (!hasSchedule) return false
      }

      return true
    })
  }, [students, levelFilter, branchFilter, scheduleFilter, showArchived])

  // Filter aggregations
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (levelFilter !== "all") count++
    if (branchFilter !== "all") count++
    if (scheduleFilter !== "all") count++
    if (showArchived) count++
    return count
  }, [levelFilter, branchFilter, scheduleFilter, showArchived])

  const availableLevels = useMemo(() => levels, [levels])

  const availableBranches = useMemo(() => {
    if (levelFilter === "all") return []
    // Branches that belong to the selected level 
    // Usually inferred from students or schedules in the level. 
    // Here we find branches linked through students in the selected level:
    const branchIds = new Set(
      students
        .filter((s) => s.level_id?.toString() === levelFilter)
        .map((s) => s.branch_id?.toString())
        .filter(Boolean)
    )
    return branches.filter((b) => branchIds.has(b.id.toString()))
  }, [students, branches, levelFilter])

  const availableSchedules = useMemo(() => {
    if (levelFilter === "all") return []
    return schedules.filter(s => s.level_id?.toString() === levelFilter).map((s) => ({ id: s.id, name: s.name }))
  }, [schedules, levelFilter])

  // ── Search function ───────────────────────────────────────
  const searchFn = useCallback(
    (student: StudentWithLevelRating, query: string) => {
      const searchStr = getStudentSearchString(student, fields)
      return searchStr.includes(query.toLowerCase())
    },
    [fields]
  )

  // ── Columns ──────────────────────────────────────────────
  const handleEdit = useCallback((student: StudentWithLevelRating) => {
    setEditingStudent(student)
    setSheetOpen(true)
  }, [])

  const columns = useMemo(
    () => buildFullColumns(fields, handleEdit, setDeleteTarget, setArchiveTarget),
    [fields, handleEdit]
  )

  // ── Actions ───────────────────────────────────────────────
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
      refreshStudents()
    } catch (err: any) {
      toast.error(err?.message || "Could not delete student")
    } finally {
      setIsActioning(false)
    }
  }, [deleteTarget, refreshStudents])

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
      refreshStudents()
    } catch (err: any) {
      toast.error(err?.message || "Could not update student")
    } finally {
      setIsActioning(false)
    }
  }, [archiveTarget, refreshStudents])

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
          selectedIds.map((id) =>
            fetch(`/api/students/${id}`, { method: "DELETE" })
          )
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
      refreshStudents()
    } catch (err: any) {
      toast.error(err?.message || "Bulk action failed")
    } finally {
      setIsActioning(false)
    }
  }, [bulkAction, selectedIds, refreshStudents])

  // ─── Render Components ─────────────────────────────────────

  if (loading) {
    return (
      <>
        <SiteHeader title="Students" subtitle="Manage your students" />
        <div className="p-4 lg:p-6 space-y-4">
          <DataSkeleton
            variant="table"
            showHeader={false}
            count={10}
            columns={columns.filter((col) => columnVisibility[(col.id || (col as any).accessorKey) as string] !== false).length}
            showSearch={true}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader
        title="Students"
        subtitle={`${students.length} total ${filteredData.length !== students.length ? ` · ${filteredData.length} shown` : ""}`}
        actions={
          <>
            <Refresh func={refreshStudents} variant="ghost" />
            <Button
              variant="ghost"
              className="gap-1.5"
              onClick={() => setImportDialogOpen(true)}
            >
              <IconUpload className="size-4" />
              Import
            </Button>
            <Button
              className="gap-1.5"
              variant="ghost"
              onClick={() => {
                setEditingStudent(null)
                setSheetOpen(true)
              }}
            >
              <IconUserPlus className="size-4" />
              Add Student
            </Button>
          </>
        }
      />
      <div className="py-4 px-8 lg:px-6 space-y-4">

        {/* Bulk Actions Toolbar */}
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

        {/* Active Filter Badges */}
        <ActiveFilterBadges
          filters={[
            ...(levelFilter !== "all" ? [{
              id: "level",
              label: "Level",
              value: levels.find((l) => l.id.toString() === levelFilter)?.name || levelFilter,
            }] : []),
            ...(branchFilter !== "all" ? [{
              id: "branch",
              label: "Branch",
              value: branches.find((b) => b.id.toString() === branchFilter)?.name || branchFilter,
            }] : []),
            ...(scheduleFilter !== "all" ? [{
              id: "schedule",
              label: "Schedule",
              value: schedules.find((s) => s.id.toString() === scheduleFilter)?.name || scheduleFilter,
            }] : []),
            ...(showArchived ? [{
              id: "archived",
              label: "Archived",
              value: "Shown",
            }] : []),
          ]}
          onRemove={(id) => {
            if (id === "level") setLevelFilter("all")
            else if (id === "branch") setBranchFilter("all")
            else if (id === "schedule") setScheduleFilter("all")
            else if (id === "archived") setShowArchived(false)
          }}
          onClearAll={resetFilters}
        />

        {/* Data Table */}
        <StudentDataTable
          data={filteredData}
          columns={columns}
          searchable
          searchPlaceholder="Search all columns..."
          searchFn={searchFn}
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
            levelFilter !== "all" || branchFilter !== "all" || scheduleFilter !== "all"
              ? "No students match your filters"
              : "No students yet"
          }
          searchRight={
            <div className="flex items-center gap-2">
              <DataTableFilterPopover
                activeFilterCount={activeFilterCount}
                onClear={resetFilters}
              >
                <Select
                  value={levelFilter}
                  onValueChange={setLevelFilter}
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
                          value={branchFilter}
                          onValueChange={setBranchFilter}
                          disabled={levelFilter === "all" || availableBranches.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {availableBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id.toString()}>
                                {branch.name}
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

                {/* Schedule filter is always visible per user request */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Select
                          value={scheduleFilter}
                          onValueChange={setScheduleFilter}
                          disabled={levelFilter === "all" && !schedules.some((s) => s.id === Number(scheduleFilter))}
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

                {/* Show Archived Toggle */}
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

              {/* Column visibility toggle */}
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
              />
            </div>
          }
        />
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onDelete={handleSingleDelete}
        entity="student"
        targetIdentifier={deleteTarget?.full_name || "this student"}
      />

      {/* Archive Dialog */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        entity="student"
        targetIdentifier={archiveTarget?.full_name || "this student"}
        variant="archive"
        title={`${archiveTarget?.is_archived ? "Unarchive" : "Archive"} Student`}
        description={
          archiveTarget?.is_archived
            ? "This student will be unarchived and will appear in the main list."
            : "This student will be archived and hidden from the main list. You can unarchive them later."
        }
        onConfirm={handleSingleArchive}
        loading={isActioning}
      />

      {/* Bulk Action Dialog */}
      <ConfirmDialog
        open={!!bulkAction}
        onOpenChange={(open) => !open && setBulkAction(null)}
        entity="student"
        targetIdentifier={`${selectedCount} selected student${selectedCount !== 1 ? "s" : ""}`}
        variant={bulkAction === "delete" ? "delete" : "archive"}
        title={`${bulkAction === "delete" ? "Delete" : "Archive"} Students`}
        description={
          bulkAction === "delete"
            ? "This will permanently delete the selected students and all their associated data. This cannot be undone."
            : "The selected students will be archived. You can unarchive them later."
        }
        onConfirm={handleBulkAction}
        loading={isActioning}
        confirmLabel={bulkAction === "delete" ? "Delete" : "Archive"}
      />

      {/* Student Form Sheet */}
      <StudentSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditingStudent(null)
        }}
        student={editingStudent}
        academyId={academyId || ""}
        onSuccess={refreshStudents}
      />

      {/* Import Dialog */}
      <StudentImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={refreshStudents}
        academyId={academyId || ""}
        levels={levels}
        branches={branches}
        customFields={fields}
        existingStudents={students.map(s => s.full_name)}
        schedules={schedules}
      />
    </>
  )
}
