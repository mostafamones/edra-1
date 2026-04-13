import { getServiceSupabase } from '../supabase';
import { User, UserInsert, UserUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateUser(id: string, updates: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateUserLastSeen(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}
