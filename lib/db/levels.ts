import { getServiceSupabase } from '../supabase';
import { Level, LevelInsert, LevelUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getLevels(academyId: string) {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('academy_id', academyId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

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
  // Assign sort_order = max existing + 1 for this academy if not provided
  if (level.sort_order === undefined || level.sort_order === null) {
    const { data: existing } = await supabase
      .from('levels')
      .select('sort_order')
      .eq('academy_id', level.academy_id)
      .order('sort_order', { ascending: false })
      .limit(1);
    const maxOrder = existing?.[0]?.sort_order ?? 0;
    level = { ...level, sort_order: maxOrder + 1 };
  }

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

/**
 * Bulk-update sort_order for a list of levels.
 * @param orderedIds  Level IDs in the desired display order (index 0 = top).
 */
export async function reorderLevels(orderedIds: number[]) {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('levels')
      .update({ sort_order: index + 1 })
      .eq('id', id)
  );
  const results = await Promise.all(updates);
  for (const { error } of results) {
    if (error) throw error;
  }
}
