import { getServiceSupabase } from '../supabase';
import { Session, SessionInsert, SessionUpdate, SessionWithSchedule } from '../types';
import type { ListPagination, PaginatedResult } from './pagination';

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
        group:groups(*),
        course:courses(*)
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

const SESSIONS_RANGE_SELECT = `
  *,
  schedule:class_schedules(
    *,
    level:levels(*),
    group:groups(*),
    course:courses(*)
  )
`;

export async function getSessionsByDateRange(
  academyId: string,
  startDate: string,
  endDate: string
): Promise<SessionWithSchedule[]>;
export async function getSessionsByDateRange(
  academyId: string,
  startDate: string,
  endDate: string,
  pagination: ListPagination
): Promise<PaginatedResult<SessionWithSchedule>>;
export async function getSessionsByDateRange(
  academyId: string,
  startDate: string,
  endDate: string,
  pagination?: ListPagination
) {
  let query = supabase
    .from('sessions')
    .select(SESSIONS_RANGE_SELECT, pagination ? { count: 'exact' } : {})
    .eq('academy_id', academyId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)
    .order('session_date');

  if (pagination) {
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  if (pagination) {
    return { data: (data ?? []) as SessionWithSchedule[], total: count ?? 0 };
  }
  return data as SessionWithSchedule[];
}
