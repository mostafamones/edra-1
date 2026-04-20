import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { errors } from "./response";
import type { MembershipRole } from "@/lib/constants/roles";

/**
 * Shape passed to guarded route handlers once auth + academy ownership are verified.
 */
export interface AcademyAuthContext {
  userId: string;
  userEmail: string | null;
  instructorId: string;
  academyId: string;
  role: MembershipRole;
}

export interface AuthContext {
  userId: string;
  userEmail: string | null;
  instructorId: string | null;
}

type GuardFailure = { ok: false; response: NextResponse };
type AcademyGuardSuccess = { ok: true; ctx: AcademyAuthContext };
type AuthGuardSuccess = { ok: true; ctx: AuthContext };

/**
 * Reads the calling user from the cookie session. Returns a 401 response if no user.
 *
 * Use `requireAuth` when a route needs a logged-in user but is NOT scoped to a specific
 * academy (e.g. /api/academy/me, /api/profile). For academy-scoped endpoints use
 * `requireAcademyAccess` instead — it adds ownership verification on top of this.
 */
export async function requireAuth(): Promise<AuthGuardSuccess | GuardFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: errors.unauthorized() };
  }

  const admin = getServiceSupabase();
  const { data: instructor } = await admin
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    ok: true,
    ctx: {
      userId: user.id,
      userEmail: user.email ?? null,
      instructorId: (instructor as { id: string } | null)?.id ?? null,
    },
  };
}

/**
 * Verifies that the caller is an active instructor member of `academyId`.
 *
 * `academyId` must be supplied by the route — typically read from the parsed request
 * body or query string. The guard performs:
 *   1. Cookie session → user lookup (401 if anonymous).
 *   2. `instructors` row lookup by user_id (403 if none).
 *   3. `academy_memberships` row for (instructor, academy) with is_active=true (403 if none).
 */
export async function requireAcademyAccess(
  academyId: string | null | undefined
): Promise<AcademyGuardSuccess | GuardFailure> {
  if (!academyId) {
    return { ok: false, response: errors.badRequest("academyId is required") };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, response: errors.unauthorized() };
  }

  const admin = getServiceSupabase();

  const { data: instructor } = await admin
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const instructorId = (instructor as { id: string } | null)?.id;
  if (!instructorId) {
    return { ok: false, response: errors.forbidden("No instructor profile for this user") };
  }

  const { data: membership } = await admin
    .from("academy_memberships")
    .select("role, is_active")
    .eq("instructor_id", instructorId)
    .eq("academy_id", academyId)
    .eq("is_active", true)
    .maybeSingle();

  const row = membership as { role: MembershipRole; is_active: boolean } | null;
  if (!row) {
    return {
      ok: false,
      response: errors.forbidden("You do not have access to this academy"),
    };
  }

  return {
    ok: true,
    ctx: {
      userId: user.id,
      userEmail: user.email ?? null,
      instructorId,
      academyId,
      role: row.role,
    },
  };
}

/**
 * Resolves the academy_id for a row in `table` identified by numeric `id`, then
 * verifies the caller belongs to that academy. Use this on `[id]` mutation routes
 * where the client does not pass `academyId` in the body (e.g. DELETE /api/sessions/[id]).
 */
export async function requireAcademyAccessForRow(
  table: string,
  id: number,
  column: string = "academy_id"
): Promise<AcademyGuardSuccess | GuardFailure> {
  if (!Number.isFinite(id)) {
    return { ok: false, response: errors.badRequest("Invalid id") };
  }

  const admin = getServiceSupabase();
  // The `table` parameter is supplied by route code, not user input, so we trust
  // callers to pass a real table name. The Database type union is too strict to
  // pass a generic `string`; use an untyped handle here only.
  const adminUntyped = admin as unknown as {
    from: (name: string) => {
      select: (cols: string) => {
        eq: (col: string, val: number) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> };
      };
    };
  };
  const { data, error } = await adminUntyped
    .from(table)
    .select(column)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, response: errors.notFound() };
  }

  const rowAcademyId = (data as Record<string, string | null>)[column] ?? null;
  return requireAcademyAccess(rowAcademyId);
}

/**
 * Parse the JSON body once and expose both the parsed body and the academy_id
 * under whichever of the common keys the route uses. Returns null if the body
 * is not valid JSON — callers should 400 in that case.
 */
export async function readBodyWithAcademy(
  request: NextRequest
): Promise<{ body: Record<string, unknown>; academyId: string | null } | null> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return null;
  }
  const body = (raw ?? {}) as Record<string, unknown>;
  const academyId =
    (body.academyId as string | undefined) ??
    (body.academy_id as string | undefined) ??
    null;
  return { body, academyId };
}
