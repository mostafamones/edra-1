"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  ColumnOrderState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table"

import type { Group, Schedule, StudentField, StudentWithLevelRating } from "@/lib/types"

import { useStudentFilters } from "../store/use-student-filters"
import { getStudentSearchString } from "../utils/table-helpers"

const COLUMN_VISIBILITY_KEY = "edra-students-column-visibility"
const COLUMN_ORDER_KEY = "edra-students-column-order"

const DEFAULT_HIDDEN: VisibilityState = {
  created_at: false,
}

export function useStudentsViewState({
  students,
  schedules,
  groups,
  levels,
  fields,
}: {
  students: StudentWithLevelRating[]
  schedules: Schedule[]
  groups: Group[]
  levels: { id: number; name: string }[]
  fields: StudentField[]
}) {
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
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
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
      if (!saved) return []

      const parsed = JSON.parse(saved) as string[]
      const withoutFixed = parsed.filter(
        (id) => id !== "actions" && id !== "select" && id !== "full_name"
      )
      return ["select", "full_name", ...withoutFixed, "actions"]
    } catch {
      return []
    }
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [searchQuery])

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

  const filteredStudents = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase()

    return students.filter((student) => {
      if (!showArchived && student.is_archived) return false
      if (levelFilter !== "all" && student.level_id?.toString() !== levelFilter) return false
      if (groupFilter !== "all" && student.group_id?.toString() !== groupFilter) return false
      if (scheduleFilter !== "all") {
        const hasSchedule = student.schedule_enrollments?.some(
          (enrollment) => enrollment.schedule?.id?.toString() === scheduleFilter
        )
        if (!hasSchedule) return false
      }
      if (normalizedQuery.length >= 2) {
        const searchString = getStudentSearchString(student, fields)
        if (!searchString.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [students, showArchived, levelFilter, groupFilter, scheduleFilter, debouncedSearchQuery, fields])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (levelFilter !== "all") count++
    if (groupFilter !== "all") count++
    if (scheduleFilter !== "all") count++
    if (showArchived) count++
    return count
  }, [groupFilter, levelFilter, scheduleFilter, showArchived])

  const availableGroups = useMemo(() => {
    if (levelFilter === "all") return []
    return groups.filter((group) => group.level_id?.toString() === levelFilter)
  }, [groups, levelFilter])

  const availableSchedules = useMemo(() => {
    if (levelFilter === "all") return []
    return schedules
      .filter((schedule) => schedule.level_id?.toString() === levelFilter)
      .map((schedule) => ({ id: schedule.id, name: schedule.name }))
  }, [schedules, levelFilter])

  const selectedIds = useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((key) => filteredStudents[parseInt(key, 10)]?.id)
        .filter(Boolean) as number[],
    [filteredStudents, rowSelection]
  )

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  const activeFilters = useMemo(
    () => [
      ...(levelFilter !== "all"
        ? [
            {
              id: "level",
              label: "Level",
              value: levels.find((level) => level.id.toString() === levelFilter)?.name || levelFilter,
            },
          ]
        : []),
      ...(groupFilter !== "all"
        ? [
            {
              id: "group",
              label: "Group",
              value: groups.find((group) => group.id.toString() === groupFilter)?.name || groupFilter,
            },
          ]
        : []),
      ...(scheduleFilter !== "all"
        ? [
            {
              id: "schedule",
              label: "Schedule",
              value:
                schedules.find((schedule) => schedule.id.toString() === scheduleFilter)?.name ||
                scheduleFilter,
            },
          ]
        : []),
      ...(showArchived ? [{ id: "archived", label: "Archived", value: "Shown" }] : []),
    ],
    [groupFilter, groups, levelFilter, levels, scheduleFilter, schedules, showArchived]
  )

  return {
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
  }
}

