"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  Instructor,
  InstructorInsert,
  InstructorUpdate,
} from "@/lib/types";
import type { PaginationParams } from "@/lib/api/response";

// ============================================================================
// Types
// ============================================================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ============================================================================
// Instructor Repository
// ============================================================================

export const InstructorRepository = {
  /**
   * List all instructors for an academy.
   */
  async list(academyId: string): Promise<Instructor[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instructors")
      .select("*")
      .eq("academy_id", academyId);

    if (error) throw error;
    return data as Instructor[];
  },

  /**
   * List instructors with pagination.
   */
  async listPaginated(
    academyId: string,
    { page, limit }: PaginationParams
  ): Promise<PaginatedResult<Instructor>> {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("instructors")
      .select("*", { count: "exact" })
      .eq("academy_id", academyId)
      .range(from, to);

    if (error) throw error;
    return { data: data as Instructor[], total: count ?? 0 };
  },

  /**
   * Get a single instructor by ID.
   */
  async getById(id: string): Promise<Instructor> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instructors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Instructor;
  },

  /**
   * Get an active instructor by ID (returns null if not found or inactive).
   */
  async getActive(id: string): Promise<Instructor | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instructors")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) return null;
    return data as Instructor;
  },

  /**
   * Create a new instructor.
   */
  async create(instructor: InstructorInsert): Promise<Instructor> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instructors")
      .insert(instructor)
      .select()
      .single();

    if (error) throw error;
    return data as Instructor;
  },

  /**
   * Update an instructor.
   */
  async update(id: string, updates: InstructorUpdate): Promise<Instructor> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instructors")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Instructor;
  },

  /**
   * Delete an instructor.
   */
  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("instructors")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  /**
   * List only active instructors for an academy.
   */
  async listActive(academyId: string): Promise<Instructor[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instructors")
      .select("*")
      .eq("academy_id", academyId)
      .eq("is_active", true);

    if (error) throw error;
    return data as Instructor[];
  },
};
