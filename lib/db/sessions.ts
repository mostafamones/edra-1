import { getServiceSupabase } from '../supabase';
import { Session, SessionInsert, SessionUpdate, SessionWithSchedule } from '../types';

const supabase: any = getServiceSupabase();

export async function getSessions(scheduleId: number) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('session_date', { ascending: false });

  if (error) throw error;
  return data as Session[];
}

export async function getSession(id: number) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      schedule:class_schedules(
        *,
        level:levels(*),
        branch:branches(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as SessionWithSchedule;
}

export async function createSession(session: SessionInsert) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data as Session;
}

export async function updateSession(id: number, updates: SessionUpdate) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Session;
}

export async function deleteSession(id: number) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSessionsByDateRange(academyId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      schedule:class_schedules(
        *,
        level:levels(*),
        branch:branches(*)
      )
    `)
    .eq('academy_id', academyId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)
    .order('session_date');

  if (error) throw error;
  return data as SessionWithSchedule[];
}
