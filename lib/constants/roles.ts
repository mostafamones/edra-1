/**
 * Canonical role vocabulary for Edra.
 *
 * Two orthogonal concepts live here:
 *
 * - `MEMBERSHIP_ROLES`: the role of a user within an **academy membership**
 *   (`academy_memberships.role`). Determines what an instructor can do inside
 *   a given academy.
 * - `USER_ROLES`: the platform-level role on `users.role` — mainly used to
 *   differentiate instructors from students/parents accessing the student
 *   portal.
 *
 * Prefer these constants (or the narrowed types) over raw strings. The old
 * `ROLE` export in `./index` is kept for backwards-compatibility and mirrors
 * `MEMBERSHIP_ROLES`.
 */

export const MEMBERSHIP_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
} as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[keyof typeof MEMBERSHIP_ROLES];

export const USER_ROLES = {
  INSTRUCTOR: "instructor",
  STUDENT: "student",
  PARENT: "parent",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Union used in places that may see either shape. */
export type Role = MembershipRole | UserRole;

/** All instructor-ish roles that grant access to the instructor dashboard. */
export const INSTRUCTOR_ROLES: readonly MembershipRole[] = [
  MEMBERSHIP_ROLES.OWNER,
  MEMBERSHIP_ROLES.ADMIN,
  MEMBERSHIP_ROLES.INSTRUCTOR,
] as const;

export function isMembershipRole(value: unknown): value is MembershipRole {
  return (
    typeof value === "string" &&
    (Object.values(MEMBERSHIP_ROLES) as string[]).includes(value)
  );
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (Object.values(USER_ROLES) as string[]).includes(value)
  );
}

/** Convenience alias matching the plan's wording (`ROLES`). */
export const ROLES = USER_ROLES;
