"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  Student,
  StudentInsert,
  StudentUpdate,
  StudentWithLevelRating,
} from "@/lib/types";
import type { PaginationParams } from "@/lib/api/response";
import { saveStudentFieldValues } from "@/lib/db/fields";

// ============================================================================
// Types
// ============================================================================

export interface StudentWithFields extends StudentInsert {
  fieldValues?: Array<{ field_id: number; field_type: string; value: any }>;
  schedule_id?: number | null;
}

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
  group:groups(*),
  schedule_enrollments(schedule:class_schedules(*)),
  student_field_values(*)
`;

const DETAIL_SELECT = `
  *,
  level:levels(*),
  group:groups(*),
  schedule_enrollments(schedule:class_schedules(*)),
  student_field_values(*)
`;

// ============================================================================
// Student Repository
// ============================================================================

export const StudentRepository = {
  /**
   * List all students for an academy (no pagination).
   */
  async list(academyId: string): Promise<StudentWithLevelRating[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .select(LIST_SELECT)
      .eq("academy_id", academyId)
      .order("full_name");

    if (error) throw error;
    return data as StudentWithLevelRating[];
  },

  /**
   * List students with pagination.
   */
  async listPaginated(
    academyId: string,
    { page, limit }: PaginationParams
  ): Promise<PaginatedResult<StudentWithLevelRating>> {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("students")
      .select(LIST_SELECT, { count: "exact" })
      .eq("academy_id", academyId)
      .order("full_name")
      .range(from, to);

    if (error) throw error;
    return { data: data as StudentWithLevelRating[], total: count ?? 0 };
  },

  /**
   * Get a single student by ID.
   */
  async getById(id: number): Promise<StudentWithLevelRating> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as StudentWithLevelRating;
  },

  /**
   * Create a student (optionally with field values).
   */
  async create(
    student: StudentInsert,
    fieldValues?: Array<{ field_id: number; field_type: string; value: any }>
  ): Promise<Student> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .insert({ ...student, status: student.status || "active" })
      .select()
      .single();

    if (error) throw error;
    const created = data as Student;

    if (fieldValues && fieldValues.length > 0) {
      await saveStudentFieldValues(created.academy_id, created.id, fieldValues);
    }

    return created;
  },

  /**
   * Update a student.
   */
  async update(id: number, updates: StudentUpdate): Promise<Student> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Student;
  },

  /**
   * Delete a student.
   */
  async delete(id: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Bulk create students (with optional field values and schedule assignment).
   */
  async createBulk(students: StudentWithFields[]): Promise<Student[]> {
    const supabase = await createClient();

    const studentsData = students.map(
      ({ fieldValues, schedule_id, ...rest }) => ({
        ...rest,
        status: rest.status || "active",
      })
    );

    const { data: insertedStudents, error: insertError } = await supabase
      .from("students")
      .insert(studentsData)
      .select();

    if (insertError) throw insertError;

    // Save field values for each student
    const fieldValuesPromises = insertedStudents.map(
      (student: any, index: number) => {
        const fieldValues = students[index].fieldValues;
        if (fieldValues && fieldValues.length > 0) {
          return saveStudentFieldValues(
            student.academy_id,
            student.id,
            fieldValues
          );
        }
        return Promise.resolve();
      }
    );

    await Promise.all(fieldValuesPromises);

    // Attach schedule_id back for subsequent operations
    return insertedStudents.map((student: any, index: number) => ({
      ...student,
      schedule_id: students[index].schedule_id,
    }));
  },
};
