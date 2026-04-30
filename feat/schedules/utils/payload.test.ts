import { describe, expect, it } from "vitest";

import type { ScheduleWithRelations } from "@/lib/types";

import {
  getFilteredGroups,
  makeScheduleFormValues,
  scheduleFormValuesToApiPayload,
  scheduleFormValuesToUpdatePayload,
} from "./payload";

function makeSchedule(
  overrides: Partial<ScheduleWithRelations> = {}
): ScheduleWithRelations {
  return {
    id: 10,
    academy_id: "academy-1",
    name: "Morning Class",
    level_id: 3,
    group_id: 7,
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
    level: { id: 3, name: "Level 3", color: "2" } as unknown as ScheduleWithRelations["level"],
    group: { id: 7, name: "Group A", level_id: 3 } as unknown as ScheduleWithRelations["group"],
    schedule_group: null,
    time_slots: [],
    course: null,
    schedule_enrollments: [{ count: 0 }],
    ...overrides,
  } as ScheduleWithRelations;
}

describe("schedule payload helpers", () => {
  it("builds recurring defaults for a new schedule", () => {
    const values = makeScheduleFormValues(null);

    expect(values.schedule_type).toBe("recurring");
    expect(values.recurring_slots).toHaveLength(1);
    expect(values.one_off_instances).toHaveLength(1);
    expect(values.show_on_form).toBe(true);
  });

  it("maps a recurring schedule into editable form values", () => {
    const values = makeScheduleFormValues(
      makeSchedule({
        time_slots: [
          {
            id: 1,
            academy_id: "academy-1",
            schedule_id: 10,
            day_of_week: 2,
            start_time: "09:30:00",
            end_time: "11:00:00",
            instance_date: null,
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      })
    );

    expect(values.level_id).toBe("3");
    expect(values.group_id).toBe("7");
    expect(values.recurring_slots).toEqual([
      {
        day_of_week: 2,
        start_time: "09:30",
        end_time: "11:00",
      },
    ]);
  });

  it("maps one-off slots into form instances", () => {
    const values = makeScheduleFormValues(
      makeSchedule({
        schedule_type: "one_off",
        one_off_date: "2026-05-02",
        time_slots: [
          {
            id: 2,
            academy_id: "academy-1",
            schedule_id: 10,
            day_of_week: null,
            start_time: "14:00:00",
            end_time: null,
            instance_date: "2026-05-03",
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      })
    );

    expect(values.schedule_type).toBe("one_off");
    expect(values.one_off_instances).toEqual([
      {
        instance_date: "2026-05-03",
        start_time: "14:00",
        end_time: "",
      },
    ]);
  });

  it("builds create and update payloads without leaking academy_id into update", () => {
    const formValues = {
      name: "  Evening Class  ",
      level_id: "4",
      group_id: "",
      schedule_type: "one_off" as const,
      auto_assign: true,
      show_on_form: false,
      recurring_slots: [],
      one_off_instances: [
        {
          instance_date: "2026-06-01",
          start_time: "18:00",
          end_time: "",
        },
      ],
    };

    const createPayload = scheduleFormValuesToApiPayload(formValues, "academy-1");
    const updatePayload = scheduleFormValuesToUpdatePayload(formValues, "academy-1");

    expect(createPayload).toEqual({
      academy_id: "academy-1",
      name: "Evening Class",
      level_id: 4,
      group_id: null,
      schedule_type: "one_off",
      one_off_date: null,
      auto_assign: true,
      show_on_form: false,
      time_slots: [
        {
          instance_date: "2026-06-01",
          start_time: "18:00",
          end_time: null,
          day_of_week: null,
        },
      ],
    });
    expect(updatePayload).not.toHaveProperty("academy_id");
    expect(updatePayload.time_slots).toEqual(createPayload.time_slots);
  });

  it("filters groups by the selected level", () => {
    const groups = [
      { id: 1, level_id: 10, name: "A" },
      { id: 2, level_id: 12, name: "B" },
      { id: 3, level_id: 10, name: "C" },
    ] as NonNullable<ScheduleWithRelations["group"]>[];

    expect(getFilteredGroups(groups, "10").map((group) => group.id)).toEqual([1, 3]);
    expect(getFilteredGroups(groups, "")).toEqual([]);
  });
});
