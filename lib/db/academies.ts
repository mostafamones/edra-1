
import { getServiceSupabase } from '../supabase';
import { Academy, AcademyInsert, AcademyUpdate } from '../types';

const supabase: any = getServiceSupabase();

export async function getAcademy(id: string) {
  const { data, error } = await supabase
    .from('academies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Academy;
}

export async function createAcademy(academy: AcademyInsert) {
  const { data, error } = await supabase
    .from('academies')
    .insert(academy as any)
    .select()
    .single();

  if (error) throw error;
  return data as Academy;
}

export async function updateAcademy(id: string, updates: AcademyUpdate) {
  const { data, error } = await supabase
    .from('academies')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Academy;
}
