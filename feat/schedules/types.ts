import type { ScheduleTimeSlot, ScheduleWithRelations } from "@/lib/types";

export type ScheduleViewMode = "list" | "calendar";
export type ScheduleFormMode = "create" | "edit";

export interface ScheduleRow {
  schedule: ScheduleWithRelations;
  timeSlot: ScheduleTimeSlot;
}

export interface ScheduleDaySection {
  dayIndex: number;
  dayName: string;
  rows: ScheduleRow[];
}

export interface DerivedSchedulesResult {
  recurringRows: ScheduleRow[];
  oneOffRows: ScheduleRow[];
  unscheduledRows: ScheduleRow[];
  activeDays: ScheduleDaySection[];
}
