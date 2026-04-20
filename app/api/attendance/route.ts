import { getServiceSupabase } from "@/utils/supabase/admin";
import { getSessionAttendance, recordAttendance } from "@/lib/db/attendance";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { recordAttendanceSchema, updateAttendanceSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionIdParam = request.nextUrl.searchParams.get("sessionId");
  const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : NaN;
  if (!Number.isFinite(sessionId)) {
    return errors.badRequest("Session ID is required");
  }

  const auth = await requireAcademyAccessForRow("sessions", sessionId);
  if (!auth.ok) return auth.response;

  try {
    const attendance = await getSessionAttendance(sessionId);
    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return errors.internal("Failed to fetch attendance");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, recordAttendanceSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academyId);
  if (!auth.ok) return auth.response;

  try {
    const attendance = await recordAttendance({
      ...parsed.data,
      academyId: auth.ctx.academyId,
    } as never);
    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return errors.internal(getErrorMessage(error) || "Failed to record attendance");
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, updateAttendanceSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academyId);
  if (!auth.ok) return auth.response;

  const { studentId, sessionId, status, note } = parsed.data;
  const sessionIdNum = typeof sessionId === "number" ? sessionId : parseInt(sessionId, 10);
  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (note !== undefined) updateData.note = note;

  try {
    const admin = getServiceSupabase();
    const { data: attendanceRecord, error: attendanceError } = await admin
      .from("attendance")
      .update(updateData)
      .eq("student_id", studentId)
      .eq("session_id", sessionIdNum)
      .eq("academy_id", auth.ctx.academyId)
      .select()
      .single();

    if (attendanceError) throw attendanceError;
    return NextResponse.json(attendanceRecord);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return errors.internal("Failed to update attendance");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const studentIdParam = searchParams.get("studentId");
  const sessionIdParam = searchParams.get("sessionId");
  const studentId = studentIdParam ? parseInt(studentIdParam, 10) : NaN;
  const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : NaN;

  if (!Number.isFinite(studentId) || !Number.isFinite(sessionId)) {
    return errors.badRequest("Student ID and Session ID are required");
  }

  const auth = await requireAcademyAccessForRow("sessions", sessionId);
  if (!auth.ok) return auth.response;

  try {
    const admin = getServiceSupabase();
    const { error } = await admin
      .from("attendance")
      .delete()
      .eq("student_id", studentId)
      .eq("session_id", sessionId)
      .eq("academy_id", auth.ctx.academyId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return errors.internal("Failed to delete attendance");
  }
}
