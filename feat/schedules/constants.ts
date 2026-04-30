import type { ScheduleViewMode } from "./types";

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const DAYS_FULL = DAYS_OF_WEEK.map((day) => day.label);

export const SCHEDULE_VIEW_STORAGE_KEY = "edra:schedules-view-mode";
export const DEFAULT_SCHEDULE_VIEW_MODE: ScheduleViewMode = "list";

export const HOUR_HEIGHT = 64;
export const DEFAULT_DURATION = 120;
export const BLOCK_GAP = 1;

export const DEFAULT_RECURRING_SLOT = {
  day_of_week: 0,
  start_time: "08:00",
  end_time: "",
} as const;

export const DEFAULT_ONE_OFF_INSTANCE = {
  instance_date: "",
  start_time: "08:00",
  end_time: "",
} as const;
