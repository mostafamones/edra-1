import { getServiceSupabase } from "@/lib/supabase";
import { StudentField, StudentFieldInsert, StudentFieldUpdate } from "@/lib/types";

const supabase = getServiceSupabase();

export async function getAcademyIdByInstructor(instructorId: string) {
  const { data, error } = await supabase
    .from("academy_memberships")
    .select("academy_id")
    .eq("instructor_id", instructorId)
    .eq("is_active", true)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as any)?.academy_id;
}

export async function getFields(academyId: string) {
  const { data, error } = await supabase
    .from("student_fields")
    .select("*")
    .eq("academy_id", academyId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as StudentField[];
}

export async function createField(field: StudentFieldInsert) {
  const { data, error } = await supabase
    .from("student_fields")
    .insert(field as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StudentField;
}

export async function updateField(id: number, updates: StudentFieldUpdate) {
  const { data, error } = await supabase
    .from("student_fields")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StudentField;
}

export async function deleteField(id: number) {
  const { error } = await supabase
    .from("student_fields")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getStudentFieldValues(studentId: number) {
  const { data, error } = await supabase
    .from("student_field_values")
    .select(`
      *
    `)
    .eq("student_id", studentId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function saveStudentFieldValues(
  academy_id: string,
  student_id: number,
  values: { field_id: number; value: any; field_type: string }[]
) {
  if (values.length === 0) return;

  const upsertData = values.map((v) => {
    const row: any = {
      academy_id,
      student_id,
      field_id: v.field_id,
      value: v.value !== null && v.value !== undefined ? String(v.value) : null,
    };

    return row;
  });

  const { error } = await supabase
    .from("student_field_values")
    .upsert(upsertData as any, { onConflict: "student_id, field_id" });

  if (error) {
    throw new Error(error.message);
  }
}
