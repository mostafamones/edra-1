"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { StudentField, StudentWithLevelRating } from "@/lib/types"

import { getFieldDisplayValue } from "../../../utils/table-helpers"
import { SortableHeader } from "./sortable-header"

type StudentScheduleEnrollment = NonNullable<StudentWithLevelRating["schedule_enrollments"]>[number]
type StudentSchedule = NonNullable<StudentScheduleEnrollment["schedule"]> & {
  is_mandatory?: boolean
}

function isMandatorySchedule(schedule: StudentScheduleEnrollment["schedule"]) {
  return (schedule as StudentSchedule | null)?.is_mandatory === true
}

export function schedulesColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    id: "schedules",
    header: "SCHEDULES",
    cell: ({ row }) => {
      const schedules = row.original.schedule_enrollments || []
      if (schedules.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>
      }

      const sortedSchedules = [...schedules].sort((a, b) => {
        const aMandatory = isMandatorySchedule(a.schedule) ? 1 : 0
        const bMandatory = isMandatorySchedule(b.schedule) ? 1 : 0
        return aMandatory - bMandatory
      })

      return (
        <div className="flex flex-wrap gap-1">
          {sortedSchedules.slice(0, 1).map((schedule, index) => (
            <Badge key={index} variant="secondary" className="px-1.5 py-0 text-xs font-normal">
              {schedule.schedule?.name || "Schedule"}
            </Badge>
          ))}
          {sortedSchedules.length > 1 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="px-1.5 py-0 text-xs font-normal">
                  +{sortedSchedules.length - 1}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {sortedSchedules.slice(1).map((schedule, index) => (
                  <p key={index} className="px-1.5 py-0 text-xs font-normal">
                    {schedule.schedule?.name || "Schedule"}
                  </p>
                ))}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    },
    enableSorting: false,
  }
}

export function fieldColumns<TRow extends StudentWithLevelRating>(
  fields: StudentField[]
): ColumnDef<TRow>[] {
  return fields.map((field) => ({
    id: `field_${field.id}`,
    header: ({ column }) => <SortableHeader column={column} label={field.name.toUpperCase()} />,
    accessorFn: (row: TRow) => {
      const fieldValue = (row.student_field_values || []).find((value) => value.field_id === field.id)
      if (!fieldValue) return ""
      return getFieldDisplayValue(fieldValue, field.field_type)
    },
    cell: ({ getValue }) => {
      const value = getValue() as string
      if (!value) return <span className="text-xs text-muted-foreground">—</span>

      if (field.field_type === "boolean") {
        return (
          <Badge
            variant="outline"
            className={`text-[11px] ${
              value === "Yes"
                ? "border-emerald-500/20 text-emerald-600"
                : "text-muted-foreground"
            }`}
          >
            {value}
          </Badge>
        )
      }

      return <span className="text-sm">{value}</span>
    },
    enableSorting: true,
  }))
}
