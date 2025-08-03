export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      credit_purchases: {
        Row: {
          amount: number
          created_at: string
          credits_amount: number
          external_transaction_id: string | null
          failure_reason: string | null
          id: string
          payment_method_id: string | null
          payment_provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_amount: number
          external_transaction_id?: string | null
          failure_reason?: string | null
          id?: string
          payment_method_id?: string | null
          payment_provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_amount?: number
          external_transaction_id?: string | null
          failure_reason?: string | null
          id?: string
          payment_method_id?: string | null
          payment_provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          application_id: string | null
          balance_after: number
          created_at: string
          description: string
          gig_id: string | null
          id: string
          reference_transaction_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          application_id?: string | null
          balance_after: number
          created_at?: string
          description: string
          gig_id?: string | null
          id?: string
          reference_transaction_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          balance_after?: number
          created_at?: string
          description?: string
          gig_id?: string | null
          id?: string
          reference_transaction_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "gig_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_reference_transaction_id_fkey"
            columns: ["reference_transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_applications: {
        Row: {
          created_at: string
          gig_id: string
          id: string
          message: string | null
          proposed_rate: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          gig_id: string
          id?: string
          message?: string | null
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          gig_id?: string
          id?: string
          message?: string | null
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gig_payments: {
        Row: {
          application_id: string
          created_at: string
          gig_id: string
          gross_amount: number
          id: string
          net_amount: number
          payee_id: string
          payer_id: string
          payment_status: string
          service_fee: number
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          gig_id: string
          gross_amount: number
          id?: string
          net_amount: number
          payee_id: string
          payer_id: string
          payment_status?: string
          service_fee: number
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          gig_id?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          payee_id?: string
          payer_id?: string
          payment_status?: string
          service_fee?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "gig_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_payments_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: Database["public"]["Enums"]["gig_category"]
          contact_phone: string | null
          created_at: string
          description: string
          duration_hours: number | null
          id: string
          is_urgent: boolean
          location: string
          poster_id: string
          preferred_start_date: string | null
          required_skills: string[] | null
          status: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category: Database["public"]["Enums"]["gig_category"]
          contact_phone?: string | null
          created_at?: string
          description: string
          duration_hours?: number | null
          id?: string
          is_urgent?: boolean
          location: string
          poster_id: string
          preferred_start_date?: string | null
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: Database["public"]["Enums"]["gig_category"]
          contact_phone?: string | null
          created_at?: string
          description?: string
          duration_hours?: number | null
          id?: string
          is_urgent?: boolean
          location?: string
          poster_id?: string
          preferred_start_date?: string | null
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["gig_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          account_type: string | null
          bank_name: string | null
          branch_code: string | null
          card_brand: string | null
          card_last_four: string | null
          card_token: string | null
          created_at: string
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          paypal_email: string | null
          provider: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          branch_code?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          card_token?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          paypal_email?: string | null
          provider: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          branch_code?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          card_token?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          paypal_email?: string | null
          provider?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          id_photo_url: string | null
          location: string | null
          phone: string | null
          rating: number | null
          total_jobs_completed: number | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          id_photo_url?: string | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          total_jobs_completed?: number | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_photo_url?: string | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          total_jobs_completed?: number | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          external_transaction_id: string | null
          id: string
          net_amount: number
          payment_method_id: string
          processed_at: string | null
          processing_notes: string | null
          status: string
          updated_at: string
          user_id: string
          withdrawal_fee: number
        }
        Insert: {
          amount: number
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          net_amount: number
          payment_method_id: string
          processed_at?: string | null
          processing_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          withdrawal_fee?: number
        }
        Update: {
          amount?: number
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          net_amount?: number
          payment_method_id?: string
          processed_at?: string | null
          processing_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          withdrawal_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_gig_payment_transaction: {
        Args: {
          p_application_id: string
          p_gig_id: string
          p_payer_id: string
          p_payee_id: string
          p_gross_amount: number
          p_service_fee: number
          p_net_amount: number
          p_gig_title: string
        }
        Returns: undefined
      }
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      gig_category:
        | "cleaning"
        | "moving"
        | "delivery"
        | "handyman"
        | "gardening"
        | "tech_support"
        | "tutoring"
        | "pet_care"
        | "event_help"
        | "other"
      gig_status: "open" | "in_progress" | "completed" | "cancelled"
      user_type: "job_poster" | "gig_worker" | "both"
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
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      gig_category: [
        "cleaning",
        "moving",
        "delivery",
        "handyman",
        "gardening",
        "tech_support",
        "tutoring",
        "pet_care",
        "event_help",
        "other",
      ],
      gig_status: ["open", "in_progress", "completed", "cancelled"],
      user_type: ["job_poster", "gig_worker", "both"],
    },
  },
} as const
