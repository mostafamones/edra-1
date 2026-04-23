import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { StudentField } from "@/lib/types"

export function useFields(academyId: string) {
  return useQuery({
    queryKey: ["fields", academyId],
    queryFn: () => apiFetch<StudentField[]>(`/api/fields?academyId=${academyId}`),
    enabled: !!academyId,
  })
}