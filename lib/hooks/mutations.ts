/**
 * Typed domain mutations.
 *
 * These are plain async functions (not React hooks) that wrap the common
 * "call API, unwrap envelope, invalidate cache" pattern. Components call them
 * directly and pair them with local `setLoading`/`toast` wiring. Keeping them
 * outside of React lets us reuse them in Server Actions or background flows
 * later without having to rewrite call sites.
 */

import { api } from "@/lib/api/client";
import {
  invalidateFields,
  invalidateGroups,
  invalidateLevels,
  invalidateSchedules,
  invalidateSessions,
  invalidateStudents,
} from "./use-data";

// ─── Students ─────────────────────────────────────────────────────

export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`/api/students/${id}`);
  invalidateStudents();
}

export async function updateStudentRaw(
  id: number,
  payload: Record<string, unknown>
): Promise<void> {
  await api.put(`/api/students/${id}`, payload);
  invalidateStudents();
}

export async function bulkArchiveStudents(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => api.put(`/api/students/${id}`, { is_archived: true })));
  invalidateStudents();
}

export async function bulkDeleteStudents(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => api.delete(`/api/students/${id}`)));
  invalidateStudents();
}

// ─── Sessions ─────────────────────────────────────────────────────

export async function deleteSession(id: number): Promise<void> {
  await api.delete(`/api/sessions/${id}`);
  invalidateSessions();
}

export async function updateSessionStatus(
  id: number,
  status: "live" | "ended" | "archived"
): Promise<void> {
  await api.put(`/api/sessions/${id}`, { status });
  invalidateSessions();
}

export async function bulkArchiveSessions(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => api.put(`/api/sessions/${id}`, { status: "archived" })));
  invalidateSessions();
}

export interface EndSessionPayload {
  academyId: string;
  migrations: number[];
  notes: Array<{ studentId: number; note: string | null }>;
}

export async function endSession(
  sessionId: number,
  payload: EndSessionPayload
): Promise<void> {
  await api.post(`/api/sessions/${sessionId}/end`, payload);
  invalidateSessions();
}

// ─── Schedules ────────────────────────────────────────────────────

export async function deleteSchedule(id: number): Promise<void> {
  await api.delete(`/api/schedules/${id}`);
  invalidateSchedules();
}

export async function toggleScheduleActive(
  id: number,
  isActive: boolean
): Promise<void> {
  await api.put(`/api/schedules/${id}`, { is_active: isActive });
  invalidateSchedules();
}

// ─── Levels / Groups ──────────────────────────────────────────────

export async function updateLevel(
  id: number,
  payload: { name: string; color: string | null }
): Promise<void> {
  await api.put(`/api/levels/${id}`, payload);
  invalidateLevels();
}

export async function deleteLevel(id: number): Promise<void> {
  await api.delete(`/api/levels/${id}`);
  invalidateLevels();
  invalidateGroups();
}

export async function createGroup(payload: {
  academy_id: string;
  level_id: number;
  name: string;
}): Promise<{ id: number }> {
  const created = await api.post<{ id: number }>("/api/groups", payload);
  invalidateGroups();
  return created;
}

export async function updateGroup(
  id: number,
  payload: { name: string }
): Promise<void> {
  await api.patch("/api/groups", { id, ...payload });
  invalidateGroups();
}

export async function deleteGroup(id: number): Promise<void> {
  await api.delete(`/api/groups?id=${id}`);
  invalidateGroups();
}

// ─── Fields ───────────────────────────────────────────────────────

export interface FieldPayload {
  name: string;
  field_type: string;
  is_required: boolean;
  options: string[] | null;
}

export async function createField(
  academyId: string,
  payload: FieldPayload
): Promise<void> {
  await api.post(`/api/fields?academyId=${academyId}`, {
    academy_id: academyId,
    ...payload,
  });
  invalidateFields();
}

export async function updateField(
  id: number,
  payload: FieldPayload
): Promise<void> {
  await api.put(`/api/fields/${id}`, payload);
  invalidateFields();
}

export async function deleteField(id: number): Promise<void> {
  await api.delete(`/api/fields/${id}`);
  invalidateFields();
}
