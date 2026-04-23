import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { Group } from "@/lib/types"

export function useGroups(academyId: string) {
  return useQuery({
    queryKey: ["groups", academyId],
    queryFn: () => apiFetch<Group[]>(`/api/groups?academyId=${academyId}`),
    enabled: !!academyId,
  })
}