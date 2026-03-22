import {
  getEnrollments,
  getCourseEnrollments,
  getStudentEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  completeEnrollment,
} from "@/lib/db/enrollments";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");
    const courseId = request.nextUrl.searchParams.get("courseId");
    const studentId = request.nextUrl.searchParams.get("studentId");

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    if (studentId) {
      // Get specific student's enrollments
      const enrollments = await getStudentEnrollments(parseInt(studentId, 10));
      return NextResponse.json(enrollments);
    }

    if (courseId) {
      // Get specific course's enrollments
      const enrollments = await getCourseEnrollments(parseInt(courseId, 10));
      return NextResponse.json(enrollments);
    }

    // Get all academy enrollments
    const enrollments = await getEnrollments(academyId);
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const enrollment = await createEnrollment(body);
    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create enrollment" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Enrollment ID is required" },
        { status: 400 }
      );
    }

    const enrollment = await updateEnrollment(id, updates);
    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error updating enrollment:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Enrollment ID is required" },
        { status: 400 }
      );
    }

    await deleteEnrollment(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}
