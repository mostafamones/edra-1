import { getGroups, getGroupsByLevel, createGroup, updateGroup, deleteGroup } from "@/lib/db/groups";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createGroupSchema, updateGroupSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";
import { z } from "zod";

const patchGroupSchema = updateGroupSchema.extend({ id: z.number().int() });

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const levelId = request.nextUrl.searchParams.get("levelId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    if (levelId) {
      const groups = await getGroupsByLevel(parseInt(levelId, 10));
      return NextResponse.json(groups);
    }
    const groups = await getGroups(auth.ctx.academyId);
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return errors.internal("Failed to fetch groups");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createGroupSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const group = await createGroup({ ...parsed.data, academy_id: auth.ctx.academyId });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return errors.internal(getErrorMessage(error) || "Failed to create group");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, patchGroupSchema);
  if (!parsed.success) return parsed.response;

  const { id, ...updates } = parsed.data;
  const auth = await requireAcademyAccessForRow("groups", id);
  if (!auth.ok) return auth.response;

  try {
    const group = await updateGroup(id, updates);
    return NextResponse.json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    return errors.internal("Failed to update group");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(id)) return errors.badRequest("Group ID is required");

  const auth = await requireAcademyAccessForRow("groups", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteGroup(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return errors.internal("Failed to delete group");
  }
}
