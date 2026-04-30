import { z } from "zod"

import type { Group, Schedule, StudentField, StudentWithLevelRating } from "@/lib/types"

export const baseStudentFormSchema = z.object({
  full_name: z.string().min(1, "Student name is required"),
  level_id: z.string().min(1, "Level is required"),
  group_id: z.string().optional().default(""),
  enrolledScheduleIds: z.array(z.number()).default([]),
  fields: z.record(z.string(), z.any()).default({}),
})

export type StudentFormValues = z.infer<typeof baseStudentFormSchema>

export type StudentScheduleRow = Schedule & {
  auto_assign?: boolean
  is_mandatory?: boolean
  time_slots?: Array<{
    day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6
    start_time: string
    end_time?: string
  }>
}

export function buildStudentFormSchema(fields: StudentField[]) {
  return baseStudentFormSchema.superRefine((data, ctx) => {
    for (const field of fields.filter((item) => item.is_required)) {
      if (field.field_type === "boolean") continue

      const value = data.fields?.[String(field.id)]
      const empty =
        value === "" ||
        value === null ||
        value === undefined ||
        (typeof value === "number" && Number.isNaN(value))

      if (empty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field.name} is required`,
          path: ["fields", String(field.id)],
        })
      }
    }
  })
}

export function buildDefaultValues(
  initialStudent: StudentWithLevelRating | null | undefined,
  fields: StudentField[]
): StudentFormValues {
  const fieldValues: Record<string, string | number | boolean | Date | undefined> = {}

  if (initialStudent?.student_field_values) {
    for (const raw of initialStudent.student_field_values) {
      const field = fields.find((item) => item.id === raw.field_id)
      const fieldType = field?.field_type || "text"
      let value: unknown = raw.value ?? ""

      if (fieldType === "boolean") {
        if (value === "true" || value === "1" || value === "Yes") value = true
        else if (value === "false" || value === "0" || value === "No") value = false
        else value = !!value
      }

      fieldValues[String(raw.field_id)] = value as
        | string
        | number
        | boolean
        | Date
        | undefined
    }
  }

  const scheduleIds = (initialStudent?.schedule_enrollments || [])
    .map((enrollment) => enrollment.schedule?.id)
    .filter(Boolean) as number[]

  return {
    full_name: initialStudent?.full_name ?? "",
    level_id: initialStudent?.level_id?.toString() ?? "",
    group_id: initialStudent?.group_id?.toString() ?? "",
    enrolledScheduleIds: scheduleIds,
    fields: fieldValues,
  }
}

export function formatStudentScheduleTime(timeString?: string) {
  if (!timeString) return null

  const [hours, minutes] = timeString.split(":")
  if (!hours || !minutes) return null

  const date = new Date()
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0)
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export function formatStudentScheduleDay(day: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
  const days: Record<number, string> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  }

  return days[day] ?? null
}

export function scheduleMatchesStudent(
  schedule: StudentScheduleRow,
  levelId: string,
  groupId: string
): boolean {
  if (schedule.is_active === false) return false
  if (levelId && schedule.level_id && schedule.level_id.toString() !== levelId) return false
  if (!groupId && schedule.group_id != null) return false
  if (groupId && schedule.group_id && schedule.group_id.toString() !== groupId) return false
  return true
}

export function getAvailableGroups(groups: Group[], levelId: string) {
  const selectedLevelId = parseInt(levelId || "0", 10)
  return groups.filter((group) => group.level_id === selectedLevelId)
}

export function getLevelSchedules(schedules: StudentScheduleRow[], levelId: string) {
  if (!levelId) return []

  return schedules.filter((schedule) => {
    if (schedule.is_active === false) return false
    if (schedule.level_id && schedule.level_id.toString() !== levelId) return false
    return true
  })
}

export function getAutoAssignSchedules(
  schedules: StudentScheduleRow[],
  levelId: string,
  groupId: string
) {
  return schedules.filter(
    (schedule) => schedule.auto_assign === true && scheduleMatchesStudent(schedule, levelId, groupId)
  )
}

export function getOtherSchedules(
  schedules: StudentScheduleRow[],
  autoAssignSchedules: StudentScheduleRow[],
  groupId: string
) {
  const autoIds = new Set(autoAssignSchedules.map((schedule) => schedule.id))

  return schedules.filter((schedule) => {
    if (autoIds.has(schedule.id)) return false
    if (schedule.is_mandatory === true) return false
    if (
      groupId &&
      schedule.auto_assign === true &&
      schedule.group_id &&
      schedule.group_id.toString() !== groupId
    ) {
      return false
    }
    return true
  })
}

