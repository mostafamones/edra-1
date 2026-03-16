import { getSchedules, createSchedule, replaceTimeSlots } from "@/lib";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academyId = searchParams.get("academyId");

  if (!academyId) {
    return NextResponse.json(
      { error: "Academy ID is required" },
      { status: 400 }
    );
  }

  try {
    const schedules = await getSchedules(academyId);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { time_slots, ...scheduleData } = body;

    // Create the schedule
    const schedule = await createSchedule(scheduleData);

    // Create time slots if provided
    if (time_slots && time_slots.length > 0) {
      await replaceTimeSlots(schedule.id, time_slots);
    }

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
