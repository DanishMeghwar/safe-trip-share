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
      bookings: {
        Row: {
          created_at: string | null
          id: string
          passenger_id: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location: string | null
          ride_id: string
          seats_requested: number
          status: Database["public"]["Enums"]["booking_status"] | null
          total_fare: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          passenger_id: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string | null
          ride_id: string
          seats_requested: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_fare: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          passenger_id?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string | null
          ride_id?: string
          seats_requested?: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_fare?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string | null
          driver_id: string
          id: string
          is_verified: boolean | null
          license_expiry: string
          license_image_url: string | null
          license_number: string
          updated_at: string | null
          vehicle_registration_url: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: string
          is_verified?: boolean | null
          license_expiry: string
          license_image_url?: string | null
          license_number: string
          updated_at?: string | null
          vehicle_registration_url?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: string
          is_verified?: boolean | null
          license_expiry?: string
          license_image_url?: string | null
          license_number?: string
          updated_at?: string | null
          vehicle_registration_url?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          contact_name: string
          contact_phone: string
          created_at: string | null
          id: string
          relationship: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_name: string
          contact_phone: string
          created_at?: string | null
          id?: string
          relationship?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          created_at?: string | null
          id?: string
          relationship?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      live_locations: {
        Row: {
          accuracy: number | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          ride_id: string
          speed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          ride_id: string
          speed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          ride_id?: string
          speed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_locations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_updates: boolean | null
          chat_messages: boolean | null
          created_at: string | null
          id: string
          location_sharing: boolean | null
          ride_reminders: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_updates?: boolean | null
          chat_messages?: boolean | null
          created_at?: string | null
          id?: string
          location_sharing?: boolean | null
          ride_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_updates?: boolean | null
          chat_messages?: boolean | null
          created_at?: string | null
          id?: string
          location_sharing?: boolean | null
          ride_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cnic: string | null
          created_at: string | null
          full_name: string
          id: string
          is_cnic_verified: boolean | null
          is_phone_verified: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cnic?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_cnic_verified?: boolean | null
          is_phone_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cnic?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_cnic_verified?: boolean | null
          is_phone_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          available_seats: number
          created_at: string | null
          departure_time: string
          driver_id: string
          estimated_duration_minutes: number | null
          fare_per_seat: number
          from_lat: number | null
          from_lng: number | null
          from_location: string
          id: string
          notes: string | null
          route_distance_km: number | null
          status: Database["public"]["Enums"]["ride_status"] | null
          to_lat: number | null
          to_lng: number | null
          to_location: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          available_seats: number
          created_at?: string | null
          departure_time: string
          driver_id: string
          estimated_duration_minutes?: number | null
          fare_per_seat: number
          from_lat?: number | null
          from_lng?: number | null
          from_location: string
          id?: string
          notes?: string | null
          route_distance_km?: number | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          to_lat?: number | null
          to_lng?: number | null
          to_location: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          available_seats?: number
          created_at?: string | null
          departure_time?: string
          driver_id?: string
          estimated_duration_minutes?: number | null
          fare_per_seat?: number
          from_lat?: number | null
          from_lng?: number | null
          from_location?: string
          id?: string
          notes?: string | null
          route_distance_km?: number | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          to_lat?: number | null
          to_lng?: number | null
          to_location?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string
          created_at: string | null
          driver_id: string
          id: string
          is_verified: boolean | null
          make: string
          model: string
          plate_number: string
          seats_available: number
          updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year: number
        }
        Insert: {
          color: string
          created_at?: string | null
          driver_id: string
          id?: string
          is_verified?: boolean | null
          make: string
          model: string
          plate_number: string
          seats_available: number
          updated_at?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year: number
        }
        Update: {
          color?: string
          created_at?: string | null
          driver_id?: string
          id?: string
          is_verified?: boolean | null
          make?: string
          model?: string
          plate_number?: string
          seats_available?: number
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "completed"
        | "cancelled"
      ride_status: "scheduled" | "active" | "completed" | "cancelled"
      user_role: "driver" | "passenger" | "admin"
      vehicle_type: "sedan" | "suv" | "hatchback" | "van" | "motorcycle"
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
      booking_status: [
        "pending",
        "confirmed",
        "rejected",
        "completed",
        "cancelled",
      ],
      ride_status: ["scheduled", "active", "completed", "cancelled"],
      user_role: ["driver", "passenger", "admin"],
      vehicle_type: ["sedan", "suv", "hatchback", "van", "motorcycle"],
    },
  },
} as const
