import { createStudentsBulk, getStudents } from "@/lib/db/students";
import { enrollStudentInSchedule } from "@/lib/db/schedules";
import { getServiceSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess } from "@/lib/api/guard";
import { errors as apiErrors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { bulkStudentsSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

const supabase = getServiceSupabase();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, bulkStudentsSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academyId);
  if (!auth.ok) return auth.response;

  const academyId = auth.ctx.academyId;
  const { students, defaultLevelId, defaultGroupId, scheduleIds } = parsed.data;

  try {

    // Get existing students to check for duplicates
    const existingStudents = await getStudents(academyId);
    const existingNames = new Set(
      existingStudents.map((s: any) => s.full_name.toLowerCase())
    );

    const validStudents: any[] = [];
    const skipped: string[] = [];
    const errors: Array<{ row: number; field: string; message: string }> = [];

    students.forEach((student: any, index: number) => {
      const row = index + 1;

      const normalizedName = student.full_name?.toLowerCase().trim();
      if (normalizedName && existingNames.has(normalizedName)) {
        skipped.push(student.full_name);
        return;
      }

      if (!student.full_name?.trim()) {
        errors.push({ row, field: 'full_name', message: 'Name is required' });
        return;
      }

      const levelId = student.level_id || defaultLevelId;
      if (!levelId) {
        errors.push({ row, field: 'level', message: 'Level is required' });
        return;
      }

      // Coerce group_id to number if provided
      if (student.group_id && typeof student.group_id !== 'number') {
        const parsed = parseInt(student.group_id);
        if (isNaN(parsed)) {
          errors.push({ row, field: 'group', message: 'Invalid group ID' });
          return;
        }
        student.group_id = parsed;
      }

      validStudents.push({
        full_name: student.full_name.trim(),
        level_id: parseInt(String(levelId)),
        group_id: student.group_id ? parseInt(String(student.group_id)) : (defaultGroupId ? parseInt(String(defaultGroupId)) : null),
        schedule_id: student.schedule_id || null,
        status: 'active',
        academy_id: academyId,
        fieldValues: student.fieldValues || [],
      });
    });

    let createdStudents: any[] = [];
    if (validStudents.length > 0) {
      createdStudents = await createStudentsBulk(validStudents);

      if (createdStudents.length > 0) {
        const { data: mandatorySchedules } = await supabase
          .from('class_schedules')
          .select('id, level_id, group_id')
          .eq('academy_id', academyId)
          .eq('is_mandatory', true)
          .eq('is_active', true);

        const enrollmentPromises: Promise<void>[] = [];

        for (const student of createdStudents as any[]) {
          if (student.schedule_id) {
            enrollmentPromises.push(
              enrollStudentInSchedule({
                academy_id: academyId,
                student_id: student.id,
                schedule_id: student.schedule_id,
              })
            );
          } else if (scheduleIds && scheduleIds.length > 0) {
            for (const scheduleId of scheduleIds) {
              enrollmentPromises.push(
                enrollStudentInSchedule({
                  academy_id: academyId,
                  student_id: student.id,
                  schedule_id: scheduleId,
                })
              );
            }
          }

          if (mandatorySchedules && mandatorySchedules.length > 0) {
            for (const schedule of mandatorySchedules as any[]) {
              if (schedule.level_id && schedule.level_id !== student.level_id) continue;
              if (schedule.group_id && schedule.group_id !== student.group_id) continue;
              if (scheduleIds && scheduleIds.includes(schedule.id)) continue;
              if (student.schedule_id === schedule.id) continue;

              enrollmentPromises.push(
                enrollStudentInSchedule({
                  academy_id: academyId,
                  student_id: student.id,
                  schedule_id: schedule.id,
                })
              );
            }
          }
        }

        if (enrollmentPromises.length > 0) {
          const results = await Promise.allSettled(enrollmentPromises);
          results.forEach((result) => {
            if (result.status === 'rejected') {
              console.error('Failed to enroll student:', result.reason);
            }
          });
        }
      }
    }

    return NextResponse.json({
      created: createdStudents.length,
      skipped: skipped.length,
      skippedNames: skipped,
      errors,
      students: createdStudents,
    });
  } catch (error) {
    console.error("Error creating students in bulk:", error);
    return apiErrors.internal(getErrorMessage(error) || "Failed to create students");
  }
}
