"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSchedules } from "@/lib/hooks/use-data"
import * as scheduleMutations from "@/lib/hooks/mutations"
import { getErrorMessage } from "@/lib/get-error-message"
import type { ScheduleWithRelations, ScheduleTimeSlot } from "@/lib/types"

import { SiteHeader } from "@/components/site-header"
import { withAcademyPath } from "@/components/helpers/sidebar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Refresh } from "@/components/ui/refresh"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { ScheduleSheet } from "./schedule-sheet"
import { ScheduleListView, type ScheduleRow } from "./schedule-list-view"
import { ScheduleCalendarView } from "./schedule-calendar-view"

import { IconCalendarWeek, IconList, IconPlus, IconRefresh } from "@tabler/icons-react"

export type SchedulesViewProps = {
  academyId: string
}

type ScheduleViewMode = "list" | "calendar"

const STORAGE_KEY = "edra:schedules-view-mode"

function normalizeDayOfWeek(value: number | null | undefined): number {
  if (value === null || value === undefined) return -1
  // Support legacy 1–7 storage (Mon=1..Sun=7) by mapping into 0–6 (Sun=0).
  if (value >= 1 && value <= 7) return value % 7
  // Assume already 0–6
  return value
}

function getStoredViewMode(): ScheduleViewMode {
  if (typeof window === "undefined") return "list"
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "calendar" || stored === "list" ? stored : "list"
  } catch {
    return "list"
  }
}

function setStoredViewMode(mode: ScheduleViewMode) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch (error) {
    console.error("Failed to save view mode:", error)
  }
}

