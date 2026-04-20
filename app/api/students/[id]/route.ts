import { getStudent, updateStudent, deleteStudent } from "@/lib/db/students";
import { saveStudentFieldValues } from "@/lib/db/fields";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { updateStudentSchema } from "@/lib/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("students", id);
  if (!auth.ok) return auth.response;

  try {
    const student = await getStudent(id);
    if (!student) return errors.notFound("Student not found");
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return errors.internal("Failed to fetch student");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("students", id);
  if (!auth.ok) return auth.response;

  const parsed = await validateBody(request, updateStudentSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { fieldValues, ...studentData } = parsed.data;
    const student = await updateStudent(id, studentData as never);

    if (fieldValues && fieldValues.length > 0) {
      await saveStudentFieldValues(auth.ctx.academyId, id, fieldValues);
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    return errors.internal("Failed to update student");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("students", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteStudent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return errors.internal("Failed to delete student");
  }
}
