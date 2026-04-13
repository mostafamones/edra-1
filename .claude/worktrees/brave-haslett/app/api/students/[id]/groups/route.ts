import { getStudentSchedules, enrollStudentInSchedule, unenrollStudentFromSchedule } from "@/lib";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = Number(idString);
    const schedules = await getStudentSchedules(id);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching student schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch student schedules" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const studentId = Number(idString);
    const { scheduleId, groupId, academyId } = await request.json();
    const targetId = scheduleId || groupId;

    if (!targetId || !academyId) {
      return NextResponse.json(
        { error: "scheduleId and academyId are required" },
        { status: 400 }
      );
    }

    await enrollStudentInSchedule({ academy_id: academyId, student_id: studentId, schedule_id: targetId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enrolling student in schedule:", error);
    return NextResponse.json(
      { error: "Failed to enroll student in schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const studentId = Number(idString);
    const body = await request.json();
    const { scheduleId, groupId } = body;
    const targetId = scheduleId || groupId;

    if (!targetId) {
      return NextResponse.json(
        { error: "scheduleId is required" },
        { status: 400 }
      );
    }

    await unenrollStudentFromSchedule(studentId, targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing student from schedule:", error);
    return NextResponse.json(
      { error: "Failed to remove student from schedule" },
      { status: 500 }
    );
  }
}
