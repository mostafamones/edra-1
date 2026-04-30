"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { StudentWithLevelRating } from "@/lib/types"
import { toast } from "sonner"

import { withAcademyPath } from "@/components/helpers/sidebar"
import {
  PageToolbar,
  PageToolbarActions,
  PageToolbarFooter,
  PageToolbarGroup,
  PageToolbarSearch,
} from "@/components/shell"
import { ActiveFilterBadges } from "@/components/ui/active-filter-badges"
import { DataTableBulkActions } from "@/components/ui/data-table-bulk-actions"
import { getErrorMessage } from "@/lib/get-error-message"

import { useStudentsViewState } from "../hooks/use-students-view-state"
import * as studentMutations from "../mutations"
import type { StudentsViewProps } from "../types"
import { buildStudentTableColumns } from "./table/columns"
import { StudentTable } from "./table/student-table"
import { StudentViewDialogs } from "./student-view-dialogs"
import { StudentViewFilters } from "./student-view-filters"
import { StudentsPageToolbar } from "./students-page-toolbar"

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
  const fields = useMemo(() => rawFields.filter((field) => field.is_active !== false), [rawFields])

  const refresh = useCallback(() => {
    if (onDataRefresh) {
      void Promise.resolve(onDataRefresh())
    } else {
      router.refresh()
    }
  }, [onDataRefresh, router])

  const {
    activeFilterCount,
    activeFilters,
    availableGroups,
    availableSchedules,
    columnOrder,
    columnVisibility,
    debouncedSearchQuery,
    filteredStudents,
    groupFilter,
    levelFilter,
    resetFilters,
    rowSelection,
    scheduleFilter,
    searchQuery,
    selectedCount,
    selectedIds,
    setColumnOrder,
    setColumnVisibility,
    setGroupFilter,
    setLevelFilter,
    setRowSelection,
    setScheduleFilter,
    setSearchQuery,
    setShowArchived,
    showArchived,
  } = useStudentsViewState({
    students,
    schedules,
    groups,
    levels,
    fields,
  })

  const [deleteTarget, setDeleteTarget] = useState<StudentWithLevelRating | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<StudentWithLevelRating | null>(null)
  const [bulkAction, setBulkAction] = useState<"delete" | "archive" | null>(null)
  const [isActioning, setIsActioning] = useState(false)

  const handleEdit = useCallback(
    (student: StudentWithLevelRating) => {
      router.push(withAcademyPath(pathname, `/students/edit/${student.id}`))
    },
    [pathname, router]
  )

  const columns = useMemo(
    () => buildStudentTableColumns(fields, handleEdit, setDeleteTarget, setArchiveTarget),
    [fields, handleEdit]
  )

  const handleSingleDelete = useCallback(async () => {
    if (!deleteTarget) return

    setIsActioning(true)
    try {
      await studentMutations.deleteStudent(deleteTarget.id)
      setDeleteTarget(null)
      setRowSelection({})
      toast.success(`Deleted ${deleteTarget.full_name}`)
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error) || "Could not delete student")
    } finally {
      setIsActioning(false)
    }
  }, [deleteTarget, refresh, setRowSelection])

  const handleSingleArchive = useCallback(async () => {
    if (!archiveTarget) return

    setIsActioning(true)
    try {
      const isArchived = archiveTarget.is_archived
      await studentMutations.updateStudentRaw(archiveTarget.id, {
        is_archived: !isArchived,
      })
      setArchiveTarget(null)
      toast.success(isArchived ? "Unarchived" : "Archived")
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error) || "Could not update student")
    } finally {
      setIsActioning(false)
    }
  }, [archiveTarget, refresh])

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedIds.length === 0) return

    setIsActioning(true)
    try {
      if (bulkAction === "delete") {
        await studentMutations.bulkDeleteStudents(selectedIds)
        toast.success(`Deleted ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}`)
      } else {
        await studentMutations.bulkArchiveStudents(selectedIds)
        toast.success(
          `Archived ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}`
        )
      }

      setRowSelection({})
      setBulkAction(null)
      refresh()
    } catch (error) {
      toast.error(getErrorMessage(error) || "Bulk action failed")
    } finally {
      setIsActioning(false)
    }
  }, [bulkAction, refresh, selectedIds, setRowSelection])

  return (
    <div className="space-y-2">
      <PageToolbar>
        <PageToolbarSearch
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search all columns..."
        />

        <PageToolbarActions>
          <StudentViewFilters
            activeFilterCount={activeFilterCount}
            availableGroups={availableGroups}
            availableLevels={levels}
            availableSchedules={availableSchedules}
            columnOrder={columnOrder}
            columnVisibility={columnVisibility}
            columns={columns}
            fields={fields}
            groupFilter={groupFilter}
            levelFilter={levelFilter}
            onClearFilters={resetFilters}
            onColumnOrderChange={setColumnOrder}
            onToggleColumnVisibility={(columnId, visible) =>
              setColumnVisibility((previous) => ({ ...previous, [columnId]: visible }))
            }
            scheduleFilter={scheduleFilter}
            setGroupFilter={setGroupFilter}
            setLevelFilter={setLevelFilter}
            setScheduleFilter={setScheduleFilter}
            setShowArchived={setShowArchived}
            showArchived={showArchived}
          />

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

        <PageToolbarFooter>
          <ActiveFilterBadges
            filters={activeFilters}
            onRemove={(id) => {
              if (id === "level") {
                setLevelFilter("all")
                setGroupFilter("all")
              } else if (id === "group") {
                setGroupFilter("all")
              } else if (id === "schedule") {
                setScheduleFilter("all")
              } else if (id === "archived") {
                setShowArchived(false)
              }
            }}
            onClearAll={resetFilters}
          />
        </PageToolbarFooter>
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

      <StudentTable
        data={filteredStudents}
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

      <StudentViewDialogs
        archiveTarget={archiveTarget}
        bulkAction={bulkAction}
        deleteTarget={deleteTarget}
        isActioning={isActioning}
        onArchiveConfirm={handleSingleArchive}
        onArchiveOpenChange={(open) => !open && setArchiveTarget(null)}
        onBulkConfirm={handleBulkAction}
        onBulkOpenChange={(open) => !open && setBulkAction(null)}
        onDeleteConfirm={handleSingleDelete}
        onDeleteOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  )
}
