export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          school_id: string | null
          role: 'student' | 'teacher' | 'head_teacher'
          full_name: string | null
          email: string | null
          grade: string | null
          subjects: string[] | null
          created_at: string
        }
        Insert: {
          id: string
          school_id?: string | null
          role: 'student' | 'teacher' | 'head_teacher'
          full_name?: string | null
          email?: string | null
          grade?: string | null
          subjects?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          role?: 'student' | 'teacher' | 'head_teacher'
          full_name?: string | null
          email?: string | null
          grade?: string | null
          subjects?: string[] | null
          created_at?: string
        }
      }
      classrooms: {
        Row: {
          id: string
          school_id: string
          name: string
          teacher_id: string | null
          subject: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          teacher_id?: string | null
          subject?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          teacher_id?: string | null
          subject?: string | null
          created_at?: string
        }
      }
      progress: {
        Row: {
          id: string
          student_id: string
          classroom_id: string
          school_id: string
          subject: string
          score: number
          max_score: number
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          classroom_id: string
          school_id: string
          subject: string
          score: number
          max_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          classroom_id?: string
          school_id?: string
          subject?: string
          score?: number
          max_score?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type UserRole = 'student' | 'teacher' | 'head_teacher'
export type Profile = Database['public']['Tables']['profiles']['Row']
export type School = Database['public']['Tables']['schools']['Row']
export type Classroom = Database['public']['Tables']['classrooms']['Row']
export type Progress = Database['public']['Tables']['progress']['Row']