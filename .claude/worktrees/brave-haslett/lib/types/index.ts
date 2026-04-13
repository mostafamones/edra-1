// Convenient type exports for optimized database schema
import type { Database } from './database';

// ============================================
// TABLE ROW TYPES (SELECT queries)
// ============================================

export type Academy = Database['public']['Tables']['academies']['Row'];
export type AcademyMembership = Database['public']['Tables']['academy_memberships']['Row'];
export type Instructor = Database['public']['Tables']['instructors']['Row'];
export type Level = Database['public']['Tables']['levels']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type Schedule = Database['public']['Tables']['class_schedules']['Row'];
export type ScheduleGroup = Database['public']['Tables']['schedule_groups']['Row'];
export type ScheduleTimeSlot = Database['public']['Tables']['schedule_time_slots']['Row'];
export type ScheduleEnrollment = Database['public']['Tables']['schedule_enrollments']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type AssignmentPart = Database['public']['Tables']['assignment_parts']['Row'];
export type StudentPartMark = Database['public']['Tables']['student_part_marks']['Row'];
export type StudentField = Database['public']['Tables']['student_fields']['Row'];
export type StudentFieldValue = Database['public']['Tables']['student_field_values']['Row'];
export type InstructorInvite = Database['public']['Tables']['instructor_invites']['Row'];
export type StudentPortalInvite = Database['public']['Tables']['student_portal_invites']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

// ============================================
// INSERT TYPES (CREATE operations)
// ============================================

export type AcademyInsert = Database['public']['Tables']['academies']['Insert'];
export type AcademyMembershipInsert = Database['public']['Tables']['academy_memberships']['Insert'];
export type InstructorInsert = Database['public']['Tables']['instructors']['Insert'];
export type LevelInsert = Database['public']['Tables']['levels']['Insert'];
export type GroupInsert = Database['public']['Tables']['groups']['Insert'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];
export type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert'];
export type ScheduleInsert = Database['public']['Tables']['class_schedules']['Insert'];
export type ScheduleGroupInsert = Database['public']['Tables']['schedule_groups']['Insert'];
export type ScheduleTimeSlotInsert = Database['public']['Tables']['schedule_time_slots']['Insert'];
export type ScheduleEnrollmentInsert = Database['public']['Tables']['schedule_enrollments']['Insert'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type AssignmentPartInsert = Database['public']['Tables']['assignment_parts']['Insert'];
export type StudentPartMarkInsert = Database['public']['Tables']['student_part_marks']['Insert'];
export type StudentFieldInsert = Database['public']['Tables']['student_fields']['Insert'];
export type StudentFieldValueInsert = Database['public']['Tables']['student_field_values']['Insert'];
export type InstructorInviteInsert = Database['public']['Tables']['instructor_invites']['Insert'];
export type StudentPortalInviteInsert = Database['public']['Tables']['student_portal_invites']['Insert'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];

// ============================================
// UPDATE TYPES (UPDATE operations)
// ============================================

export type AcademyUpdate = Database['public']['Tables']['academies']['Update'];
export type AcademyMembershipUpdate = Database['public']['Tables']['academy_memberships']['Update'];
export type InstructorUpdate = Database['public']['Tables']['instructors']['Update'];
export type LevelUpdate = Database['public']['Tables']['levels']['Update'];
export type GroupUpdate = Database['public']['Tables']['groups']['Update'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];
export type EnrollmentUpdate = Database['public']['Tables']['enrollments']['Update'];
export type ScheduleUpdate = Database['public']['Tables']['class_schedules']['Update'];
export type ScheduleGroupUpdate = Database['public']['Tables']['schedule_groups']['Update'];
export type ScheduleTimeSlotUpdate = Database['public']['Tables']['schedule_time_slots']['Update'];
export type ScheduleEnrollmentUpdate = Database['public']['Tables']['schedule_enrollments']['Update'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];
export type AssignmentPartUpdate = Database['public']['Tables']['assignment_parts']['Update'];
export type StudentPartMarkUpdate = Database['public']['Tables']['student_part_marks']['Update'];
export type StudentFieldUpdate = Database['public']['Tables']['student_fields']['Update'];
export type StudentFieldValueUpdate = Database['public']['Tables']['student_field_values']['Update'];
export type InstructorInviteUpdate = Database['public']['Tables']['instructor_invites']['Update'];
export type StudentPortalInviteUpdate = Database['public']['Tables']['student_portal_invites']['Update'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// ============================================
// VIEW TYPES (Utility views)
// ============================================

export type AssignmentGrades = Database['public']['Views']['v_assignment_grades']['Row'];
export type CourseGradeBook = Database['public']['Views']['v_course_grade_book']['Row'];
export type CourseStudents = Database['public']['Views']['v_course_students']['Row'];
export type InstructorContext = Database['public']['Views']['v_instructor_context']['Row'];
export type SessionAttendanceSheet = Database['public']['Views']['v_session_attendance_sheet']['Row'];
export type StudentAttendanceSummary = Database['public']['Views']['v_student_attendance_summary']['Row'];
export type StudentPortalOverview = Database['public']['Views']['v_student_portal_overview']['Row'];

// ============================================
// ENUM TYPES (for type safety)
// ============================================

export const InstructorRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
} as const;

export const UserRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

export const StudentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
} as const;

