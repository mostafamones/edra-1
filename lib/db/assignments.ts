import { getServiceSupabase } from '../supabase';
import { Assignment, AssignmentInsert, AssignmentUpdate, AssignmentPartInsert, StudentPartMarkInsert, AssignmentWithParts } from '../types';

const supabase: any = getServiceSupabase();

export async function getAssignments(academyId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Assignment[];
}

export async function getAssignment(id: number) {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      parts:assignment_parts(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  // Sort parts by order_index manually if needed, or rely on DB order if specified
  if (data?.parts) {
    data.parts.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
  }
  return data as AssignmentWithParts;
}

export async function createAssignment(assignment: AssignmentInsert, parts: AssignmentPartInsert[] = []) {
  // Use a transaction or sequential operations
  // Since supabase-js doesn't expose raw transactions easily, we do it sequentially.
  // If part creation fails, we might have an orphan assignment. 
  // RLS or triggers might help, but for now standard logic.

  const { data: newAssignment, error: assignError } = await supabase
    .from('assignments')
    .insert(assignment)
    .select()
    .single();

  if (assignError) throw assignError;

  if (parts.length > 0) {
    const partsWithId = parts.map(p => ({ ...p, assignment_id: newAssignment.id }));
    const { error: partsError } = await supabase
      .from('assignment_parts')
      .insert(partsWithId);

    if (partsError) {
      // Cleanup? Or just throw.
      console.error('Failed to create assignment parts', partsError);
      // We could try to delete the assignment here to rollback
      await supabase.from('assignments').delete().eq('id', newAssignment.id);
      throw partsError;
    }
  }

  return getAssignment(newAssignment.id);
}

export async function updateAssignment(id: number, updates: AssignmentUpdate) {
  const { data, error } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Assignment;
}

export async function deleteAssignment(id: number) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Assignment Parts

export async function addAssignmentPart(part: AssignmentPartInsert) {
  const { data, error } = await supabase
    .from('assignment_parts')
    .insert(part)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAssignmentPart(id: number) {
  const { error } = await supabase
    .from('assignment_parts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Grading

export async function gradeStudentPart(mark: StudentPartMarkInsert) {
  const { data, error } = await supabase
    .from('student_part_marks')
    .upsert(mark)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStudentMarksForAssignment(assignmentId: number) {
  const { data: parts, error: partsError } = await supabase.from('assignment_parts').select('id').eq('assignment_id', assignmentId);

  if (partsError) throw partsError;
  const partIds = parts?.map((p: any) => p.id) || [];

  if (partIds.length === 0) return [];

  const { data, error } = await supabase
    .from('student_part_marks')
    .select(`
      *,
      student:students(id, full_name),
      part:assignment_parts(id, title, max_mark)
    `)
    .in('part_id', partIds);

  if (error) throw error;
  return data;
}

export async function getAssignmentStats(assignmentId: number) {
  const { data, error } = await supabase
    .from('student_assignment_totals')
    .select('*')
    .eq('assignment_id', assignmentId);

  if (error) throw error;
  return data;
}
