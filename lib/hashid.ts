import Sqids from "sqids"

// ─── Universal Hash ID Utility ─────────────────────────────────
// Encodes numeric database IDs into short, URL-friendly strings.
// Each entity type uses a different offset so the same numeric ID
// produces a different hash per type (e.g. schedule #1 ≠ student #1).
//
// Usage:
//   encodeId("schedule", 42)  → "k8Wd3p"
//   decodeId("schedule", "k8Wd3p") → 42

const sqids = new Sqids({
  minLength: 6,
  alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
})

// Offsets per entity — ensures same numeric ID maps to different hashes
const ENTITY_OFFSETS: Record<string, number> = {
  schedule: 10000,
  student: 20000,
  session: 30000,
  assignment: 40000,
  instructor: 50000,
}

/**
 * Encode a numeric ID to a short hash string.
 * @param entity - Entity type (schedule, student, session, assignment, instructor)
 * @param id - Numeric database ID
 */
export function encodeId(entity: keyof typeof ENTITY_OFFSETS, id: number): string {
  const offset = ENTITY_OFFSETS[entity] ?? 0
  return sqids.encode([id + offset])
}

/**
 * Decode a hash string back to a numeric ID.
 * @param entity - Entity type (schedule, student, session, assignment, instructor)
 * @param hash - Hash string from URL
 */
export function decodeId(entity: keyof typeof ENTITY_OFFSETS, hash: string): number {
  const offset = ENTITY_OFFSETS[entity] ?? 0
  const decoded = sqids.decode(hash)
  if (decoded.length === 0) return 0
  return decoded[0] - offset
}

// ─── Convenience helpers ───────────────────────────────────────

export const encodeScheduleId = (id: number) => encodeId("schedule", id)
export const decodeScheduleId = (hash: string) => decodeId("schedule", hash)

export const encodeStudentId = (id: number) => encodeId("student", id)
export const decodeStudentId = (hash: string) => decodeId("student", hash)

export const encodeSessionId = (id: number) => encodeId("session", id)
export const decodeSessionId = (hash: string) => decodeId("session", hash)

export const encodeAssignmentId = (id: number) => encodeId("assignment", id)
export const decodeAssignmentId = (hash: string) => decodeId("assignment", hash)

export const encodeInstructorId = (id: number) => encodeId("instructor", id)
export const decodeInstructorId = (hash: string) => decodeId("instructor", hash)
