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
    PostgrestVersion: "14.1"
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
          id: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      assignment_parts: {
        Row: {
          academy_id: string | null
          assignment_id: number
          id: number
          max_mark: number
          order_index: number | null
          title: string | null
        }
        Insert: {
          academy_id?: string | null
          assignment_id: number
          id?: number
          max_mark: number
          order_index?: number | null
          title?: string | null
        }
        Update: {
          academy_id?: string | null
          assignment_id?: number
          id?: number
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
            referencedRelation: "student_assignment_totals"
            referencedColumns: ["assignment_id"]
          },
        ]
      }
      assignments: {
        Row: {
          academy_id: string
          branch_id: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: number
          level_id: number | null
          title: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          academy_id: string
          branch_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          level_id?: number | null
          title: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          academy_id?: string
          branch_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
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
            foreignKeyName: "assignments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
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
            foreignKeyName: "attendance_academy_fk"
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
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          academy_id: string
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          academy_id: string
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          academy_id?: string
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      branches: {
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
          id?: number
          is_active?: boolean | null
          level_id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          level_id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          academy_id: string
          branch_id: number | null
          created_at: string | null
          created_by: string | null
          id: number
          is_active: boolean
          is_mandatory: boolean
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
          branch_id?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_active?: boolean
          is_mandatory?: boolean
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
          branch_id?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_active?: boolean
          is_mandatory?: boolean
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
            foreignKeyName: "class_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
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
      instructor_invites: {
        Row: {
          academy_id: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          status: string
          token: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by: string
          status?: string
          token?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
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
        ]
      }
      instructors: {
        Row: {
          academy_id: string
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          original_avatar_path: string | null
          phone: string | null
          role: string
        }
        Insert: {
          academy_id: string
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          original_avatar_path?: string | null
          phone?: string | null
          role: string
        }
        Update: {
          academy_id?: string
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          original_avatar_path?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructors_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
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
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          color?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          color?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
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
      schedule_groups: {
        Row: {
          academy_id: string
          branch_id: number | null
          created_at: string | null
          id: number
          level_id: number | null
          min_attendance: number
          name: string
        }
        Insert: {
          academy_id: string
          branch_id?: number | null
          created_at?: string | null
          id?: number
          level_id?: number | null
          min_attendance?: number
          name: string
        }
        Update: {
          academy_id?: string
          branch_id?: number | null
          created_at?: string | null
          id?: number
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
            foreignKeyName: "schedule_groups_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
          id?: number
          instance_date?: string | null
          schedule_id: number
          start_time: string
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: number
          instance_date?: string | null
          schedule_id?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_time_slots_academy_fk"
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
          {
            foreignKeyName: "schedule_time_slots_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule_full"
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
          id?: number
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
          id?: number
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
            foreignKeyName: "sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule_full"
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
            foreignKeyName: "student_field_values_academy_fk"
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
          options: string[] | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          default_country_code?: string | null
          field_type: string
          id?: number
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          options?: string[] | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          default_country_code?: string | null
          field_type?: string
          id?: number
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          options?: string[] | null
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
            foreignKeyName: "student_part_marks_academy_fk"
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
        ]
      }
      student_schedules: {
        Row: {
          academy_id: string
          enrolled_at: string | null
          enrollment_type: string
          schedule_id: number
          student_id: number
        }
        Insert: {
          academy_id: string
          enrolled_at?: string | null
          enrollment_type?: string
          schedule_id: number
          student_id: number
        }
        Update: {
          academy_id?: string
          enrolled_at?: string | null
          enrollment_type?: string
          schedule_id?: number
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_schedules_academy_fk"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academy_id: string
          branch_id: number | null
          created_at: string | null
          full_name: string
          id: number
          is_archived: boolean | null
          level_id: number
          org_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          branch_id?: number | null
          created_at?: string | null
          full_name: string
          id?: number
          is_archived?: boolean | null
          level_id: number
          org_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          branch_id?: number | null
          created_at?: string | null
          full_name?: string
          id?: number
          is_archived?: boolean | null
          level_id?: number
          org_id?: string | null
          status?: string
          updated_at?: string | null
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
            foreignKeyName: "students_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      schedule_full: {
        Row: {
          academy_id: string | null
          branch_id: number | null
          branch_name: string | null
          created_at: string | null
          created_by: string | null
          group_min_attendance: number | null
          group_name: string | null
          id: number | null
          is_mandatory: boolean | null
          level_id: number | null
          level_name: string | null
          name: string | null
          one_off_date: string | null
          schedule_group_id: number | null
          schedule_type: string | null
          show_on_form: boolean | null
          student_count: number | null
          time_slots: Json | null
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
            foreignKeyName: "class_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
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
      schedule_student_counts: {
        Row: {
          schedule_id: number | null
          student_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_schedules_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule_full"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assignment_totals: {
        Row: {
          adjusted_max_mark: number | null
          assignment_id: number | null
          percentage: number | null
          student_id: number | null
          total_mark: number | null
          total_max_mark: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_part_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance_summary: {
        Row: {
          absent_count: number | null
          academy_id: string | null
          excused_count: number | null
          late_count: number | null
          present_count: number | null
          student_id: number | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_academy: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      get_my_academy: { Args: never; Returns: Json }
      is_admin_or_owner: { Args: never; Returns: boolean }
      is_instructor_or_above: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
