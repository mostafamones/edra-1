"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  IconCalendarEvent,
  IconClock,
  IconEdit,
  IconEyeOff,
  IconGitBranch,
  IconSchool,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react"
import type { ScheduleTimeSlot, ScheduleWithRelations } from "@/lib/types"
import { encodeScheduleId } from "@/lib/hashid"
import Link from "next/link"

const DAY_ACCENT = [
  "border-l-primary/60",
  "border-l-primary/60",
  "border-l-primary/60",
  "border-l-primary/60",
  "border-l-primary/60",
  "border-l-primary/60",
  "border-l-primary/60",
]

function formatTime(time: string) {
  if (!time) return ""
  const [h, m] = time.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m} ${ampm}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

export interface ScheduleRow {
  schedule: ScheduleWithRelations
  timeSlot: ScheduleTimeSlot
}

export function ScheduleListView({
  activeDays,
  oneOffRows,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  activeDays: { dayIndex: number; dayName: string; rows: ScheduleRow[] }[]
  oneOffRows: ScheduleRow[]
  onEdit: (s: ScheduleWithRelations) => void
  onDelete: (s: ScheduleWithRelations) => void
  onToggleActive: (s: ScheduleWithRelations) => void
}) {
  return (
    <div className="space-y-6">
      {activeDays.map(({ dayIndex, dayName, rows: dayRows }) => (
        <div key={dayIndex}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold">{dayName}</h3>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {dayRows.length}
            </Badge>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid gap-2">
            {dayRows.map((row) => (
              <ScheduleCard
                key={`${row.schedule.id}-${row.timeSlot.id}`}
                row={row}
                dayIndex={dayIndex}
                onEdit={() => onEdit(row.schedule)}
                onDelete={() => onDelete(row.schedule)}
                onToggleActive={() => onToggleActive(row.schedule)}
              />
            ))}
          </div>
        </div>
      ))}

      {oneOffRows.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold">One-off Sessions</h3>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {oneOffRows.length}
            </Badge>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid gap-2">
            {oneOffRows.map((row) => (
              <ScheduleCard
                key={`oneoff-${row.schedule.id}-${row.timeSlot.id}`}
                row={row}
                dayIndex={-1}
                onEdit={() => onEdit(row.schedule)}
                onDelete={() => onDelete(row.schedule)}
                onToggleActive={() => onToggleActive(row.schedule)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScheduleCard({
  row,
  dayIndex,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  row: ScheduleRow
  dayIndex: number
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  const { schedule, timeSlot } = row
  const studentCount = schedule.schedule_enrollments?.[0]?.count ?? 0
  const levelName = schedule.level?.name
  const groupName = schedule.group?.name
  const isActive = schedule.is_active !== false
  const accentClass = dayIndex >= 0 ? DAY_ACCENT[dayIndex] : "border-l-muted-foreground/40"
  const slotCount = schedule.time_slots?.length ?? 0
  const instanceDate = timeSlot.instance_date || schedule.one_off_date

  return (
    <Link href={`/schedules/${encodeScheduleId(schedule.id)}`}>
      <div
        className={`group relative flex items-center gap-4 rounded-lg border border-input bg-muted/20 p-4 pl-5 border-l-[3px] ${accentClass} transition-colors hover:bg-muted/30 ${!isActive ? "opacity-50" : ""}`}
      >
        <div className="flex flex-col items-start gap-0.5 shrink-0 min-w-[100px]">
          {instanceDate && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <IconCalendarEvent className="size-3" />
              {formatDate(instanceDate)}
            </span>
          )}
          {timeSlot.start_time ? (
            <span className="text-sm font-mono tabular-nums flex items-center gap-1.5">
              <IconClock className="size-3.5 text-muted-foreground" />
              {formatTime(timeSlot.start_time)}
            </span>
          ) : !instanceDate ? (
            <span className="text-xs text-muted-foreground italic">No time</span>
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{schedule.name}</p>
            {schedule.auto_assign && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-0.5 border-primary/50 text-primary dark:text-primary">
                    Auto-assign
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Auto-assigned to matching students</TooltipContent>
              </Tooltip>
            )}
            {!schedule.show_on_form && !schedule.auto_assign && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 gap-0.5">
                    <IconEyeOff className="size-2.5" />
                    Hidden
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Not shown on enrollment form</TooltipContent>
              </Tooltip>
            )}
            {schedule.schedule_type === "one_off" && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                One-off
              </Badge>
            )}
            {slotCount > 1 && schedule.schedule_type !== "one_off" && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                {slotCount} days/wk
              </Badge>
            )}
            {!isActive && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                Inactive
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {levelName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <IconSchool className="size-3" />
                {levelName}
              </span>
            )}
            {groupName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <IconGitBranch className="size-3" />
                {groupName}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <IconUsers className="size-3" />
              {studentCount} student{studentCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleActive()
                }}
                className="flex items-center"
              >
                <Switch checked={isActive} className="scale-75" />
              </div>
            </TooltipTrigger>
            <TooltipContent>{isActive ? "Deactivate" : "Activate"} schedule</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault()
                  onEdit()
                }}
              >
                <IconEdit className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit schedule</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault()
                  onDelete()
                }}
              >
                <IconTrash className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete schedule</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Link>
  )
}

