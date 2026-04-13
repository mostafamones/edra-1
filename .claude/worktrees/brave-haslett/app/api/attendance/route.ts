import { createClient } from "@/utils/supabase/server";
import { getSessionAttendance, recordAttendance, deleteAttendance, getStudentAttendanceHistory, getStudentAttendanceSummary } from "@/lib/db/attendance";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const attendance = await getSessionAttendance(parseInt(sessionId, 10));
    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { hashId, sessionId, academyId, status, note } = body;

    if (!hashId || !sessionId || !academyId) {
      return NextResponse.json(
        { error: "Hash ID, session ID and academy ID are required" },
        { status: 400 }
      );
    }

    const attendance = await recordAttendance(body);
    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { studentId, sessionId, status, note, academyId } = body;

    if (!studentId || !sessionId || !academyId) {
      return NextResponse.json(
        { error: "Student ID, session ID and academy ID are required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (note !== undefined) updateData.note = note;

    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from("attendance")
      .update(updateData)
      .eq("student_id", studentId)
      .eq("session_id", parseInt(sessionId, 10))
      .eq("academy_id", academyId)
      .select()
      .single();

    if (attendanceError) throw attendanceError;

    return NextResponse.json(attendanceRecord);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");
    const sessionId = searchParams.get("sessionId");

    if (!studentId || !sessionId) {
      return NextResponse.json(
        { error: "Student ID and Session ID are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("student_id", studentId)
      .eq("session_id", parseInt(sessionId, 10));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
