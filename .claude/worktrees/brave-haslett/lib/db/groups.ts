import { getServiceSupabase } from '../supabase';
import { Group, GroupInsert, GroupUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getGroups(academyId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Group[];
}

export async function getGroupsByLevel(levelId: number) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('level_id', levelId)
    .order('name');

  if (error) throw error;
  return data as Group[];
}

export async function getGroup(id: number) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Group;
}

export async function createGroup(group: GroupInsert) {
  const { data, error } = await supabase
    .from('groups')
    .insert(group)
    .select()
    .single();

  if (error) throw error;
  return data as Group;
}

export async function updateGroup(id: number, updates: GroupUpdate) {
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Group;
}

export async function deleteGroup(id: number) {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
