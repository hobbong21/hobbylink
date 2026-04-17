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
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
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
      }
      tags: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>
      }
      post_tags: {
        Row: { post_id: string; tag_id: string }
        Insert: { post_id: string; tag_id: string }
        Update: never
      }
      event_tags: {
        Row: { event_id: string; tag_id: string }
        Insert: { event_id: string; tag_id: string }
        Update: never
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
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["event_photos"]["Insert"]>
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: "registered" | "attended" | "cancelled"
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: "registered" | "attended" | "cancelled"
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["event_participants"]["Insert"]>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
