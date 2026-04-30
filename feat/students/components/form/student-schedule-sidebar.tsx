"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import type { Group } from "@/lib/types"

import {
  formatStudentScheduleDay,
  formatStudentScheduleTime,
  type StudentScheduleRow,
} from "../../utils/student-form"

interface StudentScheduleSidebarProps {
  autoAssignSchedules: StudentScheduleRow[]
  canPickSchedules: boolean
  enrolledIds: number[]
  groups: Group[]
  hasScheduleCards: boolean
  hasScheduleSidebar: boolean
  onScheduleCardClick: (schedule: StudentScheduleRow, checked: boolean) => void
  otherSchedules: StudentScheduleRow[]
}

export function StudentScheduleSidebar({
  autoAssignSchedules,
  canPickSchedules,
  enrolledIds,
  groups,
  hasScheduleCards,
  hasScheduleSidebar,
  onScheduleCardClick,
  otherSchedules,
}: StudentScheduleSidebarProps) {
  if (!hasScheduleSidebar) return null

  const renderScheduleCard = (schedule: StudentScheduleRow) => {
    const isOn = enrolledIds.includes(schedule.id)
    const groupName = schedule.group_id
      ? groups.find((group) => group.id === schedule.group_id)?.name
      : null
    const isAutoAssign = schedule.auto_assign === true

    return (
      <Toggle
        key={schedule.id}
        variant="outline"
        type="button"
        className={cn(
          "h-auto w-full rounded-md border px-3 py-2.5 text-left transition-colors",
          "hover:bg-muted/40",
          isOn ? "border-border bg-muted/40" : "border-border/50 bg-transparent"
        )}
        pressed={isOn}
        onPressedChange={(checked) => onScheduleCardClick(schedule, checked)}
      >
        <div className="flex min-w-0 w-full items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium leading-tight text-foreground">
                {schedule.name}
              </p>
              {isAutoAssign && (
                <Badge
                  variant="outline"
                  className="h-4 shrink-0 px-1.5 py-0 text-[10px] font-normal text-muted-foreground border-muted-foreground/30"
                >
                  auto
                </Badge>
              )}
            </div>
            {groupName && <p className="text-[11px] leading-tight text-muted-foreground">{groupName}</p>}
            {(schedule.time_slots || []).length > 0 && (
              <div className="flex flex-col gap-0.5">
                {(schedule.time_slots || []).map((slot, index) => {
                  const start = formatStudentScheduleTime(slot.start_time)
                  const end = formatStudentScheduleTime(slot.end_time)

                  return (
                    <span key={index} className="text-[11px] leading-tight text-muted-foreground">
                      {formatStudentScheduleDay(slot.day_of_week)}
                      {start && ` · ${start}`}
                      {end && `–${end}`}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <div
            className={cn(
              "mt-0.5 size-3.5 shrink-0 rounded-sm border transition-colors",
              isOn
                ? "border-foreground/40 bg-foreground/12"
                : "border-muted-foreground/25 bg-transparent"
            )}
          />
        </div>
      </Toggle>
    )
  }

  return (
    <aside className="flex flex-col gap-4 overflow-hidden border-t border-border p-4 md:sticky h-full md:border-l md:border-t-0 md:p-6">
      <div className="shrink-0 space-y-1">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Schedule enrollment
        </h3>
        <p className="text-[11px] text-muted-foreground">{enrolledIds.length} selected</p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {!canPickSchedules && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Select a level to see schedules this student can join.
          </p>
        )}
        {canPickSchedules && !hasScheduleCards && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            No schedules match this level and group. You can still save the student and add
            schedules later.
          </p>
        )}
        {hasScheduleCards && (
          <>
            {autoAssignSchedules.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Auto-assign sessions
                </p>
                <div className="space-y-2">{autoAssignSchedules.map(renderScheduleCard)}</div>
              </div>
            )}
            {autoAssignSchedules.length > 0 && otherSchedules.length > 0 && (
              <Separator className="my-1" />
            )}
            {otherSchedules.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Other sessions
                </p>
                <div className="space-y-2">{otherSchedules.map(renderScheduleCard)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

