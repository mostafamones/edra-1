/**
 * Shared Zod schemas used by both client forms and server-side route handlers.
 *
 * - Forms import these to build `zodResolver(schema)` and to derive their payload types
 *   via `z.infer<typeof X>`.
 * - API route handlers import these and run `validateBody(request, schema)` from
 *   `@/lib/api/validation` to reject malformed input at the edge.
 *
 * Any schema added here should be the single source of truth — do not redefine a
 * matching schema inside a component or route.
 */
import { z } from "zod";

/** A numeric primary key from the database (students.id, sessions.id, …). */
export const numericIdSchema = z
  .union([z.number(), z.string()])
  .transform((v, ctx) => {
    const n = typeof v === "number" ? v : parseInt(v, 10);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid id" });
      return z.NEVER;
    }
    return n;
  });

/** Academy UUID — every write should scope to an academy. */
export const academyIdSchema = z
  .string()
  .min(1, "academyId is required");

// ─── Students ─────────────────────────────────────────────────────

export const studentFieldValueSchema = z.object({
  field_id: z.number().int(),
  field_type: z.string(),
  value: z.string(),
});

export const createStudentSchema = z.object({
  academy_id: academyIdSchema,
  full_name: z.string().min(1, "Full name is required").max(200),
  level_id: z.number().int().nullable().optional(),
  group_id: z.number().int().nullable().optional(),
  schedule_id: z.number().int().nullable().optional(),
  status: z.enum(["active", "archived", "inactive"]).optional(),
  fieldValues: z.array(studentFieldValueSchema).optional(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  fieldValues: z.array(studentFieldValueSchema).optional(),
});

export const bulkStudentsSchema = z.object({
  academyId: academyIdSchema,
  defaultLevelId: z.union([z.number(), z.string()]).nullable().optional(),
  defaultGroupId: z.union([z.number(), z.string()]).nullable().optional(),
  scheduleIds: z.array(z.number().int()).optional(),
  students: z
    .array(
      z
        .object({
          full_name: z.string().optional(),
          level_id: z.union([z.number(), z.string()]).nullable().optional(),
          group_id: z.union([z.number(), z.string()]).nullable().optional(),
          schedule_id: z.number().int().nullable().optional(),
          fieldValues: z.array(studentFieldValueSchema).optional(),
        })
        .passthrough()
    )
    .min(1, "At least one student is required"),
});

// ─── Sessions ─────────────────────────────────────────────────────

export const createSessionSchema = z.object({
  academy_id: academyIdSchema,
  schedule_id: z.number().int(),
  session_date: z.string().min(1, "session_date is required"),
  status: z.enum(["live", "ended", "archived"]).optional(),
  name: z.string().nullable().optional(),
});

export const updateSessionSchema = z.object({
  session_date: z.string().optional(),
  schedule_id: z.number().int().optional(),
  status: z.enum(["live", "ended", "archived"]).optional(),
  is_cancelled: z.boolean().optional(),
  name: z.string().nullable().optional(),
  ended_at: z.string().nullable().optional(),
});

export const endSessionSchema = z.object({
  academyId: academyIdSchema,
  migrations: z.array(z.number().int()).optional(),
  notes: z
    .array(z.object({ studentId: z.number().int(), note: z.string().nullable() }))
    .optional(),
});

// ─── Schedules ────────────────────────────────────────────────────

export const scheduleTimeSlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6).nullable(),
  start_time: z.string(),
  end_time: z.string().nullable().optional(),
  instance_date: z.string().nullable().optional(),
});

export const createScheduleSchema = z.object({
  academy_id: academyIdSchema,
  name: z.string().min(1, "Schedule name is required"),
  level_id: z.number().int().nullable().optional(),
  group_id: z.number().int().nullable().optional(),
  schedule_type: z.enum(["recurring", "one_off"]).optional(),
  one_off_date: z.string().nullable().optional(),
  auto_assign: z.boolean().optional(),
  show_on_form: z.boolean().optional(),
  is_mandatory: z.boolean().optional(),
  is_active: z.boolean().optional(),
  time_slots: z.array(scheduleTimeSlotSchema).optional(),
});

