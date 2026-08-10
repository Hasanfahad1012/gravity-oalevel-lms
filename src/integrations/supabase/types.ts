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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          batch: string
          created_at: string
          description: string
          due_date: string | null
          file_name: string
          file_url: string | null
          id: string
          subject_code: string
          teacher_id: string
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          batch?: string
          created_at?: string
          description?: string
          due_date?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          subject_code?: string
          teacher_id: string
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          batch?: string
          created_at?: string
          description?: string
          due_date?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          subject_code?: string
          teacher_id?: string
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          created_at: string
          fee_amount: number
          id: string
          progress: number
          student_id: string
          subject_code: string
          term_fee_paid: boolean
        }
        Insert: {
          created_at?: string
          fee_amount?: number
          id?: string
          progress?: number
          student_id: string
          subject_code: string
          term_fee_paid?: boolean
        }
        Update: {
          created_at?: string
          fee_amount?: number
          id?: string
          progress?: number
          student_id?: string
          subject_code?: string
          term_fee_paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["code"]
          },
        ]
      }
      fee_records: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_ref: string
          paid_on: string | null
          row_key: string
          status: string
          student_email: string
          student_name: string
          subject_code: string
          synced_at: string
          term: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_ref?: string
          paid_on?: string | null
          row_key: string
          status?: string
          student_email?: string
          student_name?: string
          subject_code?: string
          synced_at?: string
          term?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_ref?: string
          paid_on?: string | null
          row_key?: string
          status?: string
          student_email?: string
          student_name?: string
          subject_code?: string
          synced_at?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_settings: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          last_row_count: number
          last_synced_at: string | null
          sheet_url: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_error?: string | null
          last_row_count?: number
          last_synced_at?: string | null
          sheet_url?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          last_row_count?: number
          last_synced_at?: string | null
          sheet_url?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      lectures: {
        Row: {
          created_at: string
          id: string
          notes: string
          notes_url: string | null
          subject_code: string
          teacher_id: string
          title: string
          topic: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          notes_url?: string | null
          subject_code?: string
          teacher_id: string
          title?: string
          topic?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          notes_url?: string | null
          subject_code?: string
          teacher_id?: string
          title?: string
          topic?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      mcq_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation_text_or_image: string
          id: string
          options: Json
          paper_variant: string
          question_number: number
          question_text_or_image_url: string
          session: string
          subject_code: string
          topic_tag: string
          year: number
        }
        Insert: {
          correct_answer?: string
          created_at?: string
          explanation_text_or_image?: string
          id?: string
          options?: Json
          paper_variant?: string
          question_number?: number
          question_text_or_image_url?: string
          session?: string
          subject_code: string
          topic_tag?: string
          year: number
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation_text_or_image?: string
          id?: string
          options?: Json
          paper_variant?: string
          question_number?: number
          question_text_or_image_url?: string
          session?: string
          subject_code?: string
          topic_tag?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          mode: string
          quiz_id: string | null
          score: number
          student_id: string
          subject_code: string
          time_taken_seconds: number
          total: number
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          mode?: string
          quiz_id?: string | null
          score?: number
          student_id: string
          subject_code?: string
          time_taken_seconds?: number
          total?: number
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          mode?: string
          quiz_id?: string | null
          score?: number
          student_id?: string
          subject_code?: string
          time_taken_seconds?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          questions_json: Json
          subject_code: string
          title: string
          topic: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          questions_json?: Json
          subject_code: string
          title: string
          topic?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          questions_json?: Json
          subject_code?: string
          title?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["code"]
          },
        ]
      }
      subjects: {
        Row: {
          blurb: string
          code: string
          created_at: string
          level: string
          name: string
          papers: number
          stream: string
        }
        Insert: {
          blurb?: string
          code: string
          created_at?: string
          level: string
          name: string
          papers?: number
          stream: string
        }
        Update: {
          blurb?: string
          code?: string
          created_at?: string
          level?: string
          name?: string
          papers?: number
          stream?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          examiner_feedback: string | null
          file_url: string | null
          graded_by: string | null
          id: string
          max_score: number
          paper_code: string
          score: number | null
          status: string
          student_id: string
          subject_code: string | null
          title: string
        }
        Insert: {
          created_at?: string
          examiner_feedback?: string | null
          file_url?: string | null
          graded_by?: string | null
          id?: string
          max_score?: number
          paper_code: string
          score?: number | null
          status?: string
          student_id: string
          subject_code?: string | null
          title?: string
        }
        Update: {
          created_at?: string
          examiner_feedback?: string | null
          file_url?: string | null
          graded_by?: string | null
          id?: string
          max_score?: number
          paper_code?: string
          score?: number | null
          status?: string
          student_id?: string
          subject_code?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
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
    Enums: {
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const
