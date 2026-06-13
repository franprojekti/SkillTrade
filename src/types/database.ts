export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          years_experience: number | null;
          location_country: string | null;
          location_city: string | null;
          location_area: string | null;
          connection_preference: "in-person" | "online" | "both";
          is_active: boolean;
          onboarding_completed: boolean;
          last_matches_viewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          years_experience?: number | null;
          location_country?: string | null;
          location_city?: string | null;
          location_area?: string | null;
          connection_preference?: "in-person" | "online" | "both";
          is_active?: boolean;
          onboarding_completed?: boolean;
          last_matches_viewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          bio?: string | null;
          years_experience?: number | null;
          location_country?: string | null;
          location_city?: string | null;
          location_area?: string | null;
          connection_preference?: "in-person" | "online" | "both";
          is_active?: boolean;
          onboarding_completed?: boolean;
          last_matches_viewed_at?: string | null;
          updated_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          canonical_name: string;
          slug: string;
          category: string;
          aliases: string[];
          status: "active" | "pending_review";
          created_at: string;
        };
        Insert: {
          id?: string;
          canonical_name: string;
          slug: string;
          category: string;
          aliases?: string[];
          status?: "active" | "pending_review";
          created_at?: string;
        };
        Update: {
          canonical_name?: string;
          slug?: string;
          category?: string;
          aliases?: string[];
          status?: "active" | "pending_review";
        };
      };
      user_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          skill_type: "offered" | "wanted";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          skill_type: "offered" | "wanted";
          created_at?: string;
        };
        Update: never;
      };
      skill_suggestions: {
        Row: {
          id: string;
          suggested_by: string | null;
          raw_name: string;
          category: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          suggested_by?: string | null;
          raw_name: string;
          category?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "approved" | "rejected";
        };
      };
      connection_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: "pending" | "accepted" | "declined" | "cancelled";
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "declined" | "cancelled";
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          connection_request_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          connection_request_id: string;
          created_at?: string;
        };
        Update: never;
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
        };
        Update: never;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      skill_exchanges: {
        Row: {
          id: string;
          teacher_id: string;
          learner_id: string;
          skill_id: string;
          connection_request_id: string;
          status: "active" | "completed";
          started_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          learner_id: string;
          skill_id: string;
          connection_request_id: string;
          status?: "active" | "completed";
          started_at?: string;
          created_at?: string;
        };
        Update: {
          status?: "active" | "completed";
        };
      };
      bookmarks: {
        Row: {
          user_id: string;
          bookmarked_user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          bookmarked_user_id: string;
          created_at?: string;
        };
        Update: never;
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: never;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          details?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "connection_request" | "request_accepted" | "new_message";
          payload: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "connection_request" | "request_accepted" | "new_message";
          payload?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_matches: {
        Args: { p_user_id: string };
        Returns: {
          out_user_id: string;
          out_username: string;
          out_display_name: string | null;
          out_bio: string | null;
          out_years_experience: number | null;
          out_score: number;
          out_location_city: string | null;
          out_location_area: string | null;
          out_connection_pref: string;
          out_they_offer_wanted: string[];
          out_i_offer_wanted: string[];
          out_updated_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Skill = Database["public"]["Tables"]["skills"]["Row"];
