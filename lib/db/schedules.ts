import { getServiceSupabase } from '../supabase';
import {
  Schedule,
  ScheduleInsert,
  ScheduleUpdate,
  ScheduleTimeSlotInsert,
  ScheduleEnrollmentInsert,
} from '../types';

const supabase: any = getServiceSupabase();

export async function getSchedules(academyId: string) {
  const { data, error } = await supabase
    .from('class_schedules')
    .select(`
      *,
      level:levels(*),
      group:groups(*),
      schedule_group:schedule_groups(*),
      time_slots:schedule_time_slots(*),
      schedule_enrollments(count)
    `)
    .eq('academy_id', academyId)
    .order('name');

  if (error) throw error;
  return data;
}

export async function getSchedule(id: number) {
  const { data, error } = await supabase
    .from('class_schedules')
    .select(`
      *,
      level:levels(*),
      group:groups(*),
      schedule_group:schedule_groups(*),
      time_slots:schedule_time_slots(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createSchedule(schedule: ScheduleInsert) {
  const { data, error } = await supabase
    .from('class_schedules')
    .insert(schedule)
    .select()
    .maybeSingle();

  if (error) throw error;
  return (data || schedule) as Schedule;
}

export async function updateSchedule(id: number, updates: ScheduleUpdate) {
  const { data, error } = await supabase
    .from('class_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return (data || { id, ...updates }) as Schedule;
}

export async function deleteSchedule(id: number) {
  const { error } = await supabase
    .from('class_schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========================
// TIME SLOTS
// ========================

export async function getTimeSlots(scheduleId: number) {
  const { data, error } = await supabase
    .from('schedule_time_slots')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('day_of_week')
    .order('start_time');

  if (error) throw error;
  return data;
}

export async function createTimeSlot(slot: ScheduleTimeSlotInsert) {
  const { data, error } = await supabase
    .from('schedule_time_slots')
    .insert(slot)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTimeSlot(id: number) {
  const { error } = await supabase
    .from('schedule_time_slots')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function replaceTimeSlots(scheduleId: number, slots: Omit<ScheduleTimeSlotInsert, 'schedule_id'>[]) {
  // First get the academy_id from the schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('class_schedules')
    .select('academy_id')
    .eq('id', scheduleId)
    .single();

  if (scheduleError) throw scheduleError;

  // Delete existing slots
  const { error: delError } = await supabase
    .from('schedule_time_slots')
    .delete()
    .eq('schedule_id', scheduleId);

  if (delError) throw delError;

  if (slots.length === 0) return [];

  // Insert new slots with academy_id
  const { data, error } = await supabase
    .from('schedule_time_slots')
    .insert(slots.map(s => ({ ...s, schedule_id: scheduleId, academy_id: schedule.academy_id })))
    .select();

  if (error) throw error;
  return data;
}

// ========================
// STUDENT ENROLLMENT
// ========================

export async function enrollStudentInSchedule(enrollment: ScheduleEnrollmentInsert) {
  const { error } = await supabase
    .from('schedule_enrollments')
    .insert(enrollment);

  if (error) throw error;
}

export async function unenrollStudentFromSchedule(studentId: number, scheduleId: number) {
  const { error } = await supabase
    .from('schedule_enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('schedule_id', scheduleId);

  if (error) throw error;
}

export async function getStudentSchedules(studentId: number) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .select(`
      schedule:class_schedules(
        *,
        time_slots:schedule_time_slots(*)
      )
    `)
    .eq('student_id', studentId)
    .order('schedule:class_schedules(is_mandatory)', { ascending: true });

  if (error) throw error;
  return data?.map((item: any) => item.schedule) as Schedule[];
}

export async function getScheduleStudents(scheduleId: number) {
  const { data, error } = await supabase
    .from('schedule_enrollments')
    .select(`
      student:students(*)
    `)
    .eq('schedule_id', scheduleId);

  if (error) throw error;
  return data?.map((item: any) => item.student);
}

// ========================
// SCHEDULE GROUPS
// ========================

export async function getScheduleGroups(academyId: string) {
  const { data, error } = await supabase
    .from('schedule_groups')
    .select(`
      *,
      level:levels(*),
      group:groups(*),
      schedules:class_schedules(id, name)
    `)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createScheduleGroup(group: { academy_id: string; name: string; level_id?: number | null; branch_id?: number | null; min_attendance?: number }) {
  const { data, error } = await supabase
    .from('schedule_groups')
    .insert(group)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteScheduleGroup(id: number) {
  const { error } = await supabase
    .from('schedule_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
