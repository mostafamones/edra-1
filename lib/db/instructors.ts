
import { getServiceSupabase } from '../supabase';
import { Instructor, InstructorInsert, InstructorUpdate, InstructorRole, InstructorRoleType } from '../types';

const supabase: any = getServiceSupabase();

export async function getInstructors(academyId: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('academy_id', academyId);

  if (error) throw error;
  return data as Instructor[];
}

export async function getInstructor(id: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Instructor;
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

export async function getActiveInstructor(id: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as Instructor;
}
