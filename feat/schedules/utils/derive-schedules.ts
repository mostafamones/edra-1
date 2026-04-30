import type { ScheduleTimeSlot, ScheduleWithRelations } from "@/lib/types";

import { DAYS_FULL } from "../constants";
import type { DerivedSchedulesResult, ScheduleRow } from "../types";

export function getScheduleSearchString(schedule: ScheduleWithRelations) {
  return [
    schedule.name,
    schedule.level?.name,
    schedule.group?.name,
    schedule.schedule_type === "one_off" ? "one off" : "recurring",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function normalizeDayOfWeek(value: number | null | undefined) {
  if (value === null || value === undefined) return -1;
  if (value >= 1 && value <= 7) return value % 7;
  return value;
}

function createFallbackTimeSlot(schedule: ScheduleWithRelations): ScheduleTimeSlot {
  return {
    id: 0,
    academy_id: schedule.academy_id,
    schedule_id: schedule.id,
    day_of_week: -1,
    start_time: "",
    end_time: null,
    instance_date: schedule.one_off_date,
    created_at: null,
  };
}

export function buildScheduleRows(schedules: ScheduleWithRelations[]): DerivedSchedulesResult {
  if (schedules.length === 0) {
    return {
      recurringRows: [],
      oneOffRows: [],
      unscheduledRows: [],
      activeDays: [],
    };
  }

  const recurringRows: ScheduleRow[] = [];
  const oneOffRows: ScheduleRow[] = [];
  const unscheduledRows: ScheduleRow[] = [];

  for (const schedule of schedules) {
    const slots = schedule.time_slots || [];

    if (schedule.schedule_type === "one_off") {
      if (slots.length === 0) {
        oneOffRows.push({ schedule, timeSlot: createFallbackTimeSlot(schedule) });
        continue;
      }

      slots.forEach((slot) => {
        oneOffRows.push({ schedule, timeSlot: slot });
      });
      continue;
    }

    if (slots.length === 0) {
      const row = { schedule, timeSlot: createFallbackTimeSlot(schedule) };
      recurringRows.push(row);
      unscheduledRows.push(row);
      continue;
    }

    slots.forEach((slot) => {
      const normalizedDow = normalizeDayOfWeek(slot.day_of_week);
      const row = {
        schedule,
        timeSlot: {
          ...slot,
          day_of_week: normalizedDow,
        },
      };

      recurringRows.push(row);

      if (normalizedDow === -1) {
        unscheduledRows.push(row);
      }
    });
  }

  const activeDays = DAYS_FULL.map((dayName, dayIndex) => ({
    dayIndex,
    dayName,
    rows: recurringRows
      .filter((row) => normalizeDayOfWeek(row.timeSlot.day_of_week) === dayIndex)
      .sort((a, b) => (a.timeSlot.start_time || "").localeCompare(b.timeSlot.start_time || "")),
  })).filter((day) => day.rows.length > 0);

  return { recurringRows, oneOffRows, unscheduledRows, activeDays };
}