export const EnrollmentStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
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

export const CourseStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const SessionStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const InviteStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
} as const;

// Type helpers
export type InstructorRoleType = typeof InstructorRole[keyof typeof InstructorRole];
export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type StudentStatusType = typeof StudentStatus[keyof typeof StudentStatus];
export type EnrollmentStatusType = typeof EnrollmentStatus[keyof typeof EnrollmentStatus];
export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];
export type ScheduleTypeType = typeof ScheduleType[keyof typeof ScheduleType];
export type EnrollmentTypeType = typeof EnrollmentType[keyof typeof EnrollmentType];
export type DayOfWeekType = typeof DayOfWeek[keyof typeof DayOfWeek];
export type CourseStatusType = typeof CourseStatus[keyof typeof CourseStatus];
export type SessionStatusType = typeof SessionStatus[keyof typeof SessionStatus];
export type InviteStatusType = typeof InviteStatus[keyof typeof InviteStatus];

// ============================================
// EXTENDED TYPES (with relationships)
// ============================================

export type StudentWithLevel = Student & {
  level: Level | null;
  group?: Group | null;
  schedule_enrollments?: {
    schedule: Schedule | null;
  }[] | null;
  student_field_values?: StudentFieldValue[] | null;
  enrollments?: {
    course: Course | null;
  }[] | null;
};

export type StudentWithLevelRating = Student & {
  level: Level | null;
  group: Group | null;
  schedule_enrollments?: {
    schedule: Schedule | null;
  }[] | null;
  student_field_values?: StudentFieldValue[] | null;
};

export type SessionWithSchedule = Session & {
  schedule: Schedule & {
    level: Level | null;
    group: Group | null;
    time_slots: ScheduleTimeSlot[];
    course?: Course | null;
  };
};

export type ScheduleWithRelations = Schedule & {
  level: Level | null;
  group: Group | null;
  schedule_group: ScheduleGroup | null;
  time_slots: ScheduleTimeSlot[];
  course?: Course | null;
  schedule_enrollments?: { count: number }[];
};

export type AttendanceWithStudent = Attendance & {
  student: Student & {
    schedule_enrollments?: ScheduleEnrollment[];
    enrollments?: Enrollment[];
  };
  session: Session | null;
};

export type AssignmentWithParts = Assignment & {
  parts: AssignmentPart[];
  course?: Course | null;
  level?: Level | null;
  group?: Group | null;
};

export type CourseWithRelations = Course & {
  level: Level | null;
  group: Group | null;
  enrollments?: {
    student: Student;
  }[];
  assignments?: Assignment[];
  sessions?: Session[];
};

export type InstructorWithContext = Instructor & {
  academy_memberships?: AcademyMembership[];
  user?: User | null;
};

export type AcademyMembershipWithInstructor = AcademyMembership & {
  instructor: Instructor;
};

export type EnrollmentWithStudent = Enrollment & {
  student: Student & {
    level: Level | null;
    group: Group | null;
  };
  course: Course;
};

// ============================================
// UTILITY TYPES
// ============================================

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};
