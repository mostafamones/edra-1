import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

const supabase: any = getServiceSupabase();

interface GradeRequest {
  hashId: string;
  academyId: string;
  marks: Array<{
    partId: number;
    mark: number | null;
    excusedMarks: number | null;
    note?: string;
  }>;
}

// POST /api/assignments/[id]/grade - Grade a student on an assignment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const assignmentId = parseInt(resolvedParams.id);

    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
    }

    const body = await request.json();
    const { hashId, academyId, marks = [] }: GradeRequest = body;

    if (!hashId || !academyId) {
      return NextResponse.json(
        { error: "hashId and academyId are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json(
        { error: "marks array is required" },
        { status: 400 }
      );
    }

    // Decode student hash ID
    const { decodeStudentId } = await import("@/lib/hashid");
    const studentId = decodeStudentId(hashId);

    if (studentId <= 0) {
      return NextResponse.json({ error: "Invalid student hash ID" }, { status: 400 });
    }

    // Verify student exists and belongs to this academy
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, full_name, academy_id")
      .eq("id", studentId)
      .eq("academy_id", academyId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify assignment exists and belongs to this academy
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("id, title")
      .eq("id", assignmentId)
      .eq("academy_id", academyId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Verify all parts belong to this assignment
    const partIds = marks.map((m) => m.partId);
    const { data: parts, error: partsError } = await supabase
      .from("assignment_parts")
      .select("id, title, max_mark")
      .in("id", partIds)
      .eq("assignment_id", assignmentId);

    if (partsError) {
      return NextResponse.json(
        { error: "Failed to verify assignment parts" },
        { status: 500 }
      );
    }

    const validPartIds = new Set(parts?.map((p: any) => p.id) || []);
    const invalidMarks = marks.filter((m) => !validPartIds.has(m.partId));

    if (invalidMarks.length > 0) {
      return NextResponse.json(
        { error: "One or more part IDs are invalid for this assignment" },
        { status: 400 }
      );
    }

    // Upsert all marks
    const upsertPromises = marks.map((markData) => {
      // Only insert if mark is not null
      if (markData.mark === null && !markData.excusedMarks) {
        return Promise.resolve(null);
      }

      return supabase.from("student_part_marks").upsert(
        {
          part_id: markData.partId,
          student_id: studentId,
          academy_id: academyId,
          mark: markData.mark,
          excused_marks: markData.excusedMarks || 0,
          note: markData.note || null,
        },
        {
          onConflict: "part_id,student_id",
          ignoreDuplicates: false,
        }
      );
    });

    await Promise.all(upsertPromises);

    // Fetch the graded marks with part info for the response
    const { data: gradedMarks } = await supabase
      .from("student_part_marks")
      .select(`
        *,
        part:assignment_parts(id, title, max_mark)
      `)
      .in("part_id", partIds)
      .eq("student_id", studentId);

    return NextResponse.json({
      success: true,
      student: { id: student.id, name: student.full_name },
      marks: gradedMarks,
    });
  } catch (error: any) {
    console.error("Error grading student:", error);
    return NextResponse.json(
      { error: error.message || "Failed to grade student" },
      { status: 500 }
    );
  }
}
