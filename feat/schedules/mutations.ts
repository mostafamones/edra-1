"use client";

import type { QueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { CreateScheduleInput, UpdateScheduleInput } from "@/lib/schemas";
import type { Group, Level, ScheduleWithRelations } from "@/lib/types";

import { scheduleQueryKeys } from "./hooks/use-schedules";

type ScheduleListSnapshot = ScheduleWithRelations[] | undefined;

interface OptimisticContext {
  previousSchedules: ScheduleListSnapshot;
}

function getSchedulesFromCache(client: QueryClient, academyId: string) {
  return client.getQueryData<ScheduleWithRelations[]>(scheduleQueryKeys.list(academyId));
}

function setSchedulesInCache(
  client: QueryClient,
  academyId: string,
  updater: ScheduleWithRelations[] | ((current: ScheduleWithRelations[]) => ScheduleWithRelations[])
) {
  client.setQueryData<ScheduleWithRelations[]>(scheduleQueryKeys.list(academyId), (current = []) =>
    typeof updater === "function"
      ? (updater as (current: ScheduleWithRelations[]) => ScheduleWithRelations[])(current)
      : updater
  );
}

function buildOptimisticContext(client: QueryClient, academyId: string): OptimisticContext {
  return {
    previousSchedules: getSchedulesFromCache(client, academyId),
  };
}

function restoreOptimisticContext(
  client: QueryClient,
  academyId: string,
  context?: OptimisticContext
) {
  if (!context) return;
  client.setQueryData(scheduleQueryKeys.list(academyId), context.previousSchedules);
}

function findRelatedLevel(
  schedules: ScheduleWithRelations[],
  levelId: number | null | undefined
): Level | null {
  if (levelId == null) return null;

  return (
    schedules.find((schedule) => schedule.level?.id === levelId)?.level ??
    null
  );
}

function findRelatedGroup(
  schedules: ScheduleWithRelations[],
  groupId: number | null | undefined
): Group | null {
  if (groupId == null) return null;

  return (
    schedules.find((schedule) => schedule.group?.id === groupId)?.group ??
    null
  );
}

function createOptimisticSchedule(
  payload: CreateScheduleInput,
  currentSchedules: ScheduleWithRelations[]
): ScheduleWithRelations {
  const tempId = -Date.now();

  return {
    id: tempId,
    academy_id: payload.academy_id,
    name: payload.name,
    level_id: payload.level_id ?? null,
    group_id: payload.group_id ?? null,
    schedule_type: payload.schedule_type ?? "recurring",
    one_off_date: payload.one_off_date ?? null,
    auto_assign: payload.auto_assign ?? false,
    show_on_form: payload.show_on_form ?? true,
    is_active: payload.is_active ?? true,
    created_at: new Date().toISOString(),
    created_by: null,
    updated_at: null,
    schedule_group_id: null,
    course_id: null,
    level: findRelatedLevel(currentSchedules, payload.level_id),
    group: findRelatedGroup(currentSchedules, payload.group_id),
    schedule_group: null,
    time_slots: (payload.time_slots ?? []).map((timeSlot, index) => ({
      id: tempId - index - 1,
      academy_id: payload.academy_id,
      schedule_id: tempId,
      day_of_week: timeSlot.day_of_week ?? null,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time ?? null,
      instance_date: timeSlot.instance_date ?? null,
      created_at: new Date().toISOString(),
    })),
    course: null,
    schedule_enrollments: [{ count: 0 }],
  };
}

function patchOptimisticSchedule(
  schedule: ScheduleWithRelations,
  payload: UpdateScheduleInput,
  relatedSchedules: ScheduleWithRelations[]
): ScheduleWithRelations {
  const nextLevelId =
    payload.level_id === undefined ? schedule.level_id : payload.level_id;
  const nextGroupId =
    payload.group_id === undefined ? schedule.group_id : payload.group_id;

  return {
    ...schedule,
    name: payload.name ?? schedule.name,
    level_id: nextLevelId ?? null,
    group_id: nextGroupId ?? null,
    schedule_type: payload.schedule_type ?? schedule.schedule_type,
    one_off_date: payload.one_off_date ?? schedule.one_off_date,
    auto_assign: payload.auto_assign ?? schedule.auto_assign,
    show_on_form: payload.show_on_form ?? schedule.show_on_form,
    is_active: payload.is_active ?? schedule.is_active,
    level:
      payload.level_id !== undefined
        ? findRelatedLevel(relatedSchedules, payload.level_id)
        : schedule.level,
    group:
      payload.group_id !== undefined
        ? findRelatedGroup(relatedSchedules, payload.group_id)
        : schedule.group,
    time_slots:
      payload.time_slots !== undefined
        ? payload.time_slots.map((timeSlot, index) => ({
            id: schedule.time_slots[index]?.id ?? -(schedule.id * 1000 + index + 1),
            academy_id: schedule.academy_id,
            schedule_id: schedule.id,
            day_of_week: timeSlot.day_of_week ?? null,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time ?? null,
            instance_date: timeSlot.instance_date ?? null,
            created_at: schedule.time_slots[index]?.created_at ?? new Date().toISOString(),
          }))
        : schedule.time_slots,
  };
}

async function settleScheduleMutation(academyId: string, queryClient?: QueryClient) {
  await invalidateScheduleQueries(academyId, queryClient);
}

export async function invalidateScheduleQueries(
  academyId?: string,
  queryClient?: QueryClient
) {
  if (!queryClient) {
    throw new Error("invalidateScheduleQueries requires a QueryClient");
  }

  await queryClient.invalidateQueries({
    queryKey: academyId ? scheduleQueryKeys.list(academyId) : scheduleQueryKeys.all,
  });
}

export async function createSchedule(payload: CreateScheduleInput, queryClient?: QueryClient) {
  if (!queryClient) {
    throw new Error("createSchedule requires a QueryClient");
  }

  void queryClient.cancelQueries({ queryKey: scheduleQueryKeys.list(payload.academy_id) });
  const context = buildOptimisticContext(queryClient, payload.academy_id);
  const optimisticSchedule = createOptimisticSchedule(
    payload,
    context.previousSchedules ?? []
  );

  setSchedulesInCache(queryClient, payload.academy_id, (current) => [
    ...current,
    optimisticSchedule,
  ]);

  try {
    const created = await api.post<{ id: number }>("/api/schedules", payload);

    setSchedulesInCache(queryClient, payload.academy_id, (current) =>
      current.map((schedule) =>
        schedule.id === optimisticSchedule.id
          ? {
              ...schedule,
              id: created.id,
              time_slots: schedule.time_slots.map((timeSlot) => ({
                ...timeSlot,
                schedule_id: created.id,
              })),
            }
          : schedule
      )
    );

    return created;
  } catch (error) {
    restoreOptimisticContext(queryClient, payload.academy_id, context);
    throw error;
  } finally {
    await settleScheduleMutation(payload.academy_id, queryClient);
  }
}

export async function updateSchedule(
  id: number,
  payload: UpdateScheduleInput,
  academyId: string,
  queryClient?: QueryClient
) {
  if (!queryClient) {
    throw new Error("updateSchedule requires a QueryClient");
  }

  void queryClient.cancelQueries({ queryKey: scheduleQueryKeys.list(academyId) });
  const context = buildOptimisticContext(queryClient, academyId);

  setSchedulesInCache(queryClient, academyId, (current) =>
    current.map((schedule) =>
      schedule.id === id
        ? patchOptimisticSchedule(schedule, payload, context.previousSchedules ?? current)
        : schedule
    )
  );

  try {
    return await api.put(`/api/schedules/${id}`, payload);
  } catch (error) {
    restoreOptimisticContext(queryClient, academyId, context);
    throw error;
  } finally {
    await settleScheduleMutation(academyId, queryClient);
  }
}

export async function deleteSchedule(id: number, academyId: string, queryClient?: QueryClient) {
  if (!queryClient) {
    throw new Error("deleteSchedule requires a QueryClient");
  }

  void queryClient.cancelQueries({ queryKey: scheduleQueryKeys.list(academyId) });
  const context = buildOptimisticContext(queryClient, academyId);

  setSchedulesInCache(queryClient, academyId, (current) =>
    current.filter((schedule) => schedule.id !== id)
  );

  try {
    await api.delete(`/api/schedules/${id}`);
  } catch (error) {
    restoreOptimisticContext(queryClient, academyId, context);
    throw error;
  } finally {
    await settleScheduleMutation(academyId, queryClient);
  }
}

export async function toggleScheduleActive(
  id: number,
  isActive: boolean,
  academyId: string,
  queryClient?: QueryClient
) {
  if (!queryClient) {
    throw new Error("toggleScheduleActive requires a QueryClient");
  }

  void queryClient.cancelQueries({ queryKey: scheduleQueryKeys.list(academyId) });
  const context = buildOptimisticContext(queryClient, academyId);

  setSchedulesInCache(queryClient, academyId, (current) =>
    current.map((schedule) =>
      schedule.id === id ? { ...schedule, is_active: isActive } : schedule
    )
  );

  try {
    await api.put(`/api/schedules/${id}`, { is_active: isActive });
  } catch (error) {
    restoreOptimisticContext(queryClient, academyId, context);
    throw error;
  } finally {
    await settleScheduleMutation(academyId, queryClient);
  }
}
