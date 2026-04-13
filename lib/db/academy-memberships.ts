import { getServiceSupabase } from '../supabase';
import { AcademyMembership, AcademyMembershipInsert, AcademyMembershipUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getAcademyMemberships(academyId: string) {
  const { data, error } = await supabase
    .from('academy_memberships')
    .select(`
      *,
      instructor:instructors(
        *,
        user:users(email, full_name, avatar_url)
      )
    `)
    .eq('academy_id', academyId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return data as (AcademyMembership & { instructor: any })[];
}

export async function getInstructorAcademies(instructorId: string) {
  const { data, error } = await supabase
    .from('academy_memberships')
    .select(`
      *,
      academy:academies(id, name, slug, icon)
    `)
    .eq('instructor_id', instructorId)
    .eq('is_active', true);

  if (error) throw error;
  return data as (AcademyMembership & { academy: { id: string; name: string; slug: string; icon: string | null } })[];
}

export async function getAcademyMembership(academyId: string, instructorId: string) {
  const { data, error } = await supabase
    .from('academy_memberships')
    .select('*')
    .eq('academy_id', academyId)
    .eq('instructor_id', instructorId)
    .single();

  if (error) throw error;
  return data as AcademyMembership;
}

export async function createAcademyMembership(membership: AcademyMembershipInsert) {
  const { data, error } = await supabase
    .from('academy_memberships')
    .insert(membership)
    .select()
    .single();

  if (error) throw error;
  return data as AcademyMembership;
}

export async function updateAcademyMembership(id: string, updates: AcademyMembershipUpdate) {
  const { data, error } = await supabase
    .from('academy_memberships')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AcademyMembership;
}

export async function deleteAcademyMembership(id: string) {
  const { error } = await supabase
    .from('academy_memberships')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deactivateAcademyMembership(id: string) {
  const { data, error } = await supabase
    .from('academy_memberships')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AcademyMembership;
}
