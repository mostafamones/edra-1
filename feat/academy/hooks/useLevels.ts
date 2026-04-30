import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import { Level } from "@/lib/types"

export function useLevels(academyId: string) {
  return useQuery({
    queryKey: ["levels", academyId],
    queryFn: () => apiFetch<Level[]>(`/api/levels?academyId=${academyId}`),
    enabled: !!academyId,
  })
}