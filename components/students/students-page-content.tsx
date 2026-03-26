"use client"

import { useCallback, useMemo } from "react"
import { SiteHeader } from "@/components/site-header"
import { StudentsView } from "./students-view"
import { StudentsPageToolbar } from "./students-page-toolbar"
import { DataSkeleton } from "@/components/ui/data-skeleton"
import {
  useStudents,
  useSchedules,
  useLevels,
  useGroups,
  useFields,
  invalidateStudents,
  invalidateSchedules,
  invalidateLevels,
  invalidateGroups,
  invalidateFields,
} from "@/lib/hooks/use-data"

export function StudentsPageContent({ academyId }: { academyId: string }) {
  const { data: students, loading: loadingStudents, refresh: refreshStudents } =
    useStudents(academyId)
  const { data: schedules, loading: loadingSchedules, refresh: refreshSchedules } =
    useSchedules(academyId)
  const { data: levels, loading: loadingLevels, refresh: refreshLevels } = useLevels(academyId)
  const { data: groups, loading: loadingGroups, refresh: refreshGroups } = useGroups(academyId)
  const { data: fieldsRaw, loading: loadingFields, refresh: refreshFields } = useFields(academyId)

  const loading =
    loadingStudents || loadingSchedules || loadingLevels || loadingGroups || loadingFields

  const refreshAll = useCallback(async () => {
    invalidateStudents()
    invalidateSchedules()
    invalidateLevels()
    invalidateGroups()
    invalidateFields()
    await Promise.all([
      refreshStudents(),
      refreshSchedules(),
      refreshLevels(),
      refreshGroups(),
      refreshFields(),
    ])
  }, [refreshStudents, refreshSchedules, refreshLevels, refreshGroups, refreshFields])

  const studentsArr = students ?? []
  const schedulesArr = schedules ?? []
  const levelsArr = levels ?? []
  const groupsArr = groups ?? []
  const fieldsArr = fieldsRaw ?? []

  const activeFields = useMemo(
    () => fieldsArr.filter((f) => f.is_active !== false),
    [fieldsArr]
  )

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <SiteHeader title="Students" subtitle="Loading…" />
        <div className="p-4 lg:p-6 space-y-4">
          <DataSkeleton
            variant="table"
            showHeader={false}
            count={10}
            columns={5}
            showSearch
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <SiteHeader
        title="Students"
        actions={
          <StudentsPageToolbar
            academyId={academyId}
            levels={levelsArr}
            groups={groupsArr}
            fields={activeFields}
            schedules={schedulesArr}
            existingStudentNames={studentsArr.map((s) => s.full_name)}
            onRefresh={refreshAll}
          />
        }
      />
      <main className="flex-1 overflow-y-auto py-4 px-8 lg:px-6">
        <StudentsView
          students={studentsArr}
          schedules={schedulesArr}
          levels={levelsArr}
          groups={groupsArr}
          fields={fieldsArr}
          onDataRefresh={refreshAll}
        />
      </main>
    </div>
  )
}
