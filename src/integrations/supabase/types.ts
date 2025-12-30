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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brand_inquiries: {
        Row: {
          brand_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string
          phone: string | null
          website: string | null
        }
        Insert: {
          brand_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          brand_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          stripe_session_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_session_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_session_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_credits: {
        Row: {
          claimed_date: string
          created_at: string
          id: string
          streak_count: number
          user_id: string
        }
        Insert: {
          claimed_date?: string
          created_at?: string
          id?: string
          streak_count?: number
          user_id: string
        }
        Update: {
          claimed_date?: string
          created_at?: string
          id?: string
          streak_count?: number
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          outfit_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          outfit_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          outfit_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "outfit_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "saved_outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          outfit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          outfit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          outfit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_comments_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "saved_outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_likes: {
        Row: {
          created_at: string
          id: string
          outfit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          outfit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          outfit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_likes_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "saved_outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_ratings: {
        Row: {
          created_at: string
          id: string
          outfit_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          outfit_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          outfit_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_ratings_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "saved_outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          chest_cm: number | null
          created_at: string
          display_name: string | null
          favorite_brands: string[] | null
          gender_preference: string | null
          height_cm: number | null
          hip_cm: number | null
          id: string
          inseam_cm: number | null
          neck_cm: number | null
          pants_length_cm: number | null
          shoulder_cm: number | null
          trainer_size: string | null
          updated_at: string
          user_id: string
          waist_cm: number | null
          wrist_cm: number | null
        }
        Insert: {
          avatar_url?: string | null
          chest_cm?: number | null
          created_at?: string
          display_name?: string | null
          favorite_brands?: string[] | null
          gender_preference?: string | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          inseam_cm?: number | null
          neck_cm?: number | null
          pants_length_cm?: number | null
          shoulder_cm?: number | null
          trainer_size?: string | null
          updated_at?: string
          user_id: string
          waist_cm?: number | null
          wrist_cm?: number | null
        }
        Update: {
          avatar_url?: string | null
          chest_cm?: number | null
          created_at?: string
          display_name?: string | null
          favorite_brands?: string[] | null
          gender_preference?: string | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          inseam_cm?: number | null
          neck_cm?: number | null
          pants_length_cm?: number | null
          shoulder_cm?: number | null
          trainer_size?: string | null
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          wrist_cm?: number | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_signups: {
        Row: {
          created_at: string
          credits_awarded: number
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      saved_outfits: {
        Row: {
          avatar_image: string
          average_rating: number | null
          caption: string | null
          created_at: string
          id: string
          is_public: boolean
          products: Json
          rating_count: number | null
          total_price: number
          try_on_image: string
          user_id: string
        }
        Insert: {
          avatar_image: string
          average_rating?: number | null
          caption?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          products?: Json
          rating_count?: number | null
          total_price?: number
          try_on_image: string
          user_id: string
        }
        Update: {
          avatar_image?: string
          average_rating?: number | null
          caption?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          products?: Json
          rating_count?: number | null
          total_price?: number
          try_on_image?: string
          user_id?: string
        }
        Relationships: []
      }
      share_events: {
        Row: {
          created_at: string
          id: string
          outfit_id: string | null
          platform: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          outfit_id?: string | null
          platform: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          outfit_id?: string | null
          platform?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_events_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "saved_outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_analytics: {
        Row: {
          created_at: string
          id: string
          referral_code: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_body_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_product_images: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string
          name: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url: string
          name?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          created_at: string
          id: string
          product_brand: string | null
          product_category: string | null
          product_image: string
          product_name: string
          product_price: number | null
          product_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_brand?: string | null
          product_category?: string | null
          product_image: string
          product_name: string
          product_price?: number | null
          product_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_brand?: string | null
          product_category?: string | null
          product_image?: string
          product_name?: string
          product_price?: number | null
          product_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_streak: { Args: { p_user_id: string }; Returns: number }
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
