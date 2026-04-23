import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { AcademyWithMeta } from "../types"

export function useAcademy(academyId: string) {
  return useQuery({
    queryKey: ["academy", academyId],
    queryFn: () => apiFetch<AcademyWithMeta>(`/api/academies/${academyId}`),
    enabled: !!academyId,
  })
}