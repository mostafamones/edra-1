"use client";

import { useQuery, invalidateCache, type UseQueryOptions } from "./use-query";
import type {
  StudentWithLevelRating,
  Instructor,
  ScheduleWithRelations,
  SessionWithSchedule,
  StudentField,
  Level,
  Branch,
  Academy,
} from "@/lib/types";

export * from "./use-attendance";

// ============================================================================
// HELPER
// ============================================================================

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ============================================================================
// useStudents
// ============================================================================

export interface UseStudentsOptions extends UseQueryOptions<StudentWithLevelRating[]> {
  /** Pre-filter fields returned alongside students */
  includeFields?: boolean;
}

/**
 * Fetch all students for an academy.
 *
 * @example
 * ```tsx
 * const { data: students, loading, refresh } = useStudents(academyId);
 * ```
 */
export function useStudents(
  academyId: string | null,
  options: UseStudentsOptions = {}
) {
  return useQuery<StudentWithLevelRating[]>(
    academyId ? `students:${academyId}` : null,
    () => fetchJSON<StudentWithLevelRating[]>(`/api/students?academyId=${academyId}`),
    {
      enabled: !!academyId,
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate student cache so the next `useStudents` call refetches. */
export function invalidateStudents() {
  invalidateCache("students:");
}

// ============================================================================
// useInstructors
// ============================================================================

export type InstructorWithEmail = Instructor & {
  email: string | null;
};

/**
 * Fetch all instructors for an academy (enriched with email and avatar_url).
 *
 * @example
 * ```tsx
 * const { data: instructors, loading } = useInstructors(academyId);
 * ```
 */
export function useInstructors(
  academyId: string | null,
  options: UseQueryOptions<InstructorWithEmail[]> = {}
) {
  return useQuery<InstructorWithEmail[]>(
    academyId ? `instructors:${academyId}` : null,
    () => fetchJSON<InstructorWithEmail[]>(`/api/instructors?academyId=${academyId}`),
    {
      enabled: !!academyId,
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate instructor cache. */
export function invalidateInstructors() {
  invalidateCache("instructors:");
}

// ============================================================================
// useSchedules
// ============================================================================

/**
 * Fetch all schedules for an academy (with relations: level, branch, time slots, enrollment counts).
 *
 * @example
 * ```tsx
 * const { data: schedules, loading } = useSchedules(academyId);
 * ```
 */
export function useSchedules(
  academyId: string | null,
  options: UseQueryOptions<ScheduleWithRelations[]> = {}
) {
  return useQuery<ScheduleWithRelations[]>(
    academyId ? `schedules:${academyId}` : null,
    () => fetchJSON<ScheduleWithRelations[]>(`/api/schedules?academyId=${academyId}`),
    {
      enabled: !!academyId,
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate schedule cache. */
export function invalidateSchedules() {
  invalidateCache("schedules:");
}

// ============================================================================
// useAssignments
// ============================================================================

export interface AssignmentPart {
  id: number
  title: string
  max_mark: number
  order_index: number | null
}

export interface AssignmentWithRelations {
  id: number
  academy_id: string
  title: string
  description: string | null
  weight: number | null
  due_date: string | null
  created_at: string
  level_id: number | null
  branch_id: number | null
  created_by: string | null
  level: { id: number; name: string } | null
  branch: { id: number; name: string } | null
  parts: AssignmentPart[]
}

/**
 * Fetch all assignments for an academy (with relations: level, branch).
 */
export function useAssignments(
  academyId: string | null,
  options: UseQueryOptions<AssignmentWithRelations[]> = {}
) {
  return useQuery<AssignmentWithRelations[]>(
    academyId ? `assignments:${academyId}` : null,
    () => fetchJSON<AssignmentWithRelations[]>(`/api/assignments?academyId=${academyId}`),
    {
      enabled: !!academyId,
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate assignments cache. */
export function invalidateAssignments() {
  invalidateCache("assignments:");
}

// ============================================================================
// useAssignment (single)
// ============================================================================

/**
 * Fetch a single assignment with its parts.
 */
export function useAssignment(
  assignmentId: number | null,
  options: UseQueryOptions<AssignmentWithRelations> = {}
) {
  return useQuery<AssignmentWithRelations>(
    assignmentId ? `assignment:${assignmentId}` : null,
    () => fetchJSON<AssignmentWithRelations>(`/api/assignments/${assignmentId}`),
    {
      enabled: !!assignmentId,
      deps: [assignmentId],
      ...options,
    }
  );
}

/** Invalidate single assignment cache. */
export function invalidateAssignment(assignmentId: number) {
  invalidateCache(`assignment:${assignmentId}`);
}

// ============================================================================
// useSessions
// ============================================================================

export interface UseSessionsOptions extends UseQueryOptions<SessionWithSchedule[]> {
  /** Override start date (ISO string, default: 30 days ago) */
  startDate?: string;
  /** Override end date (ISO string, default: 90 days from now) */
  endDate?: string;
}

/**
 * Fetch sessions for an academy within a date range.
 *
 * @example
 * ```tsx
 * const { data: sessions, loading } = useSessions(academyId, {
 *   startDate: "2025-01-01",
 *   endDate: "2025-12-31",
 * });
 * ```
 */
export function useSessions(
  academyId: string | null,
  options: UseSessionsOptions = {}
) {
  const { startDate, endDate, ...queryOpts } = options;

  // Build the URL — the API defaults to last-30 / next-90 if no params
  let url = `/api/sessions?academyId=${academyId}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;

  const cacheKey = academyId
    ? `sessions:${academyId}:${startDate || ""}:${endDate || ""}`
    : null;

  return useQuery<SessionWithSchedule[]>(
    cacheKey,
    () => fetchJSON<SessionWithSchedule[]>(url),
    {
      enabled: !!academyId,
      deps: [academyId, startDate, endDate],
      ...queryOpts,
    }
  );
}

/** Invalidate session cache. */
export function invalidateSessions() {
  invalidateCache("sessions:");
}

// ============================================================================
// useSession (single)
// ============================================================================

export function useSession(
  sessionId: number | null,
  options: UseQueryOptions<SessionWithSchedule> = {}
) {
  return useQuery<SessionWithSchedule>(
    sessionId ? `session:${sessionId}` : null,
    () => fetchJSON<SessionWithSchedule>(`/api/sessions/${sessionId}`),
    {
      enabled: !!sessionId,
      deps: [sessionId],
      ...options,
    }
  );
}

/** Invalidate single session cache. */
export function invalidateSession(sessionId: number) {
  invalidateCache(`session:${sessionId}`);
}

// ============================================================================
// useAcademy
// ============================================================================

export type AcademyWithMeta = Academy & {
  instructor_count: number;
  owner_email: string | null;
};

/**
 * Fetch academy details.
 *
 * @example
 * ```tsx
 * const { data: academy } = useAcademy(academyId);
 * ```
 */
export function useAcademy(
  academyId: string | null,
  options: UseQueryOptions<AcademyWithMeta> = {}
) {
  return useQuery<AcademyWithMeta>(
    academyId ? `academy:${academyId}` : null,
    () => fetchJSON<AcademyWithMeta>(`/api/academy?academyId=${academyId}`),
    {
      enabled: !!academyId,
      cacheTTL: 10 * 60 * 1000, // 10 minutes — academy data is fairly static
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate academy cache. */
export function invalidateAcademy() {
  invalidateCache("academy:");
}

// ============================================================================
// useLevels
// ============================================================================

/**
 * Fetch all levels for an academy.
 */
export function useLevels(
  academyId: string | null,
  options: UseQueryOptions<Level[]> = {}
) {
  return useQuery<Level[]>(
    academyId ? `levels:${academyId}` : null,
    () => fetchJSON<Level[]>(`/api/levels?academyId=${academyId}`),
    {
      enabled: !!academyId,
      cacheTTL: 10 * 60 * 1000,
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate levels cache. */
export function invalidateLevels() {
  invalidateCache("levels:");
}

// ============================================================================
// useBranches
// ============================================================================

/**
 * Fetch all branches for an academy.
 */
export function useBranches(
  academyId: string | null,
  options: UseQueryOptions<Branch[]> = {}
) {
  return useQuery<Branch[]>(
    academyId ? `branches:${academyId}` : null,
    () => fetchJSON<Branch[]>(`/api/branches?academyId=${academyId}`),
    {
      enabled: !!academyId,
      cacheTTL: 10 * 60 * 1000,
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate branches cache. */
export function invalidateBranches() {
  invalidateCache("branches:");
}

// ============================================================================
// useFields
// ============================================================================

/**
 * Fetch all custom fields for an academy.
 */
export function useFields(
  academyId: string | null,
  options: UseQueryOptions<StudentField[]> = {}
) {
  return useQuery<StudentField[]>(
    academyId ? `fields:${academyId}` : null,
    () => fetchJSON<StudentField[]>(`/api/fields?academyId=${academyId}`),
    {
      enabled: !!academyId,
      cacheTTL: 10 * 60 * 1000,
      deps: [academyId],
      ...options,
    }
  );
}

/** Invalidate fields cache. */
export function invalidateFields() {
  invalidateCache("fields:");
}