export const updateScheduleSchema = createScheduleSchema
  .omit({ academy_id: true })
  .partial()
  .extend({
    time_slots: z.array(scheduleTimeSlotSchema).optional(),
  });

// ─── Fields ───────────────────────────────────────────────────────

export const createFieldSchema = z.object({
  academy_id: academyIdSchema,
  name: z.string().min(1, "Field name is required"),
  field_type: z.enum(["text", "number", "date", "boolean", "phone", "select"]),
  is_required: z.boolean().optional(),
  is_active: z.boolean().optional(),
  options: z.array(z.string()).nullable().optional(),
  order_index: z.number().int().optional(),
});

export const updateFieldSchema = createFieldSchema.partial();

// ─── Levels ───────────────────────────────────────────────────────

export const createLevelSchema = z.object({
  academy_id: academyIdSchema,
  name: z.string().min(1, "Level name is required"),
  color: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const updateLevelSchema = createLevelSchema.partial();

export const reorderLevelsSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1, "orderedIds must be a non-empty array"),
});

// ─── Groups ───────────────────────────────────────────────────────

export const createGroupSchema = z.object({
  academy_id: academyIdSchema,
  level_id: z.number().int(),
  name: z.string().min(1, "Group name is required"),
  is_active: z.boolean().optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

// ─── Enrollments ──────────────────────────────────────────────────

export const createEnrollmentSchema = z.object({
  academy_id: academyIdSchema,
  course_id: z.number().int(),
  student_id: z.number().int(),
  status: z.string().optional(),
});

export const updateEnrollmentSchema = createEnrollmentSchema.partial();

// ─── Assignments ──────────────────────────────────────────────────

export const assignmentPartSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1),
  max_mark: z.number(),
  order_index: z.number().int().nullable().optional(),
});

export const createAssignmentSchema = z.object({
  academy_id: academyIdSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
  due_date: z.string().nullable().optional(),
  level_id: z.number().int().nullable().optional(),
  branch_id: z.number().int().nullable().optional(),
  parts: z.array(assignmentPartSchema).optional(),
});

export const updateAssignmentSchema = z
  .object({
    academy_id: academyIdSchema,
    parts: z.array(assignmentPartSchema).optional(),
  })
  .catchall(z.unknown());

// ─── Student schedule enrollment ──────────────────────────────────

export const studentScheduleEnrollSchema = z.object({
  academyId: academyIdSchema,
  scheduleId: z.number().int().optional(),
  groupId: z.number().int().optional(),
}).refine((d) => d.scheduleId != null || d.groupId != null, {
  message: "scheduleId or groupId is required",
});

export const studentScheduleUnenrollSchema = z.object({
  scheduleId: z.number().int().optional(),
  groupId: z.number().int().optional(),
}).refine((d) => d.scheduleId != null || d.groupId != null, {
  message: "scheduleId or groupId is required",
});

// ─── Invites ──────────────────────────────────────────────────────

export const createInviteSchema = z.object({
  academyId: academyIdSchema,
  email: z.string().email().optional(),
  role: z.enum(["instructor", "admin"]).optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// ─── Attendance ───────────────────────────────────────────────────

export const recordAttendanceSchema = z.object({
  academyId: academyIdSchema,
  hashId: z.string().min(1),
  sessionId: z.union([z.number().int(), z.string()]),
  status: z.string().optional(),
  note: z.string().nullable().optional(),
});

export const updateAttendanceSchema = z.object({
  academyId: academyIdSchema,
  studentId: z.number().int(),
  sessionId: z.union([z.number().int(), z.string()]),
  status: z.string().optional(),
  note: z.string().nullable().optional(),
});

// ─── Type helpers ─────────────────────────────────────────────────

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type CreateLevelInput = z.infer<typeof createLevelSchema>;
export type UpdateLevelInput = z.infer<typeof updateLevelSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
