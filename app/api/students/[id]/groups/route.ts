import {
  getStudentSchedules,
  enrollStudentInSchedule,
  unenrollStudentFromSchedule,
} from "@/lib/db/schedules";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { studentScheduleEnrollSchema, studentScheduleUnenrollSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("students", id);
  if (!auth.ok) return auth.response;

  try {
    const schedules = await getStudentSchedules(id);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching student schedules:", error);
    return errors.internal("Failed to fetch student schedules");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const studentId = Number(idString);
  if (!Number.isFinite(studentId)) return errors.badRequest("Invalid id");

  const parsed = await validateBody(request, studentScheduleEnrollSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccessForRow("students", studentId);
  if (!auth.ok) return auth.response;

  if (parsed.data.academyId !== auth.ctx.academyId) {
    return errors.forbidden("academyId mismatch");
  }

  const targetId = parsed.data.scheduleId ?? parsed.data.groupId;
  if (!targetId) return errors.badRequest("scheduleId or groupId is required");

  try {
    await enrollStudentInSchedule({
      academy_id: auth.ctx.academyId,
      student_id: studentId,
      schedule_id: targetId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enrolling student in schedule:", error);
    return errors.internal("Failed to enroll student in schedule");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const studentId = Number(idString);
  if (!Number.isFinite(studentId)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("students", studentId);
  if (!auth.ok) return auth.response;

  const parsed = await validateBody(request, studentScheduleUnenrollSchema);
  if (!parsed.success) return parsed.response;

  const targetId = parsed.data.scheduleId ?? parsed.data.groupId;
  if (!targetId) return errors.badRequest("scheduleId or groupId is required");

  try {
    await unenrollStudentFromSchedule(studentId, targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing student from schedule:", error);
    return errors.internal("Failed to remove student from schedule");
  }
}
