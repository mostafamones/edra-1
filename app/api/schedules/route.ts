import { getSchedules, createSchedule, deleteSchedule, replaceTimeSlots } from "@/lib/db/schedules";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors, paginated, parsePagination, success } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createScheduleSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const academyId = searchParams.get("academyId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  const wantsPagination = searchParams.has("page") || searchParams.has("limit");

  try {
    if (wantsPagination) {
      const { page, limit } = parsePagination(searchParams);
      const { data, total } = await getSchedules(auth.ctx.academyId, { page, limit });
      return paginated(data, {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    }

    const schedules = await getSchedules(auth.ctx.academyId);
    return success(schedules);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    return errors.internal(getErrorMessage(err) || "Failed to fetch schedules");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createScheduleSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const { time_slots, ...scheduleData } = parsed.data;
    const schedule = await createSchedule({ ...scheduleData, academy_id: auth.ctx.academyId });

    if (time_slots && time_slots.length > 0) {
      const id = (schedule as { id?: number })?.id;
      if (!id || typeof id !== "number") {
        throw new Error("Schedule created but no ID returned to attach time slots");
      }
      await replaceTimeSlots(id, time_slots as never);
    }

    return success(schedule, 201);
  } catch (err) {
    console.error("Error creating schedule:", err);
    return errors.internal(getErrorMessage(err) || "Failed to create schedule");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(id)) return errors.badRequest("Schedule ID is required");

  const auth = await requireAcademyAccessForRow("class_schedules", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteSchedule(id);
    return success({ deleted: true });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    return errors.internal(getErrorMessage(err) || "Failed to delete schedule");
  }
}
