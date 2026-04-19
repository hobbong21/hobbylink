/**
 * Supabase database type definitions.
 *
 * This file is a hand-written stub that mirrors `scripts/001_create_tables.sql`.
 * Regenerate from the live schema with:
 *
 *   npx supabase gen types typescript --project-id <your-project-id> \
 *     --schema public > lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  /**
   * Required by @supabase/supabase-js >= 2.50 so the query builder doesn't
   * fall back to `never` for every Row type. Bump the version if the
   * underlying Postgrest version changes.
   */
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          location: string | null
          is_admin: boolean
          is_suspended: boolean
          suspended_until: string | null
          referral_code: string
          last_active_at: string | null
          visibility: "public" | "connections" | "private"
          language: "ko" | "en"
          xp: number
          level: number
          phone_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          is_admin?: boolean
          is_suspended?: boolean
          suspended_until?: string | null
          referral_code?: string
          last_active_at?: string | null
          visibility?: "public" | "connections" | "private"
          language?: "ko" | "en"
          xp?: number
          level?: number
          phone_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      hobbies: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          image_url: string | null
          member_count: number
          is_featured: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["hobbies"]["Row"], "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["hobbies"]["Insert"]>
        Relationships: []
      }
      user_hobbies: {
        Row: {
          id: string
          user_id: string
          hobby_id: string
          skill_level: "beginner" | "intermediate" | "advanced" | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hobby_id: string
          skill_level?: "beginner" | "intermediate" | "advanced" | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["user_hobbies"]["Insert"]>
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          user_id: string
          matched_user_id: string
          status: "pending" | "accepted" | "rejected"
          match_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          matched_user_id: string
          status?: "pending" | "accepted" | "rejected"
          match_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>
        Relationships: []
      }
      thread_read_state: {
        Row: {
          user_id: string
          peer_id: string
          last_read_at: string
        }
        Insert: {
          user_id: string
          peer_id: string
          last_read_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["thread_read_state"]["Insert"]>
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          image_url: string | null
          image_path: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          image_url?: string | null
          image_path?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          image_url: string | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          image_url?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>
        Relationships: []
      }
      post_drafts: {
        Row: {
          user_id: string
          content: string
          updated_at: string
        }
        Insert: {
          user_id: string
          content?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["post_drafts"]["Insert"]>
        Relationships: []
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction: "like" | "love" | "laugh" | "wow" | "sad" | "clap"
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction: "like" | "love" | "laugh" | "wow" | "sad" | "clap"
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["post_reactions"]["Insert"]>
        Relationships: []
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["post_likes"]["Insert"]>
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_id?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string | null
          location_address: string | null
          latitude: number | null
          longitude: number | null
          event_date: string
          organizer_id: string
          hobby_id: string | null
          max_participants: number | null
          current_participants: number
          image_url: string | null
          series_id: string | null
          recurrence_frequency: "weekly" | "biweekly" | "monthly" | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location?: string | null
          location_address?: string | null
          latitude?: number | null
          longitude?: number | null
          event_date: string
          organizer_id: string
          hobby_id?: string | null
          max_participants?: number | null
          current_participants?: number
          image_url?: string | null
          series_id?: string | null
          recurrence_frequency?: "weekly" | "biweekly" | "monthly" | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string | null
          target_type: "profile" | "post" | "comment" | "event" | "message"
          target_id: string
          reason: string
          status: "open" | "reviewing" | "resolved" | "dismissed"
          resolution_notes: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          target_type: "profile" | "post" | "comment" | "event" | "message"
          target_id: string
          reason: string
          status?: "open" | "reviewing" | "resolved" | "dismissed"
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>
        Relationships: []
      }
      user_blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          reason?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["user_blocks"]["Insert"]>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string | null
          type:
            | "match_accepted"
            | "new_message"
            | "new_follower"
            | "event_reminder"
            | "event_cancelled"
            | "system"
          payload: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id?: string | null
          type:
            | "match_accepted"
            | "new_message"
            | "new_follower"
            | "event_reminder"
            | "event_cancelled"
            | "system"
          payload?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
        Relationships: []
      }
      subscriptions: {
        Row: {
          user_id: string
          tier: "free" | "premium"
          status: "trialing" | "active" | "past_due" | "canceled" | "incomplete"
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          tier?: "free" | "premium"
          status?: "trialing" | "active" | "past_due" | "canceled" | "incomplete"
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>
        Relationships: []
      }
      notification_prefs: {
        Row: {
          user_id: string
          email_on_match: boolean
          email_on_new_message: boolean
          email_on_event_reminder: boolean
          inapp_on_follow: boolean
          play_sound: boolean
          vibrate: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          email_on_match?: boolean
          email_on_new_message?: boolean
          email_on_event_reminder?: boolean
          inapp_on_follow?: boolean
          play_sound?: boolean
          vibrate?: boolean
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["notification_prefs"]["Insert"]>
        Relationships: []
      }
      referrals: {
        Row: {
          referred_user_id: string
          referrer_user_id: string
          referral_code: string
          created_at: string
        }
        Insert: {
          referred_user_id: string
          referrer_user_id: string
          referral_code: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          target_type: "post" | "event"
          target_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: "post" | "event"
          target_id: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Insert"]>
        Relationships: []
      }
      tags: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>
        Relationships: []
      }
      post_tags: {
        Row: { post_id: string; tag_id: string }
        Insert: { post_id: string; tag_id: string }
        Update: never
        Relationships: []
      }
      event_tags: {
        Row: { event_id: string; tag_id: string }
        Insert: { event_id: string; tag_id: string }
        Update: never
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          followed_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          followed_id: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["follows"]["Insert"]>
        Relationships: []
      }
      event_reviews: {
        Row: {
          id: string
          event_id: string
          author_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          author_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["event_reviews"]["Insert"]>
        Relationships: []
      }
      event_messages: {
        Row: {
          id: string
          event_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["event_messages"]["Insert"]>
        Relationships: []
      }
      flag_exposures: {
        Row: {
          id: string
          user_id: string | null
          flag_key: string
          variant: "on" | "off"
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          flag_key: string
          variant: "on" | "off"
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["flag_exposures"]["Insert"]>
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          tier: "free" | "pro"
          scopes: string[]
          last_used_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          tier?: "free" | "pro"
          scopes?: string[]
          last_used_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>
        Relationships: []
      }
      api_key_usage: {
        Row: {
          key_id: string
          window_hour: string
          request_count: number
        }
        Insert: {
          key_id: string
          window_hour: string
          request_count?: number
        }
        Update: Partial<Database["public"]["Tables"]["api_key_usage"]["Insert"]>
        Relationships: []
      }
      match_tuning: {
        Row: {
          id: string
          overlap_weight: number
          location_exact_bonus: number
          location_region_bonus: number
          recency_48h_bonus: number
          recency_7d_bonus: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id: string
          overlap_weight?: number
          location_exact_bonus?: number
          location_region_bonus?: number
          recency_48h_bonus?: number
          recency_7d_bonus?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["match_tuning"]["Insert"]>
        Relationships: []
      }
      ab_conversions: {
        Row: {
          id: string
          user_id: string | null
          kind: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          kind: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["ab_conversions"]["Insert"]>
        Relationships: []
      }
      feature_flags: {
        Row: {
          key: string
          description: string | null
          enabled: boolean
          rollout_percent: number
          allowlist: string[]
          updated_at: string
        }
        Insert: {
          key: string
          description?: string | null
          enabled?: boolean
          rollout_percent?: number
          allowlist?: string[]
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Insert"]>
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          variant: "info" | "warning" | "success"
          link_url: string | null
          link_label: string | null
          starts_at: string
          ends_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          variant?: "info" | "warning" | "success"
          link_url?: string | null
          link_label?: string | null
          starts_at?: string
          ends_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>
        Relationships: []
      }
      announcement_dismissals: {
        Row: {
          user_id: string
          announcement_id: string
          dismissed_at: string
        }
        Insert: {
          user_id: string
          announcement_id: string
          dismissed_at?: string
        }
        Update: never
        Relationships: []
      }
      achievements: {
        Row: {
          code: string
          label: string
          description: string
          icon: string | null
          points: number
          created_at: string
        }
        Insert: {
          code: string
          label: string
          description: string
          icon?: string | null
          points?: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["achievements"]["Insert"]>
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          code: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          earned_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["user_achievements"]["Insert"]>
        Relationships: []
      }
      event_invitations: {
        Row: {
          id: string
          event_id: string
          invitee_id: string
          inviter_id: string | null
          status: "pending" | "accepted" | "declined"
          message: string | null
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          invitee_id: string
          inviter_id?: string | null
          status?: "pending" | "accepted" | "declined"
          message?: string | null
          created_at?: string
          responded_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["event_invitations"]["Insert"]>
        Relationships: []
      }
      event_photos: {
        Row: {
          id: string
          event_id: string
          uploader_id: string | null
          storage_path: string
          url: string
          caption: string | null
          sort_order: number
          thumb_path: string | null
          thumb_url: string | null
          thumb_status: "pending" | "done" | "failed"
          thumb_error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          uploader_id?: string | null
          storage_path: string
          url: string
          caption?: string | null
          sort_order?: number
          thumb_path?: string | null
          thumb_url?: string | null
          thumb_status?: "pending" | "done" | "failed"
          thumb_error?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["event_photos"]["Insert"]>
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          last_seen_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          last_seen_at?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>
        Relationships: []
      }
            event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: "registered" | "attended" | "cancelled" | "waitlisted"
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: "registered" | "attended" | "cancelled" | "waitlisted"
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["event_participants"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_organizer_reputation: {
        Args: { p_user_id: string }
        Returns: {
          review_count: number
          avg_rating: number | null
          events_organized: number
        }[]
      }
      is_flag_enabled: {
        Args: { p_key: string; p_user_id: string | null }
        Returns: boolean
      }
      set_flag_enabled: {
        Args: { p_key: string; p_on: boolean }
        Returns: undefined
      }
      log_conversion: {
        Args: { p_kind: string }
        Returns: undefined
      }
      ensure_tag: {
        Args: { p_name: string }
        Returns: string
      }
      increment_api_usage: {
        Args: { p_key_id: string; p_window_hour: string }
        Returns: undefined
      }
      is_phone_verified: {
        Args: Record<string, never>
        Returns: boolean
      }
      compute_level: {
        Args: { p_xp: number }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
