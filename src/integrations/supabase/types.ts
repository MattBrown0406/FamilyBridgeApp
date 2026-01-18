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
      activation_code_audit_log: {
        Row: {
          action: string
          activation_code_id: string | null
          details: Json | null
          id: string
          ip_address: string | null
          performed_at: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          activation_code_id?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          activation_code_id?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_code_audit_log_activation_code_id_fkey"
            columns: ["activation_code_id"]
            isOneToOne: false
            referencedRelation: "activation_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_code_audit_log_activation_code_id_fkey"
            columns: ["activation_code_id"]
            isOneToOne: false
            referencedRelation: "activation_codes_admin_view"
            referencedColumns: ["id"]
          },
        ]
      }
      activation_codes: {
        Row: {
          code: string
          created_at: string
          email_encrypted: string | null
          expires_at: string | null
          id: string
          is_used: boolean
          purchase_ref_encrypted: string | null
          purchase_ref_hash: string | null
          square_customer_id_encrypted: string | null
          square_customer_id_hash: string | null
          square_subscription_id_encrypted: string | null
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email_encrypted?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          purchase_ref_encrypted?: string | null
          purchase_ref_hash?: string | null
          square_customer_id_encrypted?: string | null
          square_customer_id_hash?: string | null
          square_subscription_id_encrypted?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email_encrypted?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          purchase_ref_encrypted?: string | null
          purchase_ref_hash?: string | null
          square_customer_id_encrypted?: string | null
          square_customer_id_hash?: string | null
          square_subscription_id_encrypted?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      aftercare_plans: {
        Row: {
          created_at: string
          created_by: string
          family_id: string
          id: string
          is_active: boolean
          notes: string | null
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aftercare_plans_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      aftercare_recommendations: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          facility_name: string | null
          frequency: string | null
          id: string
          is_completed: boolean
          plan_id: string
          recommendation_type: string
          recommended_duration: string | null
          therapy_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          facility_name?: string | null
          frequency?: string | null
          id?: string
          is_completed?: boolean
          plan_id: string
          recommendation_type: string
          recommended_duration?: string | null
          therapy_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          facility_name?: string | null
          frequency?: string | null
          id?: string
          is_completed?: boolean
          plan_id?: string
          recommendation_type?: string
          recommended_duration?: string | null
          therapy_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aftercare_recommendations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "aftercare_plans"
            referencedColumns: ["id"]
          },
        ]
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
      daily_emotional_checkins: {
        Row: {
          bypass_inferred_state: string | null
          check_in_date: string
          created_at: string
          family_id: string
          feeling: string | null
          id: string
          user_id: string
          was_bypassed: boolean
        }
        Insert: {
          bypass_inferred_state?: string | null
          check_in_date?: string
          created_at?: string
          family_id: string
          feeling?: string | null
          id?: string
          user_id: string
          was_bypassed?: boolean
        }
        Update: {
          bypass_inferred_state?: string | null
          check_in_date?: string
          created_at?: string
          family_id?: string
          feeling?: string | null
          id?: string
          user_id?: string
          was_bypassed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "daily_emotional_checkins_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_patterns: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          data: Json | null
          detected_at: string
          family_id: string
          id: string
          pattern_description: string
          pattern_type: string
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          data?: Json | null
          detected_at?: string
          family_id: string
          id?: string
          pattern_description: string
          pattern_type: string
          severity?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          data?: Json | null
          detected_at?: string
          family_id?: string
          id?: string
          pattern_description?: string
          pattern_type?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_patterns_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_tone_analysis: {
        Row: {
          analysis_date: string
          analysis_summary: string | null
          baseline_tone: string | null
          checkin_id: string | null
          created_at: string
          current_tone: string | null
          family_id: string
          id: string
          message_count_analyzed: number
          pattern_notes: Json | null
          tone_trajectory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          analysis_summary?: string | null
          baseline_tone?: string | null
          checkin_id?: string | null
          created_at?: string
          current_tone?: string | null
          family_id: string
          id?: string
          message_count_analyzed?: number
          pattern_notes?: Json | null
          tone_trajectory?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          analysis_summary?: string | null
          baseline_tone?: string | null
          checkin_id?: string | null
          created_at?: string
          current_tone?: string | null
          family_id?: string
          id?: string
          message_count_analyzed?: number
          pattern_notes?: Json | null
          tone_trajectory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_tone_analysis_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_emotional_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_tone_analysis_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          account_number: string
          archived_at: string | null
          archived_by: string | null
          avatar_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invite_code: string | null
          is_archived: boolean
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          account_number: string
          archived_at?: string | null
          archived_by?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_archived?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string
          archived_at?: string | null
          archived_by?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_archived?: boolean
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
      family_common_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          family_id: string
          goal_key: string
          id: string
          selected_by: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          family_id: string
          goal_key: string
          id?: string
          selected_by: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          family_id?: string
          goal_key?: string
          id?: string
          selected_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_common_goals_family_id_fkey"
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
      family_health_status: {
        Row: {
          calculated_at: string
          created_at: string
          family_id: string
          id: string
          metrics: Json | null
          status: string
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          family_id: string
          id?: string
          metrics?: Json | null
          status?: string
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          family_id?: string
          id?: string
          metrics?: Json | null
          status?: string
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_health_status_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
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
      family_reactivation_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          family_id: string
          id: string
          reactivation_type: string | null
          requested_at: string
          requested_by: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          family_id: string
          id?: string
          reactivation_type?: string | null
          requested_at?: string
          requested_by: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          family_id?: string
          id?: string
          reactivation_type?: string | null
          requested_at?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_reactivation_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_values: {
        Row: {
          created_at: string
          family_id: string
          id: string
          selected_by: string
          updated_at: string
          value_key: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          selected_by: string
          updated_at?: string
          value_key: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          selected_by?: string
          updated_at?: string
          value_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_values_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      fiis_auto_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          family_id: string
          id: string
          occurred_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          family_id: string
          id?: string
          occurred_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          family_id?: string
          id?: string
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiis_auto_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      fiis_disclaimer_acknowledgments: {
        Row: {
          acknowledged_at: string
          family_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          family_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          family_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiis_disclaimer_acknowledgments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      fiis_observations: {
        Row: {
          content: string
          created_at: string
          family_id: string
          id: string
          observation_type: string
          occurred_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          family_id: string
          id?: string
          observation_type: string
          occurred_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          family_id?: string
          id?: string
          observation_type?: string
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiis_observations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      fiis_pattern_analyses: {
        Row: {
          analysis_type: string
          clarifying_questions: Json | null
          contextual_framing: string | null
          created_at: string
          family_id: string
          id: string
          input_summary: Json
          pattern_signals: Json
          requested_by: string
          what_seeing: string | null
          what_to_watch: Json | null
        }
        Insert: {
          analysis_type?: string
          clarifying_questions?: Json | null
          contextual_framing?: string | null
          created_at?: string
          family_id: string
          id?: string
          input_summary?: Json
          pattern_signals?: Json
          requested_by: string
          what_seeing?: string | null
          what_to_watch?: Json | null
        }
        Update: {
          analysis_type?: string
          clarifying_questions?: Json | null
          contextual_framing?: string | null
          created_at?: string
          family_id?: string
          id?: string
          input_summary?: Json
          pattern_signals?: Json
          requested_by?: string
          what_seeing?: string | null
          what_to_watch?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fiis_pattern_analyses_family_id_fkey"
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
      hipaa_access_audit: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          hipaa_release_id: string
          id: string
          ip_address: string | null
        }
        Insert: {
          access_type?: string
          accessed_at?: string
          accessed_by: string
          hipaa_release_id: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          hipaa_release_id?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hipaa_access_audit_hipaa_release_id_fkey"
            columns: ["hipaa_release_id"]
            isOneToOne: false
            referencedRelation: "hipaa_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hipaa_access_audit_hipaa_release_id_fkey"
            columns: ["hipaa_release_id"]
            isOneToOne: false
            referencedRelation: "hipaa_releases_admin_view"
            referencedColumns: ["id"]
          },
        ]
      }
      hipaa_releases: {
        Row: {
          created_at: string
          family_id: string
          full_name: string
          id: string
          ip_address: string | null
          release_version: string
          signature_data: string
          signed_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          full_name: string
          id?: string
          ip_address?: string | null
          release_version?: string
          signature_data: string
          signed_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          release_version?: string
          signature_data?: string
          signed_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hipaa_releases_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      liquor_license_warnings: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          checkin_id: string
          created_at: string
          family_id: string
          id: string
          license_type: string | null
          location_address: string | null
          user_id: string
          warned_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          checkin_id: string
          created_at?: string
          family_id: string
          id?: string
          license_type?: string | null
          location_address?: string | null
          user_id: string
          warned_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          checkin_id?: string
          created_at?: string
          family_id?: string
          id?: string
          license_type?: string | null
          location_address?: string | null
          user_id?: string
          warned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquor_license_warnings_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "meeting_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquor_license_warnings_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
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
      moderator_disclaimers: {
        Row: {
          created_at: string
          disclaimer_type: string
          family_id: string
          id: string
          moderator_id: string
          shown_at: string
        }
        Insert: {
          created_at?: string
          disclaimer_type?: string
          family_id: string
          id?: string
          moderator_id: string
          shown_at?: string
        }
        Update: {
          created_at?: string
          disclaimer_type?: string
          family_id?: string
          id?: string
          moderator_id?: string
          shown_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderator_disclaimers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
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
      payment_access_tokens: {
        Row: {
          created_at: string
          expires_at: string
          financial_request_id: string
          id: string
          is_used: boolean
          payer_user_id: string
          requester_user_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          financial_request_id: string
          id?: string
          is_used?: boolean
          payer_user_id: string
          requester_user_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          financial_request_id?: string
          id?: string
          is_used?: boolean
          payer_user_id?: string
          requester_user_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_access_tokens_financial_request_id_fkey"
            columns: ["financial_request_id"]
            isOneToOne: false
            referencedRelation: "financial_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_info: {
        Row: {
          cashapp_username: string | null
          cashapp_username_encrypted: string | null
          created_at: string
          id: string
          paypal_username: string | null
          paypal_username_encrypted: string | null
          updated_at: string
          user_id: string
          venmo_username: string | null
          venmo_username_encrypted: string | null
        }
        Insert: {
          cashapp_username?: string | null
          cashapp_username_encrypted?: string | null
          created_at?: string
          id?: string
          paypal_username?: string | null
          paypal_username_encrypted?: string | null
          updated_at?: string
          user_id: string
          venmo_username?: string | null
          venmo_username_encrypted?: string | null
        }
        Update: {
          cashapp_username?: string | null
          cashapp_username_encrypted?: string | null
          created_at?: string
          id?: string
          paypal_username?: string | null
          paypal_username_encrypted?: string | null
          updated_at?: string
          user_id?: string
          venmo_username?: string | null
          venmo_username_encrypted?: string | null
        }
        Relationships: []
      }
      payment_info_access_audit: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          financial_request_id: string | null
          id: string
          ip_address: string | null
          payment_info_user_id: string
        }
        Insert: {
          access_type?: string
          accessed_at?: string
          accessed_by: string
          financial_request_id?: string | null
          id?: string
          ip_address?: string | null
          payment_info_user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          financial_request_id?: string | null
          id?: string
          ip_address?: string | null
          payment_info_user_id?: string
        }
        Relationships: []
      }
      payment_info_access_log: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          financial_request_id: string | null
          id: string
          payment_info_user_id: string
        }
        Insert: {
          access_type?: string
          accessed_at?: string
          accessed_by: string
          financial_request_id?: string | null
          id?: string
          payment_info_user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          financial_request_id?: string | null
          id?: string
          payment_info_user_id?: string
        }
        Relationships: []
      }
      premium_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      private_conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "private_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      private_conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "private_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      private_conversations: {
        Row: {
          created_at: string
          created_by: string
          family_id: string
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_conversations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
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
      sobriety_journeys: {
        Row: {
          created_at: string
          family_id: string
          id: string
          is_active: boolean
          reset_count: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          is_active?: boolean
          reset_count?: number
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          is_active?: boolean
          reset_count?: number
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sobriety_journeys_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      sobriety_milestones: {
        Row: {
          achieved_at: string
          celebrated_by_family: boolean
          created_at: string
          id: string
          journey_id: string
          milestone_days: number
          notes: string | null
        }
        Insert: {
          achieved_at?: string
          celebrated_by_family?: boolean
          created_at?: string
          id?: string
          journey_id: string
          milestone_days: number
          notes?: string | null
        }
        Update: {
          achieved_at?: string
          celebrated_by_family?: boolean
          created_at?: string
          id?: string
          journey_id?: string
          milestone_days?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sobriety_milestones_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "sobriety_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payment_status: {
        Row: {
          card_last_four: string | null
          created_at: string
          entity_id: string
          entity_type: string
          failed_at: string | null
          grace_period_ends_at: string | null
          id: string
          last_error: string | null
          last_payment_attempt: string | null
          next_retry_at: string | null
          payment_updated_at: string | null
          retry_count: number
          square_customer_id_hash: string | null
          status: string
          suspension_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_last_four?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          failed_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          last_error?: string | null
          last_payment_attempt?: string | null
          next_retry_at?: string | null
          payment_updated_at?: string | null
          retry_count?: number
          square_customer_id_hash?: string | null
          status?: string
          suspension_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_last_four?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          failed_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          last_error?: string | null
          last_payment_attempt?: string | null
          next_retry_at?: string | null
          payment_updated_at?: string | null
          retry_count?: number
          square_customer_id_hash?: string | null
          status?: string
          suspension_date?: string | null
          updated_at?: string
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
      activation_codes_admin_view: {
        Row: {
          code: string | null
          created_at: string | null
          email_status: string | null
          expires_at: string | null
          id: string | null
          is_used: boolean | null
          purchase_ref_status: string | null
          square_customer_status: string | null
          square_subscription_status: string | null
          updated_at: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          email_status?: never
          expires_at?: string | null
          id?: string | null
          is_used?: boolean | null
          purchase_ref_status?: never
          square_customer_status?: never
          square_subscription_status?: never
          updated_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          email_status?: never
          expires_at?: string | null
          id?: string | null
          is_used?: boolean | null
          purchase_ref_status?: never
          square_customer_status?: never
          square_subscription_status?: never
          updated_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      emotional_patterns_anonymized: {
        Row: {
          created_at: string | null
          detected_at: string | null
          family_id: string | null
          id: string | null
          is_acknowledged: boolean | null
          member_label: string | null
          pattern_description: string | null
          pattern_type: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          family_id?: string | null
          id?: string | null
          is_acknowledged?: never
          member_label?: never
          pattern_description?: string | null
          pattern_type?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          family_id?: string | null
          id?: string | null
          is_acknowledged?: never
          member_label?: never
          pattern_description?: string | null
          pattern_type?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotional_patterns_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      hipaa_releases_admin_view: {
        Row: {
          created_at: string | null
          family_id: string | null
          full_name: string | null
          id: string | null
          ip_address_masked: string | null
          release_version: string | null
          signature_status: string | null
          signed_at: string | null
          user_agent_status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          family_id?: string | null
          full_name?: string | null
          id?: string | null
          ip_address_masked?: never
          release_version?: string | null
          signature_status?: never
          signed_at?: string | null
          user_agent_status?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          family_id?: string | null
          full_name?: string | null
          id?: string | null
          ip_address_masked?: never
          release_version?: string | null
          signature_status?: never
          signed_at?: string | null
          user_agent_status?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hipaa_releases_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_info_masked: {
        Row: {
          cashapp_username: string | null
          created_at: string | null
          id: string | null
          paypal_username: string | null
          updated_at: string | null
          user_id: string | null
          venmo_username: string | null
        }
        Insert: {
          cashapp_username?: never
          created_at?: string | null
          id?: string | null
          paypal_username?: never
          updated_at?: string | null
          user_id?: string | null
          venmo_username?: never
        }
        Update: {
          cashapp_username?: never
          created_at?: string | null
          id?: string | null
          paypal_username?: never
          updated_at?: string | null
          user_id?: string | null
          venmo_username?: never
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_old_location_data: { Args: never; Returns: undefined }
      audit_activation_code_access: {
        Args: { _code_id: string }
        Returns: undefined
      }
      calculate_checkout_time: {
        Args: { checkin_time: string }
        Returns: string
      }
      can_approve_in_family: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_aftercare_plans: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_family_admins: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      check_and_log_activation_code_access: {
        Args: { _code_id: string }
        Returns: boolean
      }
      check_overdue_checkouts: { Args: never; Returns: undefined }
      check_payment_info_access_rate: { Args: never; Returns: boolean }
      decrypt_payment_field: {
        Args: { encrypted_text: string }
        Returns: string
      }
      decrypt_sensitive: { Args: { encrypted_text: string }; Returns: string }
      encrypt_payment_field: { Args: { plain_text: string }; Returns: string }
      encrypt_sensitive: { Args: { plain_text: string }; Returns: string }
      generate_activation_code: { Args: never; Returns: string }
      generate_payment_access_token: {
        Args: { _request_id: string }
        Returns: string
      }
      get_anonymized_family_patterns: {
        Args: { _family_id: string }
        Returns: {
          created_at: string
          detected_at: string
          family_id: string
          id: string
          is_acknowledged: boolean
          member_label: string
          pattern_description: string
          pattern_type: string
          severity: string
        }[]
      }
      get_family_invite_code: { Args: { _family_id: string }; Returns: string }
      get_hipaa_releases_for_family: {
        Args: { _family_id: string }
        Returns: {
          created_at: string
          family_id: string
          full_name: string
          id: string
          release_version: string
          signature_status: string
          signed_at: string
          user_id: string
        }[]
      }
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
      get_own_payment_info: {
        Args: never
        Returns: {
          cashapp_username: string
          paypal_username: string
          venmo_username: string
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
      get_payment_links_for_user: {
        Args: { target_user_id: string }
        Returns: {
          cashapp_link: string
          paypal_link: string
          venmo_link: string
        }[]
      }
      get_payment_links_with_token: {
        Args: { _token: string }
        Returns: {
          cashapp_link: string
          paypal_link: string
          venmo_link: string
        }[]
      }
      get_super_admin_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_user_activation_code_status: {
        Args: never
        Returns: {
          code_used: boolean
          expires_at: string
          used_at: string
        }[]
      }
      get_user_activation_status: {
        Args: never
        Returns: {
          code_exists: boolean
          code_masked: string
          expires_at: string
          is_expired: boolean
          is_used: boolean
          used_at: string
        }[]
      }
      is_family_admin_or_moderator: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_creator: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_moderator: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_in_same_family: {
        Args: { _other_user_id: string; _user_id: string }
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      request_has_no_votes: { Args: { _request_id: string }; Returns: boolean }
      shares_family_with: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      family_role:
        | "member"
        | "recovering"
        | "moderator"
        | "admin"
        | "therapist"
        | "case_manager"
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
      family_role: [
        "member",
        "recovering",
        "moderator",
        "admin",
        "therapist",
        "case_manager",
      ],
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
