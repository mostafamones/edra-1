"use server";

import { createClient } from "@/utils/supabase/server";
import type { Academy, AcademyInsert, AcademyUpdate } from "@/lib/types";

// ============================================================================
// Academy Repository
// ============================================================================

export const AcademyRepository = {
  /**
   * Get academy by ID.
   */
  async getById(id: string): Promise<Academy> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("academies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Academy;
  },

  /**
   * Create a new academy.
   */
  async create(academy: AcademyInsert): Promise<Academy> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("academies")
      .insert(academy as any)
      .select()
      .single();

    if (error) throw error;
    return data as Academy;
  },

  /**
   * Update an academy.
   */
  async update(id: string, updates: AcademyUpdate): Promise<Academy> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("academies")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Academy;
  },
};
