import { getServiceSupabase } from '../supabase';
import { Instructor, InstructorInsert, InstructorUpdate, InstructorWithContext } from '../types';

const supabase: any = getServiceSupabase();

export async function getInstructors(academyId: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select(`
      *,
      user:users(email, full_name, avatar_url),
      academy_memberships(
        *,
        academy:academies(name)
      )
    `)
    .eq('academy_memberships.academy_id', academyId)
    .eq('academy_memberships.is_active', true)
    .order('academy_memberships.joined_at', { ascending: false });

  if (error) throw error;
  return data as (Instructor & { user?: any; academy_memberships?: any[] })[];
}

export async function getInstructor(id: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select(`
      *,
      user:users(email, full_name, avatar_url),
      academy_memberships(
        *,
        academy:academies(name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as InstructorWithContext;
}

export async function getInstructorByUserId(userId: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select(`
      *,
      user:users(email, full_name, avatar_url)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as (Instructor & { user?: any }) | null;
}

export async function createInstructor(instructor: InstructorInsert) {
  const { data, error } = await supabase
    .from('instructors')
    .insert(instructor)
    .select()
    .single();

  if (error) throw error;
  return data as Instructor;
}

export async function updateInstructor(id: string, updates: InstructorUpdate) {
  const { data, error } = await supabase
    .from('instructors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Instructor;
}

export async function deleteInstructor(id: string) {
  const { error } = await supabase
    .from('instructors')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function linkInstructorToAcademy(instructorId: string, academyId: string, role: string = 'instructor') {
  const { data, error } = await supabase
    .from('academy_memberships')
    .insert({
      academy_id: academyId,
      instructor_id: instructorId,
      role,
      is_active: true,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
