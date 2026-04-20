import { getCourses, createCourse, updateCourse, deleteCourse } from "@/lib/db/courses";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, requireAcademyAccessForRow, readBodyWithAcademy } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    const courses = await getCourses(auth.ctx.academyId);
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return errors.internal("Failed to fetch courses");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const read = await readBodyWithAcademy(request);
  if (!read) return errors.badRequest("Invalid JSON body");

  const auth = await requireAcademyAccess(read.academyId);
  if (!auth.ok) return auth.response;

  try {
    const course = await createCourse({ ...read.body, academy_id: auth.ctx.academyId } as never);
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return errors.internal(getErrorMessage(error) || "Failed to create course");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const read = await readBodyWithAcademy(request);
  if (!read) return errors.badRequest("Invalid JSON body");

  const { id, ...updates } = read.body as { id?: number } & Record<string, unknown>;
  if (!id) return errors.badRequest("Course ID is required");

  const auth = await requireAcademyAccessForRow("courses", id);
  if (!auth.ok) return auth.response;

  try {
    const course = await updateCourse(id, updates as never);
    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return errors.internal("Failed to update course");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(id)) return errors.badRequest("Course ID is required");

  const auth = await requireAcademyAccessForRow("courses", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteCourse(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return errors.internal("Failed to delete course");
  }
}
