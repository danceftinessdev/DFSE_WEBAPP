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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      athlete_categories: {
        Row: {
          id: string
          is_active: boolean
          max_age: number | null
          min_age: number | null
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          max_age?: number | null
          min_age?: number | null
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          max_age?: number | null
          min_age?: number | null
          name?: string
        }
        Relationships: []
      }
      athlete_profiles: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          medical_certificate_expiry: string | null
          medical_certificate_url: string | null
          notes: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          medical_certificate_expiry?: string | null
          medical_certificate_url?: string | null
          notes?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          medical_certificate_expiry?: string | null
          medical_certificate_url?: string | null
          notes?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_profiles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "athlete_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes_showcase: {
        Row: {
          achievements: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          photo_url: string | null
          profile_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          achievements?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athletes_showcase_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          marked_at: string
          marked_by: string | null
          note: string | null
          scheduled_class_id: string
          status: string
          student_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          note?: string | null
          scheduled_class_id: string
          status?: string
          student_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          note?: string | null
          scheduled_class_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      choreographies: {
        Row: {
          category_id: string | null
          competition_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          competition_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          competition_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "choreographies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "athlete_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "choreographies_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      choreography_costumes: {
        Row: {
          choreography_id: string
          costume_id: string
          id: string
          quantity_needed: number | null
        }
        Insert: {
          choreography_id: string
          costume_id: string
          id?: string
          quantity_needed?: number | null
        }
        Update: {
          choreography_id?: string
          costume_id?: string
          id?: string
          quantity_needed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "choreography_costumes_choreography_id_fkey"
            columns: ["choreography_id"]
            isOneToOne: false
            referencedRelation: "choreographies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "choreography_costumes_costume_id_fkey"
            columns: ["costume_id"]
            isOneToOne: false
            referencedRelation: "costumes"
            referencedColumns: ["id"]
          },
        ]
      }
      choreography_elements: {
        Row: {
          choreography_id: string
          created_at: string
          element_id: string
          id: string
          sequence_order: number | null
        }
        Insert: {
          choreography_id: string
          created_at?: string
          element_id: string
          id?: string
          sequence_order?: number | null
        }
        Update: {
          choreography_id?: string
          created_at?: string
          element_id?: string
          id?: string
          sequence_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "choreography_elements_choreography_id_fkey"
            columns: ["choreography_id"]
            isOneToOne: false
            referencedRelation: "choreographies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "choreography_elements_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "elements"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          level: string | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      competition_participants: {
        Row: {
          accommodation_cost: number | null
          accommodation_paid: boolean
          competition_id: string
          created_at: string
          entry_fee_amount: number | null
          entry_fee_paid: boolean
          id: string
          is_active: boolean
          student_id: string
          travel_mode: string | null
          updated_at: string
        }
        Insert: {
          accommodation_cost?: number | null
          accommodation_paid?: boolean
          competition_id: string
          created_at?: string
          entry_fee_amount?: number | null
          entry_fee_paid?: boolean
          id?: string
          is_active?: boolean
          student_id: string
          travel_mode?: string | null
          updated_at?: string
        }
        Update: {
          accommodation_cost?: number | null
          accommodation_paid?: boolean
          competition_id?: string
          created_at?: string
          entry_fee_amount?: number | null
          entry_fee_paid?: boolean
          id?: string
          is_active?: boolean
          student_id?: string
          travel_mode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_participants_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      costumes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          size: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          size?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          size?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      elements: {
        Row: {
          created_at: string
          difficulty: number
          element_type: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          difficulty?: number
          element_type: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          element_type?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      gdpr_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          consent_type: string
          created_at: string
          document_url: string | null
          id: string
          student_id: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type: string
          created_at?: string
          document_url?: string | null
          id?: string
          student_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type?: string
          created_at?: string
          document_url?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_fees: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          paid_at: string | null
          period_month: number
          period_year: number
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_active?: boolean
          paid_at?: string | null
          period_month: number
          period_year: number
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          paid_at?: string | null
          period_month?: number
          period_year?: number
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          author_id: string | null
          content: Json
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_active: boolean
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: Json
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_references: {
        Row: {
          id: string
          label: string
          news_id: string
          url: string | null
        }
        Insert: {
          id?: string
          label: string
          news_id: string
          url?: string | null
        }
        Update: {
          id?: string
          label?: string
          news_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_references_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child_links: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          relation: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          relation?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          relation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          display_name: string | null
          email: string
          first_name: string
          gdpr_anonymized: boolean
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          first_name: string
          gdpr_anonymized?: boolean
          id: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          first_name?: string
          gdpr_anonymized?: boolean
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rules: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          description: string
          element_type: string | null
          id: string
          is_active: boolean
          max_count: number | null
          max_difficulty: number | null
          min_difficulty: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string
          description: string
          element_type?: string | null
          id?: string
          is_active?: boolean
          max_count?: number | null
          max_difficulty?: number | null
          min_difficulty?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string
          description?: string
          element_type?: string | null
          id?: string
          is_active?: boolean
          max_count?: number | null
          max_difficulty?: number | null
          min_difficulty?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "athlete_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_classes: {
        Row: {
          capacity: number | null
          class_type_id: string
          coach_id: string | null
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          location: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          class_type_id: string
          coach_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          location?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          class_type_id?: string
          coach_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_classes_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_costumes: {
        Row: {
          borrowed_at: string
          costume_id: string
          created_at: string
          id: string
          returned_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          borrowed_at?: string
          costume_id: string
          created_at?: string
          id?: string
          returned_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          borrowed_at?: string
          costume_id?: string
          created_at?: string
          id?: string
          returned_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_costumes_costume_id_fkey"
            columns: ["costume_id"]
            isOneToOne: false
            referencedRelation: "costumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_costumes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_profile: { Args: { _profile_id: string }; Returns: undefined }
      has_permission: { Args: { _code: string }; Returns: boolean }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_choreography_rules: {
        Args: { _choreography_id: string }
        Returns: {
          actual_count: number
          max_count: number
          rule_code: string
          rule_description: string
          rule_id: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "parent" | "coach" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["user", "parent", "coach", "admin"],
    },
  },
} as const
