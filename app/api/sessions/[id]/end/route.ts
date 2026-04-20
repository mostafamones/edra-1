import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { requireAcademyAccess } from "@/lib/api/guard"
import { errors } from "@/lib/api/response"
import { validateBody } from "@/lib/api/validation"
import { endSessionSchema } from "@/lib/schemas"
import { getErrorMessage } from "@/lib/get-error-message"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const resolvedParams = await params
  const sessionId = parseInt(resolvedParams.id, 10)
  if (!Number.isFinite(sessionId)) {
    return errors.badRequest("Invalid Session ID format")
  }

  const parsed = await validateBody(request, endSessionSchema)
  if (!parsed.success) return parsed.response

  const auth = await requireAcademyAccess(parsed.data.academyId)
  if (!auth.ok) return auth.response

  const { migrations, notes } = parsed.data
  const academyId = auth.ctx.academyId
  const supabase = await createClient()

  try {

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
      .from('schedule_enrollments')
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
          .from('schedule_enrollments')
          .select('schedule_id')
          .eq('student_id', studentId)
          .eq('academy_id', academyId)

        if (!getError && existingSchedules && existingSchedules.length > 0) {
          // Delete the old ones (usually one, but could be multiple)
          await supabase
            .from('schedule_enrollments')
            .delete()
            .eq('student_id', studentId)
            .eq('academy_id', academyId)
        }

        // Insert the new one
        await supabase
          .from('schedule_enrollments')
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
  } catch (error) {
    console.error("Error ending session:", error)
    return errors.internal(getErrorMessage(error) || "Failed to end session")
  }
}
