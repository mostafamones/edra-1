import { NextRequest, NextResponse } from "next/server";
import { updateField, deleteField } from "@/lib/db/fields";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { updateFieldSchema } from "@/lib/schemas";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("student_fields", id);
  if (!auth.ok) return auth.response;

  const parsed = await validateBody(request, updateFieldSchema);
  if (!parsed.success) return parsed.response;

  try {
    const updated = await updateField(id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating field:", error);
    return errors.internal("Failed to update field");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("student_fields", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteField(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting field:", error);
    return errors.internal("Failed to delete field");
  }
}
