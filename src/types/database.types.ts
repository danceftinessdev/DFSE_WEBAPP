/**
 * Kézzel karbantartott típusdefiníciók a Supabase séma alapján
 * (supabase/migrations/0001_init_schema.sql).
 *
 * Éles projektben ezt a fájlt a Supabase CLI generálja:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 * Amíg nincs élő projekt, ez a kézi típusdefiníció biztosítja a típusbiztonságot.
 */

export type AppRole = "user" | "parent" | "coach" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          display_name: string;
          email: string;
          phone: string | null;
          birth_date: string | null;
          avatar_url: string | null;
          is_active: boolean;
          gdpr_anonymized: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_roles"]["Row"]> & {
          user_id: string;
          role: AppRole;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
        Relationships: [];
      };
      news_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: unknown;
          excerpt: string | null;
          cover_image_url: string | null;
          author_id: string | null;
          is_published: boolean;
          published_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["news_posts"]["Row"]> & {
          title: string;
          slug: string;
          content: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["news_posts"]["Row"]>;
        Relationships: [];
      };
      scheduled_classes: {
        Row: {
          id: string;
          class_type_id: string;
          coach_id: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string;
          capacity: number | null;
          status: "scheduled" | "cancelled" | "completed";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["scheduled_classes"]["Row"]> & {
          class_type_id: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["scheduled_classes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "scheduled_classes_class_type_id_fkey";
            columns: ["class_type_id"];
            isOneToOne: false;
            referencedRelation: "class_types";
            referencedColumns: ["id"];
          },
        ];
      };
      class_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          level: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["class_types"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["class_types"]["Row"]>;
        Relationships: [];
      };
      athletes_showcase: {
        Row: {
          id: string;
          profile_id: string | null;
          display_name: string;
          bio: string | null;
          photo_url: string | null;
          achievements: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["athletes_showcase"]["Row"]> & {
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["athletes_showcase"]["Row"]>;
        Relationships: [];
      };
      athlete_profiles: {
        Row: {
          id: string;
          student_id: string;
          category_id: string | null;
          medical_certificate_expiry: string | null;
          medical_certificate_url: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["athlete_profiles"]["Row"]> & {
          student_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["athlete_profiles"]["Row"]>;
        Relationships: [];
      };
      membership_fees: {
        Row: {
          id: string;
          student_id: string;
          period_year: number;
          period_month: number;
          amount: number;
          status: "pending" | "paid" | "overdue" | "waived";
          paid_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["membership_fees"]["Row"]> & {
          student_id: string;
          period_year: number;
          period_month: number;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["membership_fees"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { _role: AppRole };
        Returns: boolean;
      };
      has_permission: {
        Args: { _code: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      validate_choreography_rules: {
        Args: { _choreography_id: string };
        Returns: {
          rule_id: string;
          rule_code: string;
          rule_description: string;
          actual_count: number;
          max_count: number;
        }[];
      };
      anonymize_profile: {
        Args: { _profile_id: string };
        Returns: void;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
