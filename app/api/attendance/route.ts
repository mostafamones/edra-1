import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getSessionAttendance, recordAttendance } from "@/lib/db/attendance"
import { decodeStudentId } from "@/lib/hashid"
import { AttendanceInsert, AttendanceStatus } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sessionId = request.nextUrl.searchParams.get("sessionId")
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const attendance = await getSessionAttendance(parseInt(sessionId, 10))
    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { hashId, sessionId, status, academyId, note, checkin_time } = body

    if (!hashId || !sessionId || !academyId) {
      return NextResponse.json(
        { error: "Hash ID, session ID, and academy ID are required" },
        { status: 400 }
      )
    }

    const studentId = decodeStudentId(hashId)
    if (!studentId || studentId <= 0) {
      return NextResponse.json({ error: "Invalid student Hash ID" }, { status: 400 })
    }

    // Verify student exists and belongs to academy
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, academy_id, level_id, branch_id")
      .eq("id", studentId)
      .eq("academy_id", academyId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found in this academy" }, { status: 404 })
    }

    // Fetch the session's schedule to validate level and branch
    const { data: session } = await supabase
      .from("sessions")
      .select(`
        id,
        schedule:class_schedules(level_id, branch_id)
      `)
      .eq("id", parseInt(sessionId, 10))
      .single()

    if (session?.schedule) {
      const { level_id, branch_id } = session.schedule as any
      if (level_id && student.level_id !== level_id) {
        return NextResponse.json(
          { error: "Student level does not match the session's level" },
          { status: 400 }
        )
      }
      if (branch_id && student.branch_id !== branch_id) {
        return NextResponse.json(
          { error: "Student branch does not match the session's branch" },
          { status: 400 }
        )
      }
    }

    const finalStatus = status || AttendanceStatus.PRESENT;

    const attendanceData: AttendanceInsert = {
      student_id: studentId,
      session_id: parseInt(sessionId, 10),
      academy_id: academyId,
      status: finalStatus,
      note: note || null,
      checkin_time: checkin_time || new Date().toISOString(),
    }

    const attendanceRecord = await recordAttendance(attendanceData)

    return NextResponse.json(attendanceRecord, { status: 201 })
  } catch (error: any) {
    console.error("Error creating attendance:", error)
    return NextResponse.json(
      { error: error.message || "Failed to record attendance" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { studentId, sessionId, status, note, academyId } = body

    if (!studentId || !sessionId || !academyId) {
      return NextResponse.json(
        { error: "Student ID, session ID, and academy ID are required for update" },
        { status: 400 }
      )
    }

    if (!status && note === undefined) {
      return NextResponse.json(
        { error: "Either status or note must be provided for update" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
    }
    if (note !== undefined) updateData.note = note

    const { data: attendanceRecord, error } = await supabase
      .from("attendance")
      .update(updateData)
      .eq("student_id", studentId)
      .eq("session_id", parseInt(sessionId, 10))
      .eq("academy_id", academyId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(attendanceRecord, { status: 200 })
  } catch (error: any) {
    console.error("Error updating attendance:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update attendance" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sessionId = request.nextUrl.searchParams.get("sessionId")
    const studentId = request.nextUrl.searchParams.get("studentId")

    if (!sessionId || !studentId) {
      return NextResponse.json({ error: "Session ID and Student ID are required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("session_id", parseInt(sessionId, 10))
      .eq("student_id", parseInt(studentId, 10))

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting attendance:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete attendance" },
      { status: 500 }
    )
  }
}
