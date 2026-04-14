import { createClient } from "@/utils/supabase/server";
import { getSessions, getSession, createSession, updateSession, deleteSession, getSessionsByDateRange } from "@/lib/db/sessions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const academyId = searchParams.get("academyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const scheduleId = searchParams.get("scheduleId");

    // Preferred: academy + optional date range (matches `useSessions` hook)
    if (academyId) {
      const toYMD = (d: Date) => d.toISOString().slice(0, 10)
      const start = startDate || (() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return toYMD(d)
      })()
      const end = endDate || (() => {
        const d = new Date()
        d.setDate(d.getDate() + 90)
        return toYMD(d)
      })()

      const sessions = await getSessionsByDateRange(academyId, start, end);
      return NextResponse.json(sessions);
    }

    // Back-compat: scheduleId-only listing
    if (!scheduleId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const sessions = await getSessions(parseInt(scheduleId, 10));
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule_id, session_date, academy_id } = body;

    if (!schedule_id || !session_date || !academy_id) {
      return NextResponse.json(
        { error: "Schedule ID, session date, and academy ID are required" },
        { status: 400 }
      );
    }

    const session = await createSession({ schedule_id, session_date, academy_id });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: (error as any)?.message || "Failed to create session" },
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
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    await deleteSession(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
