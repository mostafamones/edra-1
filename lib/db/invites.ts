import { createClient } from '@/utils/supabase/server';
import { getServiceSupabase } from '@/utils/supabase/admin';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

export type InviteStatus = 'pending' | 'accepted' | 'revoked';

export type InstructorInvite = {
  id: string;
  academy_id: string;
  invited_by: string;
  token: string;
  email: string | null;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
};

// Generate a new invite link
export async function generateInvite(academyId: string, email?: string) {
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
export async function listInvites(academyId: string) {
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
export async function revokeInvite(inviteId: string) {
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
export async function validateInviteToken(token: string) {
  const supabase = getServiceSupabase() as SupabaseClient<Database>;

  const { data: invite, error } = await supabase
    .from('instructor_invites')
    .select('*, academy:academies(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !invite) {
    return null; // Invalid or expired
  }

  return invite;
}

// Accept an invite token (internal usage during signup)
export async function acceptInviteToken(token: string) {
  const supabase = getServiceSupabase() as SupabaseClient<Database>; // Needs admin to update the invite as an unauthenticated/newly authenticated user

  const { data, error } = await supabase
    .from('instructor_invites')
    .update({ status: 'accepted' } as never)
    .eq('token', token)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InstructorInvite;
}
