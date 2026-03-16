import { getServiceSupabase } from '../supabase';
import { Attendance, AttendanceInsert, AttendanceUpdate, AttendanceWithStudent } from '../types';

const supabase: any = getServiceSupabase();

export async function getSessionAttendance(sessionId: number) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      student:students(
        *,
        student_schedules(*)
      )
    `)
    .eq('session_id', sessionId)
    .order('student_id');

  if (error) throw error;
  return data as AttendanceWithStudent[];
}

export async function recordAttendance(attendance: AttendanceInsert) {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(attendance) // Use upsert for create or update
    .select()
    .single();

  if (error) throw error;
  return data as Attendance;
}

export async function deleteAttendance(sessionId: number, studentId: number) {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('session_id', sessionId)
    .eq('student_id', studentId);

  if (error) throw error;
}

export async function getStudentAttendanceHistory(studentId: number) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      session:sessions(*)
    `)
    .eq('student_id', studentId)
    .order('attended_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentAttendanceSummary(academyId: string) {
  const { data, error } = await supabase
    .from('student_attendance_summary')
    .select('*')
    .eq('academy_id', academyId);

  if (error) throw error;
  return data;
}
