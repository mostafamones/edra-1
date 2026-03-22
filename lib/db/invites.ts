import { createClient } from '@/utils/supabase/server';
import { getServiceSupabase } from '@/utils/supabase/admin';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';
import { InstructorInvite, StudentPortalInvite } from '@/lib/types';

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

// ========================
// INSTRUCTOR INVITES
// ========================

// Generate a new invite link
export async function generateInstructorInvite(academyId: string, email?: string, role: string = 'instructor') {
  const supabase = await createClient();

  // Need to get current user to set as 'invited_by'
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('instructor_invites')
    .insert({
      academy_id: academyId,
      invited_by: user.id,
      email: email || null,
      role,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InstructorInvite;
}

// List all invites for an academy
export async function listInstructorInvites(academyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('instructor_invites')
    .select(`
      *,
      invited_by_instructor:instructors!invited_by(full_name, email)
    `)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Revoke an invite
export async function revokeInstructorInvite(inviteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('instructor_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InstructorInvite;
}

// Validate an invite token (public facing - uses admin client to bypass RLS since unauthenticated user is checking)
export async function validateInstructorInviteToken(token: string) {
  const supabase = getServiceSupabase() as SupabaseClient<Database>;

  const { data: invite, error } = await supabase
    .from('instructor_invites')
    .select('*, academy:academies(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !invite) {
    return null;
  }

  return invite;
}

// Accept an invite token (internal usage during signup)
export async function acceptInstructorInviteToken(token: string) {
  const supabase = getServiceSupabase() as SupabaseClient<Database>;

  const { data, error } = await supabase
    .from('instructor_invites')
    .update({ status: 'accepted' })
    .eq('token', token)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InstructorInvite;
}

// ========================
// STUDENT PORTAL INVITES
// ========================

// Generate a student portal invite
export async function generateStudentPortalInvite(academyId: string, studentId: number, email: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('student_portal_invites')
    .insert({
      academy_id: academyId,
      student_id: studentId,
      invited_by: user.id,
      email,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StudentPortalInvite;
}

// Validate a student portal invite token
export async function validateStudentPortalInviteToken(token: string) {
  const supabase = getServiceSupabase() as SupabaseClient<Database>;

  const { data: invite, error } = await supabase
    .from('student_portal_invites')
    .select(`
      *,
      student:students(*),
      academy:academies(name)
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !invite) {
    return null;
  }

  return invite;
}

// Accept a student portal invite token
export async function acceptStudentPortalInviteToken(token: string) {
  const supabase = getServiceSupabase() as SupabaseClient<Database>;

  const { data, error } = await supabase
    .from('student_portal_invites')
    .update({ status: 'accepted' })
    .eq('token', token)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StudentPortalInvite;
}
