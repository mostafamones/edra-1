import { NextRequest, NextResponse } from "next/server";
import {
  generateInstructorInvite,
  listInstructorInvites,
  revokeInstructorInvite,
} from "@/lib/db/invites";
import { requireAcademyAccess } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createInviteSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";
import { getServiceSupabase } from "@/utils/supabase/admin";

async function resolveInviteAcademy(id: string): Promise<string | null> {
  const admin = getServiceSupabase();
  const { data } = await admin
    .from("instructor_invites")
    .select("academy_id")
    .eq("id", id)
    .maybeSingle();
  return (data as { academy_id: string } | null)?.academy_id ?? null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const type = request.nextUrl.searchParams.get("type");
  if (!type) return errors.badRequest("type is required");

  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    if (type === "student") return NextResponse.json([]);
    const invites = await listInstructorInvites(auth.ctx.academyId);
    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return errors.internal("Failed to fetch invites");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createInviteSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academyId);
  if (!auth.ok) return auth.response;

  try {
    const invite = await generateInstructorInvite(
      auth.ctx.academyId,
      parsed.data.email,
      parsed.data.role ?? "instructor"
    );
    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error("Error creating invite:", error);
    return errors.internal(getErrorMessage(error) || "Failed to create invite");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return errors.badRequest("Invite ID is required");

  const academyId = await resolveInviteAcademy(id);
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    const invite = await revokeInstructorInvite(id);
    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error revoking invite:", error);
    return errors.internal("Failed to revoke invite");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return errors.badRequest("Invite ID is required");

  const academyId = await resolveInviteAcademy(id);
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    const invite = await revokeInstructorInvite(id);
    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error deleting invite:", error);
    return errors.internal("Failed to delete invite");
  }
}
