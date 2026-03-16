import { getStudents, createStudent } from "@/lib";
import { saveStudentFieldValues } from "@/lib/db/fields";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const students = await getStudents(academyId);
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldValues, ...studentData } = body;

    // Default status to 'active' if not provided
    const studentWithDefaults = {
      ...studentData,
      status: studentData.status || 'active',
    };

    const student = await createStudent(studentWithDefaults);

    if (fieldValues && Array.isArray(fieldValues)) {
      await saveStudentFieldValues(student.academy_id, student.id, fieldValues);
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create student" },
      { status: 500 }
    );
  }
}
