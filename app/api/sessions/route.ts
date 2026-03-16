import { getSessionsByDateRange, createSession } from "@/lib/db/sessions";
import type { SessionInsert } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const academyId = request.nextUrl.searchParams.get("academyId");
    if (!academyId) {
      return NextResponse.json({ error: "Academy ID is required" }, { status: 400 });
    }

    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const sessions = await getSessionsByDateRange(
      academyId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { schedule_id, session_date } = body;

    if (!schedule_id || !session_date) {
      return NextResponse.json({ error: "schedule_id and session_date are required" }, { status: 400 });
    }

    const { data: instructor } = await supabase
      .from("instructors")
      .select("academy_id")
      .eq("id", user.id)
      .single();

    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    const sessionData: SessionInsert = {
      academy_id: instructor.academy_id,
      schedule_id: Number(schedule_id),
      session_date,
      status: "live",
      is_cancelled: false,
    };

    const session = await createSession(sessionData);
    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: error?.message || "Failed to create session" }, { status: 500 });
  }
}
