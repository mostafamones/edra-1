import type {
  CreateScheduleInput,
  ScheduleFormValues,
  UpdateScheduleInput,
} from "@/lib/schemas";
import type { Group, ScheduleTimeSlot, ScheduleWithRelations } from "@/lib/types";

import { DEFAULT_ONE_OFF_INSTANCE, DEFAULT_RECURRING_SLOT } from "../constants";

export function makeScheduleFormValues(
  initialSchedule?: ScheduleWithRelations | null
): ScheduleFormValues {
  if (!initialSchedule) {
    return {
      name: "",
      level_id: "",
      group_id: "",
      schedule_type: "recurring",
      auto_assign: false,
      show_on_form: true,
      recurring_slots: [{ ...DEFAULT_RECURRING_SLOT }],
      one_off_instances: [{ ...DEFAULT_ONE_OFF_INSTANCE }],
    };
  }

  const isOneOff = initialSchedule.schedule_type === "one_off";
  const slots = initialSchedule.time_slots || [];

  return {
    name: initialSchedule.name,
    level_id: initialSchedule.level_id?.toString() || "",
    group_id: initialSchedule.group_id?.toString() || "",
    schedule_type: initialSchedule.schedule_type === "one_off" ? "one_off" : "recurring",
    auto_assign: initialSchedule.auto_assign,
    show_on_form: initialSchedule.show_on_form,
    recurring_slots:
      !isOneOff && slots.length > 0
        ? slots.map((slot: ScheduleTimeSlot) => ({
            day_of_week: slot.day_of_week ?? 0,
            start_time: slot.start_time?.slice(0, 5) || DEFAULT_RECURRING_SLOT.start_time,
            end_time: slot.end_time?.slice(0, 5) || "",
          }))
        : [{ ...DEFAULT_RECURRING_SLOT }],
    one_off_instances:
      isOneOff && slots.length > 0
        ? slots.map((slot: ScheduleTimeSlot) => ({
            instance_date: slot.instance_date || initialSchedule.one_off_date || "",
            start_time: slot.start_time?.slice(0, 5) || DEFAULT_ONE_OFF_INSTANCE.start_time,
            end_time: slot.end_time?.slice(0, 5) || "",
          }))
        : [{ ...DEFAULT_ONE_OFF_INSTANCE }],
  };
}

export function getFilteredGroups(groups: Group[], selectedLevelId: string) {
  return groups.filter((group) => group.level_id?.toString() === selectedLevelId);
}

export function scheduleFormValuesToApiPayload(
  values: ScheduleFormValues,
  academyId: string
): CreateScheduleInput {
  const time_slots =
    values.schedule_type === "one_off"
      ? values.one_off_instances.map((instance) => ({
          instance_date: instance.instance_date,
          start_time: instance.start_time,
          end_time: instance.end_time || null,
          day_of_week: null,
        }))
      : values.recurring_slots.map((slot) => ({
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time || null,
          instance_date: null,
        }));

  return {
    academy_id: academyId,
    name: values.name.trim(),
    level_id: Number.parseInt(values.level_id, 10),
    group_id: values.group_id ? Number.parseInt(values.group_id, 10) : null,
    schedule_type: values.schedule_type,
    one_off_date: null,
    auto_assign: values.auto_assign,
    show_on_form: values.show_on_form,
    time_slots,
  };
}

export function scheduleFormValuesToUpdatePayload(
  values: ScheduleFormValues,
  academyId: string
): UpdateScheduleInput {
  const payload = scheduleFormValuesToApiPayload(values, academyId);

  return {
    name: payload.name,
    level_id: payload.level_id,
    group_id: payload.group_id,
    schedule_type: payload.schedule_type,
    one_off_date: payload.one_off_date,
    auto_assign: payload.auto_assign,
    show_on_form: payload.show_on_form,
    time_slots: payload.time_slots,
  };
}
