"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithSchedule,
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
// Shared select strings
// ============================================================================

const WITH_SCHEDULE_SELECT = `
  *,
  schedule:class_schedules(
    *,
    level:levels(*),
    branch:branches(*),
    time_slots:schedule_time_slots(*)
  )
`;

// ============================================================================
// Session Repository
// ============================================================================

export const SessionRepository = {
  // ── List & Get ──────────────────────────────────────────────

  /**
   * List sessions for a specific schedule.
   */
  async listBySchedule(scheduleId: number): Promise<Session[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("schedule_id", scheduleId)
      .order("session_date", { ascending: false });

    if (error) throw error;
    return data as Session[];
  },

  /**
   * List sessions within a date range for an academy.
   */
  async listByDateRange(
    academyId: string,
    startDate: string,
    endDate: string
  ): Promise<SessionWithSchedule[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(WITH_SCHEDULE_SELECT)
      .eq("academy_id", academyId)
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date");

    if (error) throw error;
    return data as SessionWithSchedule[];
  },

  /**
   * List sessions within a date range with pagination.
   */
  async listByDateRangePaginated(
    academyId: string,
    startDate: string,
    endDate: string,
    { page, limit }: PaginationParams
  ): Promise<PaginatedResult<SessionWithSchedule>> {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("sessions")
      .select(WITH_SCHEDULE_SELECT, { count: "exact" })
      .eq("academy_id", academyId)
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date")
      .range(from, to);

    if (error) throw error;
    return { data: data as SessionWithSchedule[], total: count ?? 0 };
  },

  /**
   * Get a single session by ID (with schedule details).
   */
  async getById(id: number): Promise<SessionWithSchedule> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(WITH_SCHEDULE_SELECT)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as SessionWithSchedule;
  },

  // ── CRUD ───────────────────────────────────────────────────

  /**
   * Create a new session.
   */
  async create(session: SessionInsert): Promise<Session> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data as Session;
  },

  /**
   * Update a session.
   */
  async update(id: number, updates: SessionUpdate): Promise<Session> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Session;
  },

  /**
   * Delete a session.
   */
  async delete(id: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // ── Business Logic ─────────────────────────────────────────

  /**
   * End a live session.
   */
  async endSession(id: number): Promise<Session> {
    return this.update(id, { status: "completed" });
  },

  /**
   * Cancel a session.
   */
  async cancelSession(id: number): Promise<Session> {
    return this.update(id, { is_cancelled: true });
  },
};
