import { getServiceSupabase } from '../supabase';
import { ScheduleEnrollment, ScheduleEnrollmentInsert, ScheduleEnrollmentUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getScheduleEnrollments(academyId: string) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .select(`
      *,
      student:students(
        *,
        level:levels(*),
        group:groups(*)
      ),
      schedule:class_schedules(*)
    `)
    .eq('academy_id', academyId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data as (ScheduleEnrollment & { student: any; schedule: any })[];
}

export async function getScheduleStudents(scheduleId: number) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .select(`
      *,
      student:students(
        *,
        level:levels(*),
        group:groups(*)
      )
    `)
    .eq('schedule_id', scheduleId)
    .order('enrolled_at', { ascending: true });

  if (error) throw error;
  return data?.map((item: any) => item.student);
}

export async function getStudentScheduleEnrollments(studentId: number) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .select(`
      *,
      schedule:class_schedules(
        *,
        time_slots:schedule_time_slots(*)
      )
    `)
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data?.map((item: any) => item.schedule);
}

export async function getScheduleEnrollment(id: number) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ScheduleEnrollment;
}

export async function enrollStudentInSchedule(enrollment: ScheduleEnrollmentInsert) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .insert(enrollment)
    .select()
    .single();

  if (error) throw error;
  return data as ScheduleEnrollment;
}

export async function updateScheduleEnrollment(id: number, updates: ScheduleEnrollmentUpdate) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ScheduleEnrollment;
}

export async function unenrollStudentFromSchedule(studentId: number, scheduleId: number) {
  const { error } = await supabase
    .from('schedule_enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('schedule_id', scheduleId);

  if (error) throw error;
}

export async function deleteScheduleEnrollment(id: number) {
  const { error } = await supabase
    .from('schedule_enrollments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
