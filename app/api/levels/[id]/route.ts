import { getLevel, updateLevel, deleteLevel } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { updateLevelSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("levels", id);
  if (!auth.ok) return auth.response;

  try {
    const level = await getLevel(id);
    return NextResponse.json(level);
  } catch (error) {
    console.error("Error fetching level:", error);
    return errors.internal("Failed to fetch level");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("levels", id);
  if (!auth.ok) return auth.response;

  const parsed = await validateBody(request, updateLevelSchema);
  if (!parsed.success) return parsed.response;

  try {
    const level = await updateLevel(id, parsed.data);
    return NextResponse.json(level);
  } catch (error) {
    console.error("Error updating level:", error);
    return errors.internal(getErrorMessage(error) || "Failed to update level");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("levels", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteLevel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting level:", error);
    return errors.internal("Failed to delete level");
  }
}
