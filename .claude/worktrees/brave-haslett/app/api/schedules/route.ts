import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getTimeSlots, replaceTimeSlots, enrollStudentInSchedule, unenrollStudentFromSchedule, getScheduleStudents } from "@/lib/db/schedules";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

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

    if (!scheduleData?.name || !scheduleData?.course_id || !scheduleData?.level_id) {
      return NextResponse.json(
        { error: "Name, course ID and level ID are required" },
        { status: 400 }
      );
    }

    const schedule = await createSchedule(scheduleData);
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: (error as any)?.message || "Failed to create schedule" },
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
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    await deleteSchedule(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
