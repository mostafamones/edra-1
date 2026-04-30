"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import type { ScheduleWithRelations } from "@/lib/types";

export const scheduleQueryKeys = {
  all: ["schedules"] as const,
  list: (academyId: string) => ["schedules", academyId] as const,
};

export function useSchedules(academyId: string) {
  return useQuery({
    queryKey: scheduleQueryKeys.list(academyId),
    queryFn: () => apiFetch<ScheduleWithRelations[]>(`/api/schedules?academyId=${academyId}`),
    enabled: !!academyId,
  });
}
