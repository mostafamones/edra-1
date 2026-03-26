"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  Schedule,
  ScheduleInsert,
  ScheduleUpdate,
  ScheduleTimeSlotInsert,
  StudentScheduleInsert,
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

const LIST_SELECT = `
  *,
  level:levels(*),
  branch:branches(*),
  schedule_group:schedule_groups(*),
  time_slots:schedule_time_slots(*),
  schedule_enrollments(count)
`;

const DETAIL_SELECT = `
  *,
  level:levels(*),
  branch:branches(*),
  schedule_group:schedule_groups(*),
  time_slots:schedule_time_slots(*)
`;

// ============================================================================
// Schedule Repository
// ============================================================================

export const ScheduleRepository = {
  // ── List & Get ──────────────────────────────────────────────

  /**
   * List all schedules for an academy.
   */
  async list(academyId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("class_schedules")
      .select(LIST_SELECT)
      .eq("academy_id", academyId)
      .order("name");

    if (error) throw error;
    return data;
  },

  /**
   * List schedules with pagination.
   */
  async listPaginated(academyId: string, { page, limit }: PaginationParams) {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("class_schedules")
      .select(LIST_SELECT, { count: "exact" })
      .eq("academy_id", academyId)
      .order("name")
      .range(from, to);

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  /**
   * Get a single schedule by ID.
   */
  async getById(id: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("class_schedules")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // ── CRUD ───────────────────────────────────────────────────

  /**
   * Create a schedule.
   */
  async create(schedule: ScheduleInsert): Promise<Schedule> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("class_schedules")
      .insert(schedule)
      .select()
      .maybeSingle();

    if (error) throw error;
    return (data || schedule) as Schedule;
  },

  /**
   * Create a schedule with time slots in one operation.
   */
  async createWithTimeSlots(
    schedule: ScheduleInsert,
    timeSlots: Omit<ScheduleTimeSlotInsert, "schedule_id">[]
  ): Promise<Schedule> {
    const created = await this.create(schedule);

    if (timeSlots.length > 0) {
      await this.replaceTimeSlots(created.id, timeSlots);
    }

    return created;
  },

  /**
   * Update a schedule.
   */
  async update(id: number, updates: ScheduleUpdate): Promise<Schedule> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("class_schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return (data || { id, ...updates }) as Schedule;
  },

  /**
   * Delete a schedule.
   */
  async delete(id: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("class_schedules")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // ── Time Slots ──────────────────────────────────────────────

  /**
   * Get time slots for a schedule.
   */
  async getTimeSlots(scheduleId: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schedule_time_slots")
      .select("*")
      .eq("schedule_id", scheduleId)
      .order("day_of_week")
      .order("start_time");

    if (error) throw error;
    return data;
  },

  /**
   * Replace all time slots for a schedule (delete + insert).
   */
  async replaceTimeSlots(
    scheduleId: number,
    slots: Omit<ScheduleTimeSlotInsert, "schedule_id">[]
  ) {
    const supabase = await createClient();

    // Get academy_id from the schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from("class_schedules")
      .select("academy_id")
      .eq("id", scheduleId)
      .single();

    if (scheduleError) throw scheduleError;

    // Delete existing
    const { error: delError } = await supabase
      .from("schedule_time_slots")
      .delete()
      .eq("schedule_id", scheduleId);

    if (delError) throw delError;

    if (slots.length === 0) return [];

    // Insert new
    const { data, error } = await supabase
      .from("schedule_time_slots")
      .insert(
        slots.map((s) => ({
          ...s,
          schedule_id: scheduleId,
          academy_id: schedule.academy_id,
        }))
      )
      .select();

    if (error) throw error;
    return data;
  },

  // ── Student Enrollment ──────────────────────────────────────

  /**
   * Enroll a student in a schedule.
   */
  async enrollStudent(enrollment: ScheduleEnrollmentInsert): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("schedule_enrollments")
      .insert(enrollment);
    if (error) throw error;
  },

  /**
   * Unenroll a student from a schedule.
   */
  async unenrollStudent(
    studentId: number,
    scheduleId: number
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("schedule_enrollments")
      .delete()
      .eq("student_id", studentId)
      .eq("schedule_id", scheduleId);
    if (error) throw error;
  },

  /**
   * Get all schedules a student is enrolled in.
   */
  async getStudentSchedules(studentId: number): Promise<Schedule[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schedule_enrollments")
      .select(
        `schedule:class_schedules(*, time_slots:schedule_time_slots(*))`
      )
      .eq("student_id", studentId);

    if (error) throw error;
    return (data?.map((item: any) => item.schedule) as Schedule[]) ?? [];
  },

  /**
   * Get all students enrolled in a schedule.
   */
  async getScheduleStudents(scheduleId: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schedule_enrollments")
      .select(`student:students(*)`)
      .eq("schedule_id", scheduleId);

    if (error) throw error;
    return data?.map((item: any) => item.student) ?? [];
  },

  // ── Schedule Groups ────────────────────────────────────────

  /**
   * List schedule groups for an academy.
   */
  async listGroups(academyId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schedule_groups")
      .select(
        `*, level:levels(*), branch:branches(*), schedules:class_schedules(id, name)`
      )
      .eq("academy_id", academyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Create a schedule group.
   */
  async createGroup(group: {
    academy_id: string;
    name: string;
    level_id?: number | null;
    branch_id?: number | null;
    min_attendance?: number;
  }) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schedule_groups")
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a schedule group.
   */
  async deleteGroup(id: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("schedule_groups")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
