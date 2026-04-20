import { getSchedule, updateSchedule, deleteSchedule, replaceTimeSlots } from "@/lib/db/schedules";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { updateScheduleSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("class_schedules", id);
  if (!auth.ok) return auth.response;

  try {
    const schedule = await getSchedule(id);
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return errors.internal("Failed to fetch schedule");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("class_schedules", id);
  if (!auth.ok) return auth.response;

  const parsed = await validateBody(request, updateScheduleSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { time_slots, ...scheduleData } = parsed.data;
    const schedule = await updateSchedule(id, scheduleData);
    if (time_slots) {
      await replaceTimeSlots(id, time_slots as never);
    }
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return errors.internal(getErrorMessage(error) || "Failed to update schedule");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("class_schedules", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteSchedule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return errors.internal(getErrorMessage(error) || "Failed to delete schedule");
  }
}
