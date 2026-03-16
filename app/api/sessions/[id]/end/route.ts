import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolvedParams = await params
    const sessionIdStr = resolvedParams.id
    if (!sessionIdStr) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const sessionId = parseInt(sessionIdStr, 10)
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid Session ID format" }, { status: 400 })
    }

    const body = await request.json()
    const { migrations, notes, academyId } = body

    if (!academyId) {
      return NextResponse.json({ error: "Academy ID is required" }, { status: 400 })
    }

    // 0. Get the target schedule ID from the session
    const { data: sessionDataTarget, error: sessionFetchError } = await supabase
      .from('sessions')
      .select('schedule_id')
      .eq('id', sessionId)
      .eq('academy_id', academyId)
      .single()

    if (sessionFetchError || !sessionDataTarget?.schedule_id) {
      return NextResponse.json({ error: "Could not find session target schedule" }, { status: 500 })
    }

    const targetScheduleId = sessionDataTarget.schedule_id;

    // Begin a coordinated sequence of updates

    // 1. Process Notes Updates (if any)
    if (notes && Array.isArray(notes) && notes.length > 0) {
      for (const noteUpdate of notes) {
        if (!noteUpdate.studentId) continue;

        await supabase
          .from("attendance")
          .update({ note: noteUpdate.note })
          .eq("session_id", sessionId)
          .eq("student_id", noteUpdate.studentId)
          .eq("academy_id", academyId)
      }
    }

    // 2. Process Absent Backfill
    const { data: enrolledData } = await supabase
      .from('student_schedules')
      .select('student_id')
      .eq('schedule_id', targetScheduleId)
      .eq('academy_id', academyId)

    const { data: attendedData } = await supabase
      .from('attendance')
      .select('student_id')
      .eq('session_id', sessionId)
      .eq('academy_id', academyId)

    if (enrolledData && attendedData) {
      const attendedIds = new Set(attendedData.map((a: any) => a.student_id))
      const missingStudents = enrolledData.filter((e: any) => !attendedIds.has(e.student_id))

      if (missingStudents.length > 0) {
        const absentRecords = missingStudents.map((m: any) => ({
          session_id: sessionId,
          student_id: m.student_id,
          academy_id: academyId,
          checkin_time: null,
          status: 'absent'
        }))

        const { error: insertError } = await supabase.from('attendance').insert(absentRecords)
        if (insertError) {
          console.error("Backfill insert failed:", insertError)
        }
      }
    }

    // 3. Process Schedule Migrations (if any)
    if (migrations && Array.isArray(migrations) && migrations.length > 0) {

      for (const studentId of migrations) {
        // Find existing schedule mapping to replace
        const { data: existingSchedules, error: getError } = await supabase
          .from('student_schedules')
          .select('schedule_id')
          .eq('student_id', studentId)
          .eq('academy_id', academyId)

        if (!getError && existingSchedules && existingSchedules.length > 0) {
          // Delete the old ones (usually one, but could be multiple)
          await supabase
            .from('student_schedules')
            .delete()
            .eq('student_id', studentId)
            .eq('academy_id', academyId)
        }

        // Insert the new one
        await supabase
          .from('student_schedules')
          .insert({
            student_id: studentId,
            schedule_id: targetScheduleId,
            academy_id: academyId,
            enrollment_type: 'manual'
          })

        // Update the note confirming migration
        await supabase
          .from("attendance")
          .update({ note: "Migrated to this schedule" })
          .eq("session_id", sessionId)
          .eq("student_id", studentId)
          .eq("academy_id", academyId)
      }
    }

    // 4. Finally mark the session as ended
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('academy_id', academyId)
      .select()
      .single()

    if (sessionError) throw sessionError

    return NextResponse.json({ success: true, session: sessionData }, { status: 200 })
  } catch (error: any) {
    console.error("Error ending session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to end session" },
      { status: 500 }
    )
  }
}
