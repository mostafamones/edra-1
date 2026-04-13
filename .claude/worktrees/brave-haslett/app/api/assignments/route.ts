import { getAssignments, getCourseAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment } from "@/lib/db/assignments";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");
    const courseId = request.nextUrl.searchParams.get("courseId");

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    if (courseId) {
      // Get specific course assignments
      const assignments = await getCourseAssignments(parseInt(courseId, 10));
      return NextResponse.json(assignments);
    }

    // Get all academy assignments
    const assignments = await getAssignments(academyId);
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academy_id, parts, ...assignmentData } = body;

    if (!academy_id) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const assignment = await createAssignment(assignmentData, parts || []);
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: (error as any)?.message || "Failed to create assignment" },
      { status: 500 }
    );
  }
}
