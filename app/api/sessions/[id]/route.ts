import { getSession, updateSession, deleteSession } from "@/lib/db/sessions";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { updateSessionSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("sessions", id);
  if (!auth.ok) return auth.response;

  try {
    const session = await getSession(id);
    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return errors.internal("Failed to fetch session");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("sessions", id);
  if (!auth.ok) return auth.response;

  const parsed = await validateBody(request, updateSessionSchema);
  if (!parsed.success) return parsed.response;

  try {
    const session = await updateSession(id, parsed.data);
    return NextResponse.json(session);
  } catch (error) {
    console.error("Error updating session:", error);
    return errors.internal(getErrorMessage(error) || "Failed to update session");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("sessions", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return errors.internal(getErrorMessage(error) || "Failed to delete session");
  }
}
