import {
  getEnrollments,
  getCourseEnrollments,
  getStudentEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} from "@/lib/db/enrollments";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createEnrollmentSchema, updateEnrollmentSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";
import { z } from "zod";

const patchEnrollmentSchema = updateEnrollmentSchema.extend({ id: z.number().int() });

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const courseId = request.nextUrl.searchParams.get("courseId");
  const studentId = request.nextUrl.searchParams.get("studentId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    if (studentId) {
      const enrollments = await getStudentEnrollments(parseInt(studentId, 10));
      return NextResponse.json(enrollments);
    }
    if (courseId) {
      const enrollments = await getCourseEnrollments(parseInt(courseId, 10));
      return NextResponse.json(enrollments);
    }
    const enrollments = await getEnrollments(auth.ctx.academyId);
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return errors.internal("Failed to fetch enrollments");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createEnrollmentSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const enrollment = await createEnrollment({ ...parsed.data, academy_id: auth.ctx.academyId });
    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return errors.internal(getErrorMessage(error) || "Failed to create enrollment");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, patchEnrollmentSchema);
  if (!parsed.success) return parsed.response;

  const { id, ...updates } = parsed.data;
  const auth = await requireAcademyAccessForRow("enrollments", id);
  if (!auth.ok) return auth.response;

  try {
    const enrollment = await updateEnrollment(id, updates);
    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error updating enrollment:", error);
    return errors.internal("Failed to update enrollment");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(id)) return errors.badRequest("Enrollment ID is required");

  const auth = await requireAcademyAccessForRow("enrollments", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteEnrollment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return errors.internal("Failed to delete enrollment");
  }
}
