import { describe, expect, it } from "vitest";

import type { ScheduleWithRelations } from "@/lib/types";

import {
  buildScheduleRows,
  getScheduleSearchString,
  normalizeDayOfWeek,
} from "./derive-schedules";

function makeSchedule(
  overrides: Partial<ScheduleWithRelations> = {}
): ScheduleWithRelations {
  return {
    id: 1,
    academy_id: "academy-1",
    name: "Morning Class",
    level_id: 2,
    group_id: 4,
    schedule_type: "recurring",
    one_off_date: null,
    auto_assign: false,
    show_on_form: true,
    is_active: true,
    is_mandatory: false,
    created_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    updated_at: null,
    schedule_group_id: null,
    course_id: null,
    level: { id: 2, name: "Intermediate" } as ScheduleWithRelations["level"],
    group: { id: 4, name: "Group B", level_id: 2 } as ScheduleWithRelations["group"],
    schedule_group: null,
    time_slots: [],
    course: null,
    schedule_enrollments: [{ count: 0 }],
    ...overrides,
  } as ScheduleWithRelations;
}

describe("derive schedules", () => {
  it("normalizes day-of-week values from 1-7 into 0-6", () => {
    expect(normalizeDayOfWeek(undefined)).toBe(-1);
    expect(normalizeDayOfWeek(null)).toBe(-1);
    expect(normalizeDayOfWeek(1)).toBe(1);
    expect(normalizeDayOfWeek(7)).toBe(0);
  });

  it("builds recurring active days, unscheduled rows, and one-off rows", () => {
    const recurring = makeSchedule({
      id: 11,
      time_slots: [
        {
          id: 101,
          academy_id: "academy-1",
          schedule_id: 11,
          day_of_week: 1,
          start_time: "10:00",
          end_time: "11:00",
          instance_date: null,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const unscheduled = makeSchedule({
      id: 12,
      name: "Needs Setup",
      time_slots: [],
    });

    const oneOff = makeSchedule({
      id: 13,
      name: "Workshop",
      schedule_type: "one_off",
      one_off_date: "2026-05-10",
      time_slots: [
        {
          id: 102,
          academy_id: "academy-1",
          schedule_id: 13,
          day_of_week: null,
          start_time: "13:00",
          end_time: null,
          instance_date: "2026-05-10",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const result = buildScheduleRows([recurring, unscheduled, oneOff]);

    expect(result.recurringRows).toHaveLength(2);
    expect(result.oneOffRows).toHaveLength(1);
    expect(result.unscheduledRows).toHaveLength(1);
    expect(result.activeDays).toHaveLength(1);
    expect(result.activeDays[0]?.dayName).toBe("Monday");
    expect(result.activeDays[0]?.rows[0]?.schedule.id).toBe(11);
    expect(result.unscheduledRows[0]?.schedule.id).toBe(12);
    expect(result.oneOffRows[0]?.schedule.id).toBe(13);
  });

  it("creates a fallback row for one-off schedules without slots", () => {
    const result = buildScheduleRows([
      makeSchedule({
        id: 20,
        schedule_type: "one_off",
        one_off_date: "2026-07-01",
        time_slots: [],
      }),
    ]);

    expect(result.oneOffRows).toHaveLength(1);
    expect(result.oneOffRows[0]?.timeSlot.instance_date).toBe("2026-07-01");
    expect(result.oneOffRows[0]?.timeSlot.day_of_week).toBe(-1);
  });

  it("builds a normalized lowercase search string", () => {
    const search = getScheduleSearchString(
      makeSchedule({
        name: "Advanced Workshop",
        schedule_type: "one_off",
      })
    );

    expect(search).toContain("advanced workshop");
    expect(search).toContain("intermediate");
    expect(search).toContain("group b");
    expect(search).toContain("one off");
  });
});
