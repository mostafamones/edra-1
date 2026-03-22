import { getServiceSupabase } from '../supabase';
import { Course, CourseInsert, CourseUpdate, CourseWithRelations } from '../types';

const supabase: any = getServiceSupabase();

export async function getCourses(academyId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      level:levels(*),
      group:groups(*),
      created_by:instructors(full_name),
      assignments:assignments(*)
    `)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as CourseWithRelations[];
}

export async function getCourse(id: number) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      level:levels(*),
      group:groups(*),
      created_by:instructors(full_name),
      enrollments(
        student:students(full_name)
      ),
      assignments(
        parts:assignment_parts(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as CourseWithRelations;
}

export async function createCourse(course: CourseInsert) {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

export async function updateCourse(id: number, updates: CourseUpdate) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(id: number) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
