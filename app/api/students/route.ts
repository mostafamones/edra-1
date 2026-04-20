import { getStudents, createStudent, updateStudent, deleteStudent } from "@/lib/db/students";
import { saveStudentFieldValues } from "@/lib/db/fields";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors, paginated, parsePagination, success } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createStudentSchema, updateStudentSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";
import { z } from "zod";

const patchStudentSchema = updateStudentSchema.extend({ id: z.number().int() });

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const academyId = searchParams.get("academyId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  const wantsPagination =
    searchParams.has("page") || searchParams.has("limit");

  try {
    if (wantsPagination) {
      const { page, limit } = parsePagination(searchParams);
      const { data, total } = await getStudents(auth.ctx.academyId, { page, limit });
      return paginated(data, {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    }

    const students = await getStudents(auth.ctx.academyId);
    return success(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    return errors.internal(getErrorMessage(err) || "Failed to fetch students");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createStudentSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const { fieldValues, ...studentData } = parsed.data;
    const student = await createStudent({
      ...studentData,
      academy_id: auth.ctx.academyId,
      status: studentData.status || "active",
    } as never);

    if (fieldValues && fieldValues.length > 0) {
      await saveStudentFieldValues(student.academy_id, student.id, fieldValues);
    }

    return success(student, 201);
  } catch (err) {
    console.error("Error creating student:", err);
    return errors.internal(getErrorMessage(err) || "Failed to create student");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, patchStudentSchema);
  if (!parsed.success) return parsed.response;

  const { id, fieldValues, ...updates } = parsed.data;

  const auth = await requireAcademyAccessForRow("students", id);
  if (!auth.ok) return auth.response;

  try {
    const student = await updateStudent(id, updates as never);
    if (fieldValues && fieldValues.length > 0) {
      await saveStudentFieldValues(auth.ctx.academyId, id, fieldValues);
    }
    return success(student);
  } catch (err) {
    console.error("Error updating student:", err);
    return errors.internal(getErrorMessage(err) || "Failed to update student");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(id)) {
    return errors.badRequest("Student ID is required");
  }

  const auth = await requireAcademyAccessForRow("students", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteStudent(id);
    return success({ deleted: true });
  } catch (err) {
    console.error("Error deleting student:", err);
    return errors.internal(getErrorMessage(err) || "Failed to delete student");
  }
}
