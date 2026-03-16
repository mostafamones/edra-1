import { getServiceSupabase } from '../supabase';
import { Student, StudentInsert, StudentUpdate, StudentWithLevelRating } from '../types';

const supabase: any = getServiceSupabase();

export async function getStudents(academyId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      level:levels(*),
      branch:branches(*),
      student_schedules(schedule:class_schedules(*)),
      student_field_values(*)
    `)
    .eq('academy_id', academyId)
    .order('full_name');

  if (error) throw error;
  return data as StudentWithLevelRating[];
}

export async function getStudent(id: number) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      level:levels(*),
      branch:branches(*),
      student_schedules(schedule:class_schedules(*))
    `)
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
}

export async function createStudentsBulk(students: StudentWithFields[]) {
  // Extract student data (without extra properties) for batch insert
  const studentsData = students.map(({ fieldValues, schedule_id, ...rest }) => ({
    ...rest,
    status: rest.status || 'active'
  }));

  // Batch insert students
  const { data: insertedStudents, error: insertError } = await supabase
    .from('students')
    .insert(studentsData)
    .select();

  if (insertError) throw insertError;

  // Now save field values for each student
  const fieldValuesPromises = insertedStudents.map((student: any, index: number) => {
    const fieldValues = students[index].fieldValues;
    if (fieldValues && fieldValues.length > 0) {
      return saveStudentFieldValues(student.academy_id, student.id, fieldValues);
    }
    return Promise.resolve();
  });

  await Promise.all(fieldValuesPromises);

  // Attach schedule_id back to the students for subsequent operations
  const finalStudents = insertedStudents.map((student: any, index: number) => ({
    ...student,
    schedule_id: students[index].schedule_id
  }));

  return finalStudents;
}

// Re-export saveStudentFieldValues for use in bulk import
import { saveStudentFieldValues } from './fields';
export { saveStudentFieldValues };
