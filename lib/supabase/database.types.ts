export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      content_item_tags: {
        Row: {
          content_item_id: string
          tag_slug: string
        }
        Insert: {
          content_item_id: string
          tag_slug: string
        }
        Update: {
          content_item_id?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_item_tags_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_tags_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["slug"]
          },
        ]
      }
      content_items: {
        Row: {
          body: string | null
          created_at: string
          excerpt: string | null
          hero_image_url: string | null
          id: string
          mentor_id: string
          published_at: string | null
          slug: string
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          body?: string | null
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          mentor_id: string
          published_at?: string | null
          slug: string
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          body?: string | null
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          mentor_id?: string
          published_at?: string | null
          slug?: string
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_items_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      content_resources: {
        Row: {
          content_item_id: string
          created_at: string
          file_path: string
          file_size_bytes: number
          id: string
          label: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          file_path: string
          file_size_bytes: number
          id?: string
          label: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          file_path?: string
          file_size_bytes?: number
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_resources_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          label: string
          slug: string
        }
        Insert: {
          label: string
          slug: string
        }
        Update: {
          label?: string
          slug?: string
        }
        Relationships: []
      }
      conversation_read_cursors: {
        Row: {
          conversation_id: string
          last_read_at: string
          profile_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          profile_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_read_cursors_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_read_cursors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant_one: string
          participant_two: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_one: string
          participant_two: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_one?: string
          participant_two?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_one_fkey"
            columns: ["participant_one"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_two_fkey"
            columns: ["participant_two"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          description: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_anonymous: boolean
          parent_post_id: string | null
          thread_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_anonymous?: boolean
          parent_post_id?: string | null
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_anonymous?: boolean
          parent_post_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reactions: {
        Row: {
          created_at: string
          post_id: string
          profile_id: string
          reaction: Database["public"]["Enums"]["reaction_type"]
        }
        Insert: {
          created_at?: string
          post_id: string
          profile_id: string
          reaction: Database["public"]["Enums"]["reaction_type"]
        }
        Update: {
          created_at?: string
          post_id?: string
          profile_id?: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "forum_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          body: string
          category_slug: string
          created_at: string
          deleted_at: string | null
          id: string
          is_anonymous: boolean
          last_activity_at: string
          locked: boolean
          pinned: boolean
          slug: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          body: string
          category_slug: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_anonymous?: boolean
          last_activity_at?: string
          locked?: boolean
          pinned?: boolean
          slug: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          body?: string
          category_slug?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_anonymous?: boolean
          last_activity_at?: string
          locked?: boolean
          pinned?: boolean
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      live_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          max_attendees: number | null
          meeting_url: string | null
          mentor_id: string
          recording_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attendees?: number | null
          meeting_url?: string | null
          mentor_id: string
          recording_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attendees?: number | null
          meeting_url?: string | null
          mentor_id?: string
          recording_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      mentor_follows: {
        Row: {
          created_at: string
          follower_id: string
          mentor_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          mentor_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          mentor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_follows_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      mentor_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_recommendations: {
        Row: {
          computed_at: string
          mentor_id: string
          profile_id: string
          rank: number
          reasoning: string | null
          score: number
        }
        Insert: {
          computed_at?: string
          mentor_id: string
          profile_id: string
          rank: number
          reasoning?: string | null
          score: number
        }
        Update: {
          computed_at?: string
          mentor_id?: string
          profile_id?: string
          rank?: number
          reasoning?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentor_recommendations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mentor_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          accepting_questions: boolean
          bio: string | null
          created_at: string
          current_position: string | null
          expertise: string[]
          headline: string | null
          hometown: string | null
          profile_id: string
          slug: string
          social_links: Json
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          accepting_questions?: boolean
          bio?: string | null
          created_at?: string
          current_position?: string | null
          expertise?: string[]
          headline?: string | null
          hometown?: string | null
          profile_id: string
          slug: string
          social_links?: Json
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          accepting_questions?: boolean
          bio?: string | null
          created_at?: string
          current_position?: string | null
          expertise?: string[]
          headline?: string | null
          hometown?: string | null
          profile_id?: string
          slug?: string
          social_links?: Json
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_enabled: boolean
          in_app_enabled: boolean
          profile_id: string
          types_muted: Database["public"]["Enums"]["notification_type"][]
          updated_at: string
        }
        Insert: {
          email_enabled?: boolean
          in_app_enabled?: boolean
          profile_id: string
          types_muted?: Database["public"]["Enums"]["notification_type"][]
          updated_at?: string
        }
        Update: {
          email_enabled?: boolean
          in_app_enabled?: boolean
          profile_id?: string
          types_muted?: Database["public"]["Enums"]["notification_type"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_responses: {
        Row: {
          challenges: string[]
          created_at: string
          fields_of_interest: string[]
          goals: string[]
          profile_id: string
          updated_at: string
        }
        Insert: {
          challenges?: string[]
          created_at?: string
          fields_of_interest?: string[]
          goals?: string[]
          profile_id: string
          updated_at?: string
        }
        Update: {
          challenges?: string[]
          created_at?: string
          fields_of_interest?: string[]
          goals?: string[]
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_responses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_of_origin: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarded_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          university: string | null
          updated_at: string
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          country_of_origin?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarded_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          university?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          country_of_origin?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarded_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          university?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_context: string | null
          author_name: string
          avatar_url: string | null
          content: string
          created_at: string
          display_order: number
          id: string
          published: boolean
          rating: number
          updated_at: string
        }
        Insert: {
          author_context?: string | null
          author_name: string
          avatar_url?: string | null
          content: string
          created_at?: string
          display_order?: number
          id?: string
          published?: boolean
          rating: number
          updated_at?: string
        }
        Update: {
          author_context?: string | null
          author_name?: string
          avatar_url?: string | null
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          published?: boolean
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      session_questions: {
        Row: {
          anonymous: boolean
          answered: boolean
          body: string
          created_at: string
          id: string
          profile_id: string
          session_id: string
        }
        Insert: {
          anonymous?: boolean
          answered?: boolean
          body: string
          created_at?: string
          id?: string
          profile_id: string
          session_id: string
        }
        Update: {
          anonymous?: boolean
          answered?: boolean
          body?: string
          created_at?: string
          id?: string
          profile_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_questions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          attended: boolean
          profile_id: string
          registered_at: string
          session_id: string
        }
        Insert: {
          attended?: boolean
          profile_id: string
          registered_at?: string
          session_id: string
        }
        Update: {
          attended?: boolean
          profile_id?: string
          registered_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      success_stories: {
        Row: {
          author_id: string
          body: string
          created_at: string
          featured: boolean
          hero_image_url: string | null
          id: string
          milestones: string[]
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["story_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          milestones?: string[]
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["story_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          milestones?: string[]
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["story_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_stories_author_id_fkey"
            columns: ["author_id"]
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
      bump_thread_view: { Args: { thread_slug: string }; Returns: undefined }
      can_chat: { Args: { user_a: string; user_b: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { conv_id: string }
        Returns: boolean
      }
      is_mentor: { Args: never; Returns: boolean }
    }
    Enums: {
      content_type: "article" | "video" | "resource"
      notification_type:
        | "mentor_replied_to_your_question"
        | "new_content_from_mentor_you_follow"
        | "forum_reply_to_your_thread"
        | "session_reminder_24h"
        | "session_starting_soon"
        | "success_story_approved"
        | "new_chat_message"
      reaction_type: "heart" | "thanks" | "helpful" | "insightful"
      session_status: "scheduled" | "live" | "completed" | "cancelled"
      story_status: "draft" | "pending" | "published" | "rejected"
      user_role: "student" | "mentor" | "admin"
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
      content_type: ["article", "video", "resource"],
      notification_type: [
        "mentor_replied_to_your_question",
        "new_content_from_mentor_you_follow",
        "forum_reply_to_your_thread",
        "session_reminder_24h",
        "session_starting_soon",
        "success_story_approved",
        "new_chat_message",
      ],
      reaction_type: ["heart", "thanks", "helpful", "insightful"],
      session_status: ["scheduled", "live", "completed", "cancelled"],
      story_status: ["draft", "pending", "published", "rejected"],
      user_role: ["student", "mentor", "admin"],
    },
  },
} as const

