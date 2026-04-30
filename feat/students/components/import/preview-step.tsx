"use client"

import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StudentField } from "@/lib/types"

import type { ParsedStudent } from "../../utils/import-parsers"
import { formatDay, toSnakeCase } from "../../utils/import-parsers"
import type { ImportSchedule } from "../../types"

interface PreviewStepProps {
  availableSchedules: ImportSchedule[]
  customFields: StudentField[]
  defaultGroupId: string
  defaultLevelId: string
  parsedStudents: ParsedStudent[]
  renderPreviewColumns: () => string[]
  selectedScheduleId: string
  setParsedStudents: React.Dispatch<React.SetStateAction<ParsedStudent[]>>
}

export function PreviewStep({
  availableSchedules,
  customFields,
  defaultGroupId,
  defaultLevelId,
  parsedStudents,
  renderPreviewColumns,
  selectedScheduleId,
  setParsedStudents,
}: PreviewStepProps) {
  const renderPreviewRow = (student: ParsedStudent, index: number) => {
    const hasErrors = student.errors && student.errors.length > 0
    const effectiveLevelId = student.level_id || (defaultLevelId ? parseInt(defaultLevelId, 10) : null)
    const effectiveGroupId = student.branch_id || (defaultGroupId ? parseInt(defaultGroupId, 10) : null)

    const rowSchedules = availableSchedules.filter((schedule) => {
      if (schedule.level_id && effectiveLevelId && schedule.level_id !== effectiveLevelId) return false
      if (schedule.group_id && effectiveGroupId && schedule.group_id !== effectiveGroupId) return false
      return true
    })

    return (
      <tr key={`${student.full_name}-${index}`} className={hasErrors ? "bg-destructive/10" : ""}>
        <td className="border-b p-2 text-sm">{student.full_name}</td>
        <td className="border-b p-2 text-sm">{student.level || "-"}</td>
        <td className="border-b p-2 text-sm">{student.branch || "-"}</td>
        <td className="border-b p-2 text-sm">
          <Select
            value={student.schedule_id ? student.schedule_id.toString() : (selectedScheduleId || "__none__")}
            onValueChange={(value) => {
              setParsedStudents((previous) => {
                const next = [...previous]
                if (value === "__none__") {
                  next[index] = { ...next[index], schedule: undefined, schedule_id: undefined }
                } else {
                  const schedule = availableSchedules.find((item) => item.id.toString() === value)
                  if (schedule) {
                    next[index] = { ...next[index], schedule: schedule.name, schedule_id: schedule.id }
                    if (next[index].errors) {
                      next[index].errors = next[index].errors?.filter((error) => error.field !== "schedule")
                    }
                  }
                }
                return next
              })
            }}
          >
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <SelectValue placeholder="Select schedule..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {rowSchedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id.toString()}>
                  {schedule.name}
                  {(schedule.time_slots || []).map((slot) => ` • ${formatDay(slot.day_of_week)}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="border-b p-2 text-sm">{student.email || "-"}</td>
        {customFields.map((field) => (
          <td key={field.id} className="border-b p-2 text-sm">
            {student.customFields?.[field.name] || "-"}
          </td>
        ))}
        <td className="border-b p-2">
          {hasErrors ? (
            <Badge variant="destructive" className="text-xs">
              {student.errors?.length} error{student.errors!.length > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-green-600 text-xs text-green-600">
              Valid
            </Badge>
          )}
        </td>
      </tr>
    )
  }

  const errors = parsedStudents.filter((student) => student.errors && student.errors.length > 0)
  const validCount = parsedStudents.filter((student) => !student.errors || student.errors.length === 0).length

  return (
    <div className="flex w-full flex-1 flex-col space-y-4 overflow-hidden">
      <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold">{parsedStudents.length}</p>
            <p className="text-xs text-muted-foreground">Total Rows</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-green-600">{validCount}</p>
            <p className="text-xs text-muted-foreground">Valid</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-destructive">{errors.length}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>
      </div>

      <div className="h-[300px] flex-1 overflow-auto rounded-lg border">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="sticky top-0 z-10 border-b bg-background">
            <tr>
              {renderPreviewColumns().map((column) => (
                <th key={column} className="p-2 text-left font-medium">
                  {column}
                </th>
              ))}
              <th className="p-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>{parsedStudents.map((student, index) => renderPreviewRow(student, index))}</tbody>
        </table>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="mb-2 text-sm font-medium text-destructive">Errors that will be skipped:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {errors.slice(0, 5).map((student, index) => (
              <li key={index}>
                {student.full_name}: {student.errors?.map((error) => error.message).join(", ")}
              </li>
            ))}
            {errors.length > 5 && (
              <li className="italic">...and {errors.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

