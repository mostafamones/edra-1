export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_memberships: {
        Row: {
          academy_id: string
          id: string
          instructor_id: string
          is_active: boolean | null
          joined_at: string | null
          role: string
        }
        Insert: {
          academy_id: string
          id?: string
          instructor_id: string
          is_active?: boolean | null
          joined_at?: string | null
          role: string
        }
        Update: {
          academy_id?: string
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_context"
            referencedColumns: ["instructor_id"]
          },
        ]
      }
      assignment_parts: {
        Row: {
          academy_id: string
          assignment_id: number
          id: number
          max_mark: number
          order_index: number | null
          title: string | null
        }
        Insert: {
          academy_id: string
          assignment_id: number
          id?: never
          max_mark: number
          order_index?: number | null
          title?: string | null
        }
        Update: {
          academy_id?: string
          assignment_id?: number
          id?: never
          max_mark?: number
          order_index?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_parts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_parts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_parts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "v_assignment_grades"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "assignment_parts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["assignment_id"]
          },
        ]
      }
      assignments: {
        Row: {
          academy_id: string
          course_id: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          group_id: number | null
          id: number
          level_id: number | null
          title: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          academy_id: string
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          group_id?: number | null
          id?: never
          level_id?: number | null
          title: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          academy_id?: string
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          group_id?: number | null
          id?: never
          level_id?: number | null
          title?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_portal_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_instructor_context"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          academy_id: string
          checkin_time: string | null
          note: string | null
          session_id: number
          status: string
          student_id: number
        }
        Insert: {
          academy_id: string
          checkin_time?: string | null
          note?: string | null
          session_id: number
          status?: string
          student_id: number
        }
        Update: {
          academy_id?: string
          checkin_time?: string | null
          note?: string | null
          session_id?: number
          status?: string
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_attendance_sheet"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_assignment_grades"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_session_attendance_sheet"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_attendance_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          academy_id: string
          auto_assign: boolean
          course_id: number | null
          created_at: string | null
          created_by: string | null
          group_id: number | null
          id: number
          is_active: boolean
          level_id: number | null
          name: string
          one_off_date: string | null
          schedule_group_id: number | null
          schedule_type: string
          show_on_form: boolean
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          auto_assign?: boolean
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          group_id?: number | null
          id?: never
          is_active?: boolean
          level_id?: number | null
          name: string
          one_off_date?: string | null
          schedule_group_id?: number | null
          schedule_type?: string
          show_on_form?: boolean
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          auto_assign?: boolean
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          group_id?: number | null
          id?: never
          is_active?: boolean
          level_id?: number | null
          name?: string
          one_off_date?: string | null
          schedule_group_id?: number | null
          schedule_type?: string
          show_on_form?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_portal_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "class_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_instructor_context"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "class_schedules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_schedule_group_id_fkey"
            columns: ["schedule_group_id"]
            isOneToOne: false
            referencedRelation: "schedule_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academy_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          group_id: number | null
          id: number
          level_id: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: number | null
          id?: never
          level_id?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: number | null
          id?: never
          level_id?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_instructor_context"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "courses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academy_id: string
          completed_at: string | null
          course_id: number
          enrolled_at: string | null
          id: number
          status: string
          student_id: number
        }
        Insert: {
          academy_id: string
          completed_at?: string | null
          course_id: number
          enrolled_at?: string | null
          id?: never
          status?: string
          student_id: number
        }
        Update: {
          academy_id?: string
          completed_at?: string | null
          course_id?: number
          enrolled_at?: string | null
          id?: never
          status?: string
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_portal_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_assignment_grades"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_session_attendance_sheet"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_attendance_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      groups: {
        Row: {
          academy_id: string
          created_at: string | null
          id: number
          is_active: boolean | null
          level_id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          level_id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          level_id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_invites: {
        Row: {
          academy_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          status: string
          token: string
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_invites_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_instructor_context"
            referencedColumns: ["instructor_id"]
          },
        ]
      }
      instructors: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          original_avatar_path: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          original_avatar_path?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          original_avatar_path?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          academy_id: string
          color: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          color?: string | null
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          color?: string | null
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_enrollments: {
        Row: {
          academy_id: string
          enrolled_at: string | null
          enrollment_type: string
          id: number
          schedule_id: number
          student_id: number
        }
        Insert: {
          academy_id: string
          enrolled_at?: string | null
          enrollment_type?: string
          id?: never
          schedule_id: number
          student_id: number
        }
        Update: {
          academy_id?: string
          enrolled_at?: string | null
          enrollment_type?: string
          id?: never
          schedule_id?: number
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_enrollments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_enrollments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_assignment_grades"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedule_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedule_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedule_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_session_attendance_sheet"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedule_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_attendance_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      schedule_groups: {
        Row: {
          academy_id: string
          created_at: string | null
          group_id: number | null
          id: number
          level_id: number | null
          min_attendance: number
          name: string
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          group_id?: number | null
          id?: never
          level_id?: number | null
          min_attendance?: number
          name: string
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          group_id?: number | null
          id?: never
          level_id?: number | null
          min_attendance?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_groups_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_groups_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_time_slots: {
        Row: {
          academy_id: string
          created_at: string | null
          day_of_week: number | null
          end_time: string | null
          id: number
          instance_date: string | null
          schedule_id: number
          start_time: string
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: never
          instance_date?: string | null
          schedule_id: number
          start_time: string
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: never
          instance_date?: string | null
          schedule_id?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_time_slots_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_time_slots_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          academy_id: string
          created_at: string | null
          ended_at: string | null
          id: number
          is_cancelled: boolean | null
          name: string | null
          schedule_id: number
          session_date: string
          status: string
          time_slot_id: number | null
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          ended_at?: string | null
          id?: never
          is_cancelled?: boolean | null
          name?: string | null
          schedule_id: number
          session_date: string
          status?: string
          time_slot_id?: number | null
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          ended_at?: string | null
          id?: never
          is_cancelled?: boolean | null
          name?: string | null
          schedule_id?: number
          session_date?: string
          status?: string
          time_slot_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "schedule_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      student_field_values: {
        Row: {
          academy_id: string
          field_id: number
          student_id: number
          value: Json | null
        }
        Insert: {
          academy_id: string
          field_id: number
          student_id: number
          value?: Json | null
        }
        Update: {
          academy_id?: string
          field_id?: number
          student_id?: number
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "student_field_values_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "student_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_field_values_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_field_values_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_assignment_grades"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_field_values_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_field_values_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_field_values_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_session_attendance_sheet"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_field_values_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_attendance_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_fields: {
        Row: {
          academy_id: string
          created_at: string | null
          default_country_code: string | null
          field_type: string
          id: number
          is_active: boolean | null
          is_required: boolean | null
          name: string
          options: Json | null
          order_index: number | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          default_country_code?: string | null
          field_type: string
          id?: never
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          options?: Json | null
          order_index?: number | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          default_country_code?: string | null
          field_type?: string
          id?: never
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          options?: Json | null
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fields_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      student_part_marks: {
        Row: {
          academy_id: string
          excused_marks: number | null
          mark: number | null
          note: string | null
          part_id: number
          student_id: number
        }
        Insert: {
          academy_id: string
          excused_marks?: number | null
          mark?: number | null
          note?: string | null
          part_id: number
          student_id: number
        }
        Update: {
          academy_id?: string
          excused_marks?: number | null
          mark?: number | null
          note?: string | null
          part_id?: number
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_part_marks_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_part_marks_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "assignment_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_part_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_part_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_assignment_grades"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_part_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_part_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_part_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_session_attendance_sheet"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_part_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_attendance_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_portal_invites: {
        Row: {
          academy_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          status: string
          student_id: number
          token: string
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          status?: string
          student_id: number
          token?: string
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          status?: string
          student_id?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_portal_invites_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_portal_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_portal_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_instructor_context"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "student_portal_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_portal_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_assignment_grades"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_portal_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_portal_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_course_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_portal_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_session_attendance_sheet"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_portal_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_attendance_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      students: {
        Row: {
          academy_id: string
          created_at: string | null
          full_name: string
          group_id: number | null
          id: number
          is_archived: boolean | null
          level_id: number
          org_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          full_name: string
          group_id?: number | null
          id?: never
          is_archived?: boolean | null
          level_id: number
          org_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          full_name?: string
          group_id?: number | null
          id?: never
          is_archived?: boolean | null
          level_id?: number
          org_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_seen_at: string | null
          phone: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          phone?: string | null
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_assignment_grades: {
        Row: {
          academy_id: string | null
          assignment_id: number | null
          assignment_title: string | null
          course_id: number | null
          earned_marks: number | null
          percentage: number | null
          possible_marks: number | null
          student_id: number | null
          student_name: string | null
          weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_portal_overview"
            referencedColumns: ["course_id"]
          },
        ]
      }
      v_course_grade_book: {
        Row: {
          academy_id: string | null
          assignment_id: number | null
          assignment_title: string | null
          course_id: number | null
          course_title: string | null
          earned_marks: number | null
          percentage: number | null
          possible_marks: number | null
          student_id: number | null
          student_name: string | null
          weight: number | null
          weighted_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_course_students: {
        Row: {
          academy_id: string | null
          course_id: number | null
          course_title: string | null
          enrolled_at: string | null
          enrollment_id: number | null
          enrollment_status: string | null
          group_name: string | null
          is_archived: boolean | null
          level_color: string | null
          level_name: string | null
          org_id: string | null
          student_id: number | null
          student_name: string | null
          student_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_portal_overview"
            referencedColumns: ["course_id"]
          },
        ]
      }
      v_instructor_context: {
        Row: {
          academy_id: string | null
          academy_name: string | null
          avatar_url: string | null
          full_name: string | null
          instructor_id: string | null
          is_active: boolean | null
          joined_at: string | null
          phone: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_session_attendance_sheet: {
        Row: {
          academy_id: string | null
          attendance_note: string | null
          attendance_status: string | null
          checkin_time: string | null
          course_id: number | null
          group_name: string | null
          level_name: string | null
          schedule_id: number | null
          schedule_name: string | null
          session_date: string | null
          session_id: number | null
          session_status: string | null
          student_id: number | null
          student_name: string | null
          student_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_portal_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_attendance_summary: {
        Row: {
          absent_count: number | null
          academy_id: string | null
          attendance_rate: number | null
          course_id: number | null
          excused_count: number | null
          late_count: number | null
          present_count: number | null
          student_id: number | null
          student_name: string | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_course_grade_book"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_portal_overview"
            referencedColumns: ["course_id"]
          },
        ]
      }
      v_student_portal_overview: {
        Row: {
          academy_id: string | null
          academy_name: string | null
          attendance_rate: number | null
          course_id: number | null
          course_title: string | null
          description: string | null
          enrolled_at: string | null
          enrollment_id: number | null
          enrollment_status: string | null
          group_name: string | null
          level_color: string | null
          level_name: string | null
          next_session_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_academy_member: { Args: { p_academy_id: string }; Returns: boolean }
      is_academy_role: {
        Args: { p_academy_id: string; p_roles: string[] }
        Returns: boolean
      }
      is_own_student_row: { Args: { p_student_id: number }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
