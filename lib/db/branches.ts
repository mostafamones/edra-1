import { getServiceSupabase } from '../supabase';
import { Branch, BranchInsert, BranchUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getBranches(academyId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Branch[];
}

export async function getBranchesByLevel(levelId: number) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('level_id', levelId)
    .order('name');

  if (error) throw error;
  return data as Branch[];
}

export async function getBranch(id: number) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Branch;
}

export async function createBranch(branch: BranchInsert) {
  const { data, error } = await supabase
    .from('branches')
    .insert(branch)
    .select()
    .single();

  if (error) throw error;
  return data as Branch;
}

export async function updateBranch(id: number, updates: BranchUpdate) {
  const { data, error } = await supabase
    .from('branches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Branch;
}

export async function deleteBranch(id: number) {
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
