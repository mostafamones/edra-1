import { getServiceSupabase } from '../supabase';
import { Level, LevelInsert, LevelUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getLevels(academyId: string) {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Level[];
}

export async function getLevel(id: number) {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Level;
}

export async function createLevel(level: LevelInsert) {
  const { data, error } = await supabase
    .from('levels')
    .insert(level)
    .select()
    .single();

  if (error) throw error;
  return data as Level;
}

export async function updateLevel(id: number, updates: LevelUpdate) {
  const { data, error } = await supabase
    .from('levels')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Level;
}

export async function deleteLevel(id: number) {
  const { error } = await supabase
    .from('levels')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
