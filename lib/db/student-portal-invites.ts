import { getServiceSupabase } from '../supabase';
import { StudentPortalInvite, StudentPortalInviteInsert, StudentPortalInviteUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getStudentPortalInvites(academyId: string) {
  const { data, error } = await supabase
    .from('student_portal_invites')
    .select(`
      *,
      invited_by:instructors(full_name, email),
      student:students(full_name)
    `)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as (StudentPortalInvite & { invited_by: any; student: any })[];
}

export async function getStudentPortalInvite(token: string) {
  const { data, error } = await supabase
    .from('student_portal_invites')
    .select(`
      *,
      academy:academies(name),
      invited_by:instructors(full_name)
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (error) throw error;
  return data as StudentPortalInvite;
}

export async function getStudentPortalInviteById(id: string) {
  const { data, error } = await supabase
    .from('student_portal_invites')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as StudentPortalInvite;
}

export async function createStudentPortalInvite(invite: StudentPortalInviteInsert) {
  const { data, error } = await supabase
    .from('student_portal_invites')
    .insert(invite)
    .select()
    .single();

  if (error) throw error;
  return data as StudentPortalInvite;
}

export async function updateStudentPortalInvite(id: string, updates: StudentPortalInviteUpdate) {
  const { data, error } = await supabase
    .from('student_portal_invites')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as StudentPortalInvite;
}

export async function acceptStudentPortalInvite(token: string) {
  const { data, error } = await supabase
    .from('student_portal_invites')
    .update({ status: 'accepted' })
    .eq('token', token)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) throw error;
  return data as StudentPortalInvite;
}

export async function revokeStudentPortalInvite(id: string) {
  const { error } = await supabase
    .from('student_portal_invites')
    .update({ status: 'revoked' })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteStudentPortalInvite(id: string) {
  const { error } = await supabase
    .from('student_portal_invites')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getExpiredInvites() {
  const { data, error } = await supabase
    .from('student_portal_invites')
    .select('*')
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  if (error) throw error;
  return data as StudentPortalInvite[];
}
