import { getServiceSupabase } from '../supabase';
import { Student, StudentInsert, StudentUpdate, StudentWithLevelRating } from '../types';
import { saveStudentFieldValues } from './fields';
import type { ListPagination, PaginatedResult } from './pagination';

const supabase: any = getServiceSupabase();

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

/**
 * Fetch students for an academy.
 *
 * When `pagination` is provided, a bounded slice and a total count are returned
 * (slightly more expensive due to the exact count query). When omitted, the
 * full list is returned for backward-compat with existing callers.
 */
export async function getStudents(academyId: string): Promise<StudentWithLevelRating[]>;
export async function getStudents(
  academyId: string,
  pagination: ListPagination
): Promise<PaginatedResult<StudentWithLevelRating>>;
export async function getStudents(
  academyId: string,
  pagination?: ListPagination
): Promise<StudentWithLevelRating[] | PaginatedResult<StudentWithLevelRating>> {
  let query = supabase
    .from('students')
    .select(LIST_SELECT, pagination ? { count: 'exact' } : {})
    .eq('academy_id', academyId)
    .order('full_name');

  if (pagination) {
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  if (pagination) {
    return {
      data: (data ?? []) as StudentWithLevelRating[],
      total: count ?? 0,
    };
  }
  return data as StudentWithLevelRating[];
}

export async function getStudent(id: number) {
  const { data, error } = await supabase
    .from('students')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as StudentWithLevelRating;
}

export async function createStudent(student: StudentInsert) {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) throw error;
  return data as Student;
}

export async function updateStudent(id: number, updates: StudentUpdate) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Student;
}

export async function deleteStudent(id: number) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export interface StudentWithFields extends StudentInsert {
  fieldValues?: Array<{ field_id: number; field_type: string; value: any }>;
  schedule_id?: number | null;
  course_id?: number | null;
}

export async function createStudentsBulk(students: StudentWithFields[]) {
  // Extract student data (without extra properties) for batch insert
  const studentsData = students.map(({ fieldValues, schedule_id, course_id, ...rest }) => ({
    ...rest,
    status: rest.status || 'active'
  }));

  // Batch insert students
  const { data: insertedStudents, error: insertError } = await supabase
    .from('students')
    .insert(studentsData)
    .select();

  if (insertError) throw insertError;

  // Now save field values and enrollments for each student
  const promises = insertedStudents.map(async (student: any, index: number) => {
    const { fieldValues, schedule_id, course_id } = students[index];
    const studentId = student.id;

    const operations = [];

    if (fieldValues && fieldValues.length > 0) {
      operations.push(saveStudentFieldValues(student.academy_id, studentId, fieldValues));
    }

    if (schedule_id) {
      operations.push(
        supabase.from('schedule_enrollments').insert({
          academy_id: student.academy_id,
          student_id: studentId,
          schedule_id,
          enrollment_type: 'manual',
        })
      );
    }

    if (course_id) {
      operations.push(
        supabase.from('enrollments').insert({
          academy_id: student.academy_id,
          student_id: studentId,
          course_id,
          status: 'active',
        })
      );
    }

    return Promise.all(operations);
  });

  await Promise.all(promises);

  return insertedStudents;
}

export { saveStudentFieldValues };
