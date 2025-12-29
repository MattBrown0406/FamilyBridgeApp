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
      boundary_acknowledgments: {
        Row: {
          acknowledged_at: string
          boundary_id: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          boundary_id: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          boundary_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boundary_acknowledgments_boundary_id_fkey"
            columns: ["boundary_id"]
            isOneToOne: false
            referencedRelation: "family_boundaries"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invite_code: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_boundaries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string
          created_by: string
          family_id: string
          id: string
          rejected_reason: string | null
          status: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          rejected_reason?: string | null
          status?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          rejected_reason?: string | null
          status?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_boundaries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          family_id: string
          goal_type: string
          id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          family_id: string
          goal_type: string
          id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          family_id?: string
          goal_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_goals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invite_codes: {
        Row: {
          created_at: string
          family_id: string
          invite_code: string
        }
        Insert: {
          created_at?: string
          family_id: string
          invite_code?: string
        }
        Update: {
          created_at?: string
          family_id?: string
          invite_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invite_codes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string
          relationship_type:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          role?: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_pledges: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          request_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method?: string | null
          request_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_pledges_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "financial_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_requests: {
        Row: {
          amount: number
          attachment_url: string | null
          created_at: string
          family_id: string
          id: string
          paid_at: string | null
          paid_by_user_id: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by_user_id: string | null
          payment_method: string | null
          reason: string
          requester_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          created_at?: string
          family_id: string
          id?: string
          paid_at?: string | null
          paid_by_user_id?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by_user_id?: string | null
          payment_method?: string | null
          reason: string
          requester_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          created_at?: string
          family_id?: string
          id?: string
          paid_at?: string | null
          paid_by_user_id?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by_user_id?: string | null
          payment_method?: string | null
          reason?: string
          requester_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "financial_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_votes: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          request_id: string
          voter_id: string
        }
        Insert: {
          approved: boolean
          created_at?: string
          id?: string
          request_id: string
          voter_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          request_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "financial_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      location_checkin_requests: {
        Row: {
          created_at: string
          family_id: string
          id: string
          latitude: number | null
          location_address: string | null
          longitude: number | null
          requested_at: string
          requester_id: string
          requester_note: string | null
          responded_at: string | null
          response_note: string | null
          status: string
          target_user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          requested_at?: string
          requester_id: string
          requester_note?: string | null
          responded_at?: string | null
          response_note?: string | null
          status?: string
          target_user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          requested_at?: string
          requester_id?: string
          requester_note?: string | null
          responded_at?: string | null
          response_note?: string | null
          status?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_checkin_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_checkins: {
        Row: {
          checked_in_at: string
          created_at: string
          family_id: string
          id: string
          latitude: number
          longitude: number
          meeting_address: string | null
          meeting_name: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes: string | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          created_at?: string
          family_id: string
          id?: string
          latitude: number
          longitude: number
          meeting_address?: string | null
          meeting_name?: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          user_id: string
        }
        Update: {
          checked_in_at?: string
          created_at?: string
          family_id?: string
          id?: string
          latitude?: number
          longitude?: number
          meeting_address?: string | null
          meeting_name?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_checkins_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          family_id: string
          id: string
          original_content: string | null
          sender_id: string
          was_filtered: boolean | null
        }
        Insert: {
          content: string
          created_at?: string
          family_id: string
          id?: string
          original_content?: string | null
          sender_id: string
          was_filtered?: boolean | null
        }
        Update: {
          content?: string
          created_at?: string
          family_id?: string
          id?: string
          original_content?: string | null
          sender_id?: string
          was_filtered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          family_id: string | null
          id: string
          is_read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          family_id?: string | null
          id?: string
          is_read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          family_id?: string | null
          id?: string
          is_read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_info: {
        Row: {
          cashapp_username: string | null
          created_at: string
          id: string
          paypal_username: string | null
          updated_at: string
          user_id: string
          venmo_username: string | null
        }
        Insert: {
          cashapp_username?: string | null
          created_at?: string
          id?: string
          paypal_username?: string | null
          updated_at?: string
          user_id: string
          venmo_username?: string | null
        }
        Update: {
          cashapp_username?: string | null
          created_at?: string
          id?: string
          paypal_username?: string | null
          updated_at?: string
          user_id?: string
          venmo_username?: string | null
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          created_at: string
          family_id: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          family_id: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          family_id?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_family_invite_code: { Args: { _family_id: string }; Returns: string }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_moderator: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_moderator_of_family_member: {
        Args: { _member_id: string; _moderator_id: string }
        Returns: boolean
      }
      request_has_no_votes: { Args: { _request_id: string }; Returns: boolean }
    }
    Enums: {
      family_role: "member" | "recovering" | "moderator"
      meeting_type:
        | "AA"
        | "Al-Anon"
        | "NA"
        | "Nar-Anon"
        | "Other"
        | "Refuge Recovery"
        | "Smart Recovery"
        | "ACA"
        | "CoDA"
        | "Families Anonymous"
        | "Celebrate Recovery"
      relationship_type:
        | "recovering"
        | "parent"
        | "spouse_partner"
        | "sibling"
        | "child"
        | "grandparent"
        | "aunt_uncle"
        | "cousin"
        | "friend"
        | "other"
      request_status: "pending" | "approved" | "denied"
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
      family_role: ["member", "recovering", "moderator"],
      meeting_type: [
        "AA",
        "Al-Anon",
        "NA",
        "Nar-Anon",
        "Other",
        "Refuge Recovery",
        "Smart Recovery",
        "ACA",
        "CoDA",
        "Families Anonymous",
        "Celebrate Recovery",
      ],
      relationship_type: [
        "recovering",
        "parent",
        "spouse_partner",
        "sibling",
        "child",
        "grandparent",
        "aunt_uncle",
        "cousin",
        "friend",
        "other",
      ],
      request_status: ["pending", "approved", "denied"],
    },
  },
} as const
