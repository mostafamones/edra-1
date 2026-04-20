import { getAssignments, getCourseAssignments, createAssignment } from "@/lib/db/assignments";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createAssignmentSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const courseId = request.nextUrl.searchParams.get("courseId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    if (courseId) {
      const assignments = await getCourseAssignments(parseInt(courseId, 10));
      return NextResponse.json(assignments);
    }
    const assignments = await getAssignments(auth.ctx.academyId);
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return errors.internal("Failed to fetch assignments");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createAssignmentSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const { parts, ...assignmentData } = parsed.data;
    const assignment = await createAssignment(
      { ...assignmentData, academy_id: auth.ctx.academyId } as never,
      (parts || []) as never
    );
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return errors.internal(getErrorMessage(error) || "Failed to create assignment");
  }
}
