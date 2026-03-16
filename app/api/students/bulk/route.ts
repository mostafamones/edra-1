import { createStudentsBulk, getStudents } from "@/lib";
import { enrollStudentInSchedule } from "@/lib/db/schedules";
import { getServiceSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const supabase = getServiceSupabase();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { students, academyId, defaultLevelId, defaultBranchId, scheduleIds } = body;

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Students array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Get existing students to check for duplicates
    const existingStudents = await getStudents(academyId);
    const existingNames = new Set(
      existingStudents.map(s => s.full_name.toLowerCase())
    );

    // Process students and validate
    const validStudents: any[] = [];
    const skipped: string[] = [];
    const errors: Array<{ row: number; field: string; message: string }> = [];

    students.forEach((student: any, index: number) => {
      const row = index + 1;

      // Check for duplicates
      const normalizedName = student.full_name?.toLowerCase().trim();
      if (normalizedName && existingNames.has(normalizedName)) {
        skipped.push(student.full_name);
        return;
      }

      // Validate required fields
      if (!student.full_name?.trim()) {
        errors.push({ row, field: 'full_name', message: 'Name is required' });
        return;
      }

      // Use default level if not provided
      const levelId = student.level_id || defaultLevelId;
      if (!levelId) {
        errors.push({ row, field: 'level', message: 'Level is required' });
        return;
      }

      // Validate branch if provided
      if (student.branch_id && typeof student.branch_id !== 'number') {
        try {
          student.branch_id = parseInt(student.branch_id);
        } catch {
          errors.push({ row, field: 'branch', message: 'Invalid branch ID' });
          return;
        }
      }

      // Prepare student for insert
      validStudents.push({
        full_name: student.full_name.trim(),
        level_id: parseInt(String(levelId)),
        branch_id: student.branch_id ? parseInt(String(student.branch_id)) : null,
        schedule_id: student.schedule_id || null,
        email: student.email?.trim() || null,
        status: 'active',
        academy_id: academyId,
        fieldValues: student.fieldValues || []
      });
    });

    // Insert valid students
    let createdStudents: any[] = [];
    if (validStudents.length > 0) {
      createdStudents = await createStudentsBulk(validStudents);

      // Enroll students in schedules
      if (createdStudents.length > 0) {
        // Get mandatory schedules that should be auto-enrolled (along with their target scopes)
        const { data: mandatorySchedules } = await supabase
          .from('class_schedules')
          .select('id, level_id, branch_id')
          .eq('academy_id', academyId)
          .eq('is_mandatory', true)
          .eq('is_active', true);

        // Bulk enroll all students in all selected schedules
        const enrollmentPromises: Promise<void>[] = [];

        for (const student of createdStudents as any[]) {
          // 1. Enroll in the explicitly selected schedule for this row, if any. 
          // Otherwise fall back to the globally selected schedule(s) from the UI dropdown
          if (student.schedule_id) {
            enrollmentPromises.push(
              enrollStudentInSchedule({
                academy_id: academyId,
                student_id: student.id,
                schedule_id: student.schedule_id
              })
            );
          } else if (scheduleIds && scheduleIds.length > 0) {
            for (const scheduleId of scheduleIds) {
              enrollmentPromises.push(
                enrollStudentInSchedule({
                  academy_id: academyId,
                  student_id: student.id,
                  schedule_id: scheduleId
                })
              );
            }
          }

          // 2. Enroll in mandatory schedules ONLY IF they match the student's level and branch
          if (mandatorySchedules && mandatorySchedules.length > 0) {
            for (const schedule of (mandatorySchedules as any[])) {
              // Checks if the schedule is scoped to a different level than the student
              if (schedule.level_id && schedule.level_id !== student.level_id) continue;

              // Checks if the schedule is scoped to a different branch than the student
              if (schedule.branch_id && schedule.branch_id !== student.branch_id) continue;

              // Do not enroll twice if they explicitly selected the mandatory schedule in the UI 
              // globally OR individually
              if (scheduleIds && scheduleIds.includes(schedule.id)) continue;
              if (student.schedule_id === schedule.id) continue;

              enrollmentPromises.push(
                enrollStudentInSchedule({
                  academy_id: academyId,
                  student_id: student.id,
                  schedule_id: schedule.id
                })
              );
            }
          }
        }

        if (enrollmentPromises.length > 0) {
          // Await and log errors
          const results = await Promise.allSettled(enrollmentPromises);
          results.forEach(result => {
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
      errors: errors,
      students: createdStudents
    });

  } catch (error: any) {
    console.error("Error creating students in bulk:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create students" },
      { status: 500 }
    );
  }
}
