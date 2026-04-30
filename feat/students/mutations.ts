import { api } from "@/lib/api/client"
import { invalidateStudents } from "@/lib/hooks/use-data"

export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`/api/students/${id}`)
  invalidateStudents()
}

export async function updateStudentRaw(
  id: number,
  payload: Record<string, unknown>
): Promise<void> {
  await api.put(`/api/students/${id}`, payload)
  invalidateStudents()
}

export async function bulkArchiveStudents(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => api.put(`/api/students/${id}`, { is_archived: true })))
  invalidateStudents()
}

export async function bulkDeleteStudents(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => api.delete(`/api/students/${id}`)))
  invalidateStudents()
}