export function SchedulesView({ academyId }: SchedulesViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: schedules, loading, refresh: refreshSchedules } = useSchedules(academyId)

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("list")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScheduleWithRelations | null>(null)

  useEffect(() => {
    setViewMode(getStoredViewMode())
  }, [])

  useEffect(() => {
    setStoredViewMode(viewMode)
  }, [viewMode])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await scheduleMutations.deleteSchedule(deleteTarget.id)
      refreshSchedules()
      toast.success("Schedule deleted")
      setDeleteTarget(null)
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(getErrorMessage(error) || "Could not delete schedule")
    }
  }, [deleteTarget, refreshSchedules])

  const handleToggleActive = useCallback(
    async (schedule: ScheduleWithRelations) => {
      try {
        const newActive = !schedule.is_active
        await scheduleMutations.toggleScheduleActive(schedule.id, newActive)
        refreshSchedules()
        toast.success(newActive ? "Schedule activated" : "Schedule deactivated")
      } catch (error) {
        console.error("Toggle error:", error)
        toast.error(getErrorMessage(error) || "Could not update schedule")
      }
    },
    [refreshSchedules]
  )

  const openCreatePage = useCallback(() => {
    router.push(withAcademyPath(pathname, "/schedules/create"))
  }, [router, pathname])

  const openEditSheet = useCallback((schedule: ScheduleWithRelations) => {
    setEditingSchedule(schedule)
    setSheetOpen(true)
  }, [])

  const { recurringRows, oneOffRows, activeDays, unscheduledRows } = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return {
        recurringRows: [] as ScheduleRow[],
        oneOffRows: [] as ScheduleRow[],
        activeDays: [] as { dayIndex: number; dayName: string; rows: ScheduleRow[] }[],
        unscheduledRows: [] as ScheduleRow[],
      }
    }

    const recurringRows: ScheduleRow[] = []
    const oneOffRows: ScheduleRow[] = []
    const unscheduledRows: ScheduleRow[] = []
    const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    for (const schedule of schedules) {
      const slots = schedule.time_slots || []

      if (schedule.schedule_type === "one_off") {
        if (slots.length === 0) {
          oneOffRows.push({
            schedule,
            timeSlot: {
              id: 0,
              academy_id: schedule.academy_id,
              schedule_id: schedule.id,
              day_of_week: -1,
              start_time: "",
              end_time: null,
              instance_date: schedule.one_off_date,
              created_at: null,
            },
          })
        } else {
          for (const slot of slots) {
            oneOffRows.push({ schedule, timeSlot: slot })
          }
        }
      } else {
        if (slots.length === 0) {
          const row: ScheduleRow = {
            schedule,
            timeSlot: {
              id: 0,
              academy_id: schedule.academy_id,
              schedule_id: schedule.id,
              day_of_week: -1,
              start_time: "",
              end_time: null,
              instance_date: null,
              created_at: null,
            },
          }
          recurringRows.push(row)
          unscheduledRows.push(row)
        } else {
          for (const slot of slots) {
            const normalizedDow = normalizeDayOfWeek(slot.day_of_week)
            const row: ScheduleRow = {
              schedule,
              timeSlot: {
                ...slot,
                day_of_week: normalizedDow,
              },
            }
            recurringRows.push(row)
            if (normalizedDow === -1) unscheduledRows.push(row)
          }
        }
      }
    }

    const schedulesByDay = DAYS_FULL.map((dayName, dayIndex) => ({
      dayIndex,
      dayName,
      rows: recurringRows
        .filter((r) => normalizeDayOfWeek(r.timeSlot.day_of_week) === dayIndex)
        .sort((a, b) => (a.timeSlot.start_time || "").localeCompare(b.timeSlot.start_time || "")),
    }))

    const activeDays = schedulesByDay.filter((d) => d.rows.length > 0)

    return { recurringRows, oneOffRows, activeDays, unscheduledRows }
  }, [schedules])

  const { recurringSchedules, oneOffSchedules } = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return { recurringSchedules: 0, oneOffSchedules: 0 }
    }

    const recurringSchedules = schedules.filter((s) => s.schedule_type !== "one_off").length
    const oneOffSchedules = schedules.filter((s) => s.schedule_type === "one_off").length

    return { recurringSchedules, oneOffSchedules }
  }, [schedules])

  const allRows = useMemo(
    () => [...recurringRows, ...oneOffRows] as { schedule: ScheduleWithRelations; timeSlot: ScheduleTimeSlot }[],
    [recurringRows, oneOffRows]
  )

  const subtitle = schedules?.length
    ? `${schedules.length} schedule${schedules.length !== 1 ? "s" : ""}`
    : "No schedules yet"

  const headerControls = (
    <div className="flex">
      <Refresh func={refreshSchedules} variant="ghost" />
      <Button className="gap-1.5" variant="ghost" onClick={openCreatePage}>
        <IconPlus className="size-4" />
        Add Schedule
      </Button>
    </div>
  )

  const tabs = (
    <ButtonGroup>
      <Button
        onClick={() => setViewMode("list")}
        variant={viewMode === "list" ? "default" : "ghost"}
        size="icon"
      >
        <IconList className={`size-4 ${viewMode === "list" ? "text-white" : "text-muted-foreground"}`} />
      </Button>
      <Button
        onClick={() => setViewMode("calendar")}
        variant={viewMode === "calendar" ? "default" : "ghost"}
        size="icon"
      >
        <IconCalendarWeek className={`size-4 ${viewMode === "calendar" ? "text-white" : "text-muted-foreground"}`} />
      </Button>
    </ButtonGroup>
  )

  const ListViewSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-6 rounded-full" />
            <Skeleton className="flex-1 h-px" />
          </div>
          <div className="grid gap-2">
            {[1, 2].map((j) => (
              <Skeleton key={j} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const CalendarViewSkeleton = () => (
    <div className="border rounded-xl overflow-hidden bg-background flex flex-col h-full">
      <div className="grid border-b shrink-0" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
        <div className="border-r" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="text-center py-2.5 border-r last:border-r-0">
            <div className="flex flex-row flex-1 items-center justify-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">
        <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(5, 1fr)", height: 1536 }}>
          <div className="relative border-r">
            {Array.from({ length: 24 }, (_, i) => (
              <Skeleton key={i} className="absolute w-full h-4 right-2" style={{ top: i * 64 }} />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((colIndex) => (
            <div key={colIndex} className="relative border-r last:border-r-0">
              {Array.from({ length: 24 }, (_, i) => (
                <Skeleton key={i} className="absolute w-full h-px" style={{ top: i * 64 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const isLoading = loading || !schedules

  return (
    <>
      <SiteHeader
        title="Schedules"
        subtitle={loading ? "Manage your schedules" : subtitle}
        actions={headerControls}
        tabs={tabs}
      />

      <div className={`p-4 lg:p-6 space-y-6 ${viewMode === "calendar" ? "flex flex-col flex-1" : ""}`}>
        {isLoading ? (
          <div className={`space-y-6 ${viewMode === "calendar" ? "flex-1 min-h-0" : ""}`}>
            {viewMode === "list" ? <ListViewSkeleton /> : <CalendarViewSkeleton />}
          </div>
        ) : schedules.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconRefresh className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No schedules yet</EmptyTitle>
              <EmptyDescription>Create a schedule to start organizing sessions.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={openCreatePage} className="gap-1.5">
                <IconPlus className="size-4" />
                Add Schedule
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {viewMode === "list" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <IconRefresh className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recurring</p>
                    <p className="text-2xl font-semibold">{recurringSchedules}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <IconCalendarWeek className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">One-off</p>
                    <p className="text-2xl font-semibold">{oneOffSchedules}</p>
                  </div>
                </div>
              </div>
            )}

            <div className={`space-y-6 ${viewMode === "calendar" ? "flex-1 min-h-0" : ""}`}>
              {viewMode === "list" ? (
                <ScheduleListView
                  activeDays={activeDays}
                  unscheduledRows={unscheduledRows}
                  oneOffRows={oneOffRows}
                  onEdit={openEditSheet}
                  onDelete={setDeleteTarget}
                  onToggleActive={handleToggleActive}
                />
              ) : (
                <ScheduleCalendarView rows={allRows} />
              )}
            </div>
          </>
        )}
      </div>

      <ScheduleSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditingSchedule(null)
        }}
        schedule={editingSchedule}
        academyId={academyId}
        onSuccess={refreshSchedules}
      />

      <ConfirmDialog
        variant="delete"
        entity="schedule"
        targetIdentifier={deleteTarget?.name || ""}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

