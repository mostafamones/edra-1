// Convenient type exports for the optimized database schema
import type { Database } from './database';

// ============================================
// TABLE ROW TYPES (SELECT queries)
// ============================================

export type Academy = Database['public']['Tables']['academies']['Row'];
export type Instructor = Database['public']['Tables']['instructors']['Row'];
export type Level = Database['public']['Tables']['levels']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Schedule = Database['public']['Tables']['class_schedules']['Row'];
export type ScheduleGroup = Database['public']['Tables']['schedule_groups']['Row'];
export type ScheduleTimeSlot = Database['public']['Tables']['schedule_time_slots']['Row'];
export type StudentSchedule = Database['public']['Tables']['student_schedules']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type AssignmentPart = Database['public']['Tables']['assignment_parts']['Row'];
export type StudentPartMark = Database['public']['Tables']['student_part_marks']['Row'];
export type StudentField = Database['public']['Tables']['student_fields']['Row'];
export type StudentFieldValue = Database['public']['Tables']['student_field_values']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

// ============================================
// INSERT TYPES (CREATE operations)
// ============================================

export type AcademyInsert = Database['public']['Tables']['academies']['Insert'];
export type InstructorInsert = Database['public']['Tables']['instructors']['Insert'];
export type LevelInsert = Database['public']['Tables']['levels']['Insert'];
export type BranchInsert = Database['public']['Tables']['branches']['Insert'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type ScheduleInsert = Database['public']['Tables']['class_schedules']['Insert'];
export type ScheduleGroupInsert = Database['public']['Tables']['schedule_groups']['Insert'];
export type ScheduleTimeSlotInsert = Database['public']['Tables']['schedule_time_slots']['Insert'];
export type StudentScheduleInsert = Database['public']['Tables']['student_schedules']['Insert'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type AssignmentPartInsert = Database['public']['Tables']['assignment_parts']['Insert'];
export type StudentPartMarkInsert = Database['public']['Tables']['student_part_marks']['Insert'];
export type StudentFieldInsert = Database['public']['Tables']['student_fields']['Insert'];
export type StudentFieldValueInsert = Database['public']['Tables']['student_field_values']['Insert'];

// ============================================
// UPDATE TYPES (UPDATE operations)
// ============================================

export type AcademyUpdate = Database['public']['Tables']['academies']['Update'];
export type InstructorUpdate = Database['public']['Tables']['instructors']['Update'];
export type LevelUpdate = Database['public']['Tables']['levels']['Update'];
export type BranchUpdate = Database['public']['Tables']['branches']['Update'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
export type ScheduleUpdate = Database['public']['Tables']['class_schedules']['Update'];
export type ScheduleGroupUpdate = Database['public']['Tables']['schedule_groups']['Update'];
export type ScheduleTimeSlotUpdate = Database['public']['Tables']['schedule_time_slots']['Update'];
export type StudentScheduleUpdate = Database['public']['Tables']['student_schedules']['Update'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];
export type AssignmentPartUpdate = Database['public']['Tables']['assignment_parts']['Update'];
export type StudentPartMarkUpdate = Database['public']['Tables']['student_part_marks']['Update'];
export type StudentFieldUpdate = Database['public']['Tables']['student_fields']['Update'];
export type StudentFieldValueUpdate = Database['public']['Tables']['student_field_values']['Update'];

// ============================================
// VIEW TYPES (Utility views)
// ============================================

export type StudentAssignmentTotal = Database['public']['Views']['student_assignment_totals']['Row'];
export type StudentAttendanceSummary = Database['public']['Views']['student_attendance_summary']['Row'];
export type ScheduleStudentCount = Database['public']['Views']['schedule_student_counts']['Row'];

// ============================================
// ENUM TYPES (for type safety)
// ============================================

export const InstructorRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
} as const;

export const StudentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
} as const;

export const AttendanceStatus = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
  EXCUSED: 'excused',
} as const;

export const ScheduleType = {
  RECURRING: 'recurring',
  ONE_OFF: 'one_off',
} as const;

export const EnrollmentType = {
  MANUAL: 'manual',
  AUTO: 'auto',
  FORM: 'form',
} as const;

export const DayOfWeek = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

// Type helpers
export type InstructorRoleType = typeof InstructorRole[keyof typeof InstructorRole];
export type StudentStatusType = typeof StudentStatus[keyof typeof StudentStatus];
export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];
export type DayOfWeekType = typeof DayOfWeek[keyof typeof DayOfWeek];
export type ScheduleTypeType = typeof ScheduleType[keyof typeof ScheduleType];
export type EnrollmentTypeType = typeof EnrollmentType[keyof typeof EnrollmentType];

// ============================================
// EXTENDED TYPES (with relationships)
// ============================================

export type StudentWithLevelRating = Student & {
  level: Level | null;
  branch?: Branch | null;
  student_schedules?: {
    schedule: Schedule | null;
  }[] | null;
  student_field_values?: StudentFieldValue[] | null;
};

export type SessionWithSchedule = Session & {
  schedule: Schedule & {
    level: Level | null;
    branch: Branch | null;
    time_slots: ScheduleTimeSlot[];
  };
};

export type ScheduleWithRelations = Schedule & {
  level: Level | null;
  branch: Branch | null;
  schedule_group: ScheduleGroup | null;
  time_slots: ScheduleTimeSlot[];
  student_schedules?: { count: number }[];
};

export type AttendanceWithStudent = Attendance & {
  student: Student & {
    student_schedules?: StudentSchedule[];
  };
};

export type AssignmentWithParts = Assignment & {
  parts: AssignmentPart[];
};

// ============================================
// UTILITY TYPES
// ============================================

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};
