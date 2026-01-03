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
      activation_codes: {
        Row: {
          code: string
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          is_used: boolean
          square_customer_id: string | null
          square_subscription_id: string | null
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          square_customer_id?: string | null
          square_subscription_id?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          square_customer_id?: string | null
          square_subscription_id?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
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
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          private_messaging_enabled: boolean
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
          private_messaging_enabled?: boolean
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
          private_messaging_enabled?: boolean
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
          checked_out_at: string | null
          checkout_address: string | null
          checkout_due_at: string | null
          checkout_latitude: number | null
          checkout_longitude: number | null
          created_at: string
          family_id: string
          id: string
          latitude: number
          longitude: number
          meeting_address: string | null
          meeting_name: string | null
          meeting_start_time: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes: string | null
          overdue_alert_sent: boolean | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          checkout_address?: string | null
          checkout_due_at?: string | null
          checkout_latitude?: number | null
          checkout_longitude?: number | null
          created_at?: string
          family_id: string
          id?: string
          latitude: number
          longitude: number
          meeting_address?: string | null
          meeting_name?: string | null
          meeting_start_time?: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          overdue_alert_sent?: boolean | null
          user_id: string
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          checkout_address?: string | null
          checkout_due_at?: string | null
          checkout_latitude?: number | null
          checkout_longitude?: number | null
          created_at?: string
          family_id?: string
          id?: string
          latitude?: number
          longitude?: number
          meeting_address?: string | null
          meeting_name?: string | null
          meeting_start_time?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          overdue_alert_sent?: boolean | null
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
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["provider_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["provider_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["provider_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          background_color: string | null
          body_font: string | null
          created_at: string
          created_by: string | null
          favicon_url: string | null
          foreground_color: string | null
          heading_font: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string | null
          primary_foreground_color: string | null
          secondary_color: string | null
          subdomain: string
          support_email: string | null
          tagline: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          created_at?: string
          created_by?: string | null
          favicon_url?: string | null
          foreground_color?: string | null
          heading_font?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          primary_foreground_color?: string | null
          secondary_color?: string | null
          subdomain: string
          support_email?: string | null
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          created_at?: string
          created_by?: string | null
          favicon_url?: string | null
          foreground_color?: string | null
          heading_font?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          primary_foreground_color?: string | null
          secondary_color?: string | null
          subdomain?: string
          support_email?: string | null
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      paid_moderator_requests: {
        Row: {
          activated_at: string | null
          amount_paid: number
          assigned_moderator_id: string | null
          completed_at: string | null
          created_at: string
          expires_at: string | null
          family_id: string
          hours_purchased: number
          id: string
          payment_completed_at: string | null
          requested_by: string
          square_order_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          amount_paid?: number
          assigned_moderator_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          family_id: string
          hours_purchased?: number
          id?: string
          payment_completed_at?: string | null
          requested_by: string
          square_order_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          amount_paid?: number
          assigned_moderator_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          family_id?: string
          hours_purchased?: number
          id?: string
          payment_completed_at?: string | null
          requested_by?: string
          square_order_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paid_moderator_requests_family_id_fkey"
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
      temporary_moderator_requests: {
        Row: {
          assigned_moderator_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          family_id: string
          id: string
          requested_by: string
          status: string
        }
        Insert: {
          assigned_moderator_id: string
          completed_at?: string | null
          created_at?: string
          expires_at: string
          family_id: string
          id?: string
          requested_by: string
          status?: string
        }
        Update: {
          assigned_moderator_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          family_id?: string
          id?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_moderator_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_checkout_time: {
        Args: { checkin_time: string }
        Returns: string
      }
      check_overdue_checkouts: { Args: never; Returns: undefined }
      generate_activation_code: { Args: never; Returns: string }
      get_family_invite_code: { Args: { _family_id: string }; Returns: string }
      get_organization_public_theme: {
        Args: { _subdomain: string }
        Returns: {
          accent_color: string
          background_color: string
          body_font: string
          favicon_url: string
          foreground_color: string
          heading_font: string
          id: string
          logo_url: string
          name: string
          primary_color: string
          primary_foreground_color: string
          secondary_color: string
          subdomain: string
          tagline: string
        }[]
      }
      get_payment_links_for_request: {
        Args: { _request_id: string }
        Returns: {
          cashapp_link: string
          paypal_link: string
          venmo_link: string
        }[]
      }
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
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_professional_moderator: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      request_has_no_votes: { Args: { _request_id: string }; Returns: boolean }
      shares_family_with: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
      }
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
        | "Therapy"
        | "Medical"
        | "Work"
        | "Job Interview"
        | "Court"
        | "Probation"
        | "Support Group"
        | "Wellness"
        | "Gym"
        | "Date"
        | "Friendly Gathering"
        | "Group Event"
        | "Family Event"
      provider_role: "owner" | "admin" | "staff"
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
        "Therapy",
        "Medical",
        "Work",
        "Job Interview",
        "Court",
        "Probation",
        "Support Group",
        "Wellness",
        "Gym",
        "Date",
        "Friendly Gathering",
        "Group Event",
        "Family Event",
      ],
      provider_role: ["owner", "admin", "staff"],
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
