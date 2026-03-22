import { getServiceSupabase } from '../supabase';
import { Enrollment, EnrollmentInsert, EnrollmentUpdate, EnrollmentWithStudent } from '../types';

const supabase: any = getServiceSupabase();

export async function getEnrollments(academyId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:students(
        *,
        level:levels(*),
        group:groups(*)
      ),
      course:courses(
        *,
        level:levels(*),
        group:groups(*)
      )
    `)
    .eq('academy_id', academyId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data as Enrollment[];
}

export async function getCourseEnrollments(courseId: number) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:students(*)
    `)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data as EnrollmentWithStudent[];
}

export async function getStudentEnrollments(studentId: number) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('student_id', studentId);

  if (error) throw error;
  return data as Enrollment[];
}

export async function getEnrollment(id: number) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Enrollment;
}

export async function createEnrollment(enrollment: EnrollmentInsert) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert(enrollment)
    .select()
    .single();

  if (error) throw error;
  return data as Enrollment;
}

export async function updateEnrollment(id: number, updates: EnrollmentUpdate) {
  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Enrollment;
}

export async function deleteEnrollment(id: number) {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function completeEnrollment(enrollmentId: number) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) throw error;
  return data as Enrollment;
}
