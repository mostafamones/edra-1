import type {
  Group,
  Level,
  Schedule,
  ScheduleTimeSlot,
  StudentField,
  StudentWithLevelRating,
} from "@/lib/types"

export type StudentRow = StudentWithLevelRating

export interface StudentFormProps {
  academyId: string
  initialStudent?: StudentWithLevelRating | null
  onSuccess?: () => void
  onCancel?: () => void
}

export interface StudentsPageContentProps {
  academyId: string
}

export interface StudentsPageToolbarProps {
  academyId: string
  levels: Level[]
  groups: Group[]
  fields: StudentField[]
  schedules: Schedule[]
  existingStudentNames: string[]
  onRefresh?: () => void | Promise<void>
  buttonVariant?: "ghost" | "outline"
  buttonSize?: "default" | "lg"
}

export interface StudentsViewProps {
  academyId: string
  students: StudentWithLevelRating[]
  schedules: Schedule[]
  levels: Level[]
  groups: Group[]
  fields: StudentField[]
  onDataRefresh?: () => void | Promise<void>
}

export type ImportFormat = "csv" | "json"
export type ImportStep = "upload" | "preview" | "importing" | "complete"

export type ImportSchedule = Schedule & {
  is_mandatory?: boolean
  time_slots?: Pick<ScheduleTimeSlot, "day_of_week" | "start_time" | "end_time">[] | null
}

