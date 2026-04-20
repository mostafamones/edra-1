import { getSessions, createSession, deleteSession, getSessionsByDateRange } from "@/lib/db/sessions";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors, paginated, parsePagination, success } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createSessionSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const academyId = searchParams.get("academyId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const scheduleId = searchParams.get("scheduleId");
  const wantsPagination = searchParams.has("page") || searchParams.has("limit");

  if (academyId) {
    const auth = await requireAcademyAccess(academyId);
    if (!auth.ok) return auth.response;

    try {
      const start =
        startDate ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return toYMD(d);
        })();
      const end =
        endDate ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 90);
          return toYMD(d);
        })();

      if (wantsPagination) {
        const { page, limit } = parsePagination(searchParams);
        const { data, total } = await getSessionsByDateRange(
          auth.ctx.academyId,
          start,
          end,
          { page, limit }
        );
        return paginated(data, {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        });
      }

      const sessions = await getSessionsByDateRange(auth.ctx.academyId, start, end);
      return success(sessions);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      return errors.internal(getErrorMessage(err) || "Failed to fetch sessions");
    }
  }

  if (!scheduleId) {
    return errors.badRequest("academyId or scheduleId is required");
  }

  try {
    const sessions = await getSessions(parseInt(scheduleId, 10));
    return success(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return errors.internal(getErrorMessage(err) || "Failed to fetch sessions");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createSessionSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const session = await createSession({
      schedule_id: parsed.data.schedule_id,
      session_date: parsed.data.session_date,
      academy_id: auth.ctx.academyId,
    });
    return success(session, 201);
  } catch (err) {
    console.error("Error creating session:", err);
    return errors.internal(getErrorMessage(err) || "Failed to create session");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(id)) return errors.badRequest("Session ID is required");

  const auth = await requireAcademyAccessForRow("sessions", id);
  if (!auth.ok) return auth.response;

  try {
    await deleteSession(id);
    return success({ deleted: true });
  } catch (err) {
    console.error("Error deleting session:", err);
    return errors.internal(getErrorMessage(err) || "Failed to delete session");
  }
}
