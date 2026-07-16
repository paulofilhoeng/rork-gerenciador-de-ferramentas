/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          site_id: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          site_id?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          site_id?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          alert_days_before: number | null
          id: number
          notifications_enabled: boolean | null
        }
        Insert: {
          alert_days_before?: number | null
          id?: number
          notifications_enabled?: boolean | null
        }
        Update: {
          alert_days_before?: number | null
          id?: number
          notifications_enabled?: boolean | null
        }
        Relationships: []
      }
      audit_records: {
        Row: {
          audit_date: string | null
          damage_description: string | null
          id: string
          next_audit_date: string | null
          status: string
          tool_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          audit_date?: string | null
          damage_description?: string | null
          id?: string
          next_audit_date?: string | null
          status: string
          tool_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          audit_date?: string | null
          damage_description?: string | null
          id?: string
          next_audit_date?: string | null
          status?: string
          tool_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_records_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_sites: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          responsible_name: string | null
          responsible_phone: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          start_date?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          level: string | null
          name: string
          phone: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          level?: string | null
          name: string
          phone?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          level?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          id: string
          invoice_attachment_id: string | null
          invoice_number: string | null
          repair_cost: number | null
          return_date: string | null
          start_date: string | null
          status: string
          tool_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          id?: string
          invoice_attachment_id?: string | null
          invoice_number?: string | null
          repair_cost?: number | null
          return_date?: string | null
          start_date?: string | null
          status?: string
          tool_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          id?: string
          invoice_attachment_id?: string | null
          invoice_number?: string | null
          repair_cost?: number | null
          return_date?: string | null
          start_date?: string | null
          status?: string
          tool_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_invoice_attachment_id_fkey"
            columns: ["invoice_attachment_id"]
            isOneToOne: false
            referencedRelation: "tool_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_types: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          email: string
          id: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rental_companies: {
        Row: {
          address: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      site_user_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          movement_type_id: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          movement_type_id: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          movement_type_id?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_user_permissions_movement_type_id_fkey"
            columns: ["movement_type_id"]
            isOneToOne: false
            referencedRelation: "movement_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_user_permissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_attachments: {
        Row: {
          caption: string | null
          created_at: string | null
          data_url: string
          id: string
          movement_id: string | null
          purpose: string
          tool_id: string
          type: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          data_url: string
          id?: string
          movement_id?: string | null
          purpose?: string
          tool_id: string
          type: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          data_url?: string
          id?: string
          movement_id?: string | null
          purpose?: string
          tool_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_attachments_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "tool_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_attachments_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_movements: {
        Row: {
          description: string | null
          id: string
          new_value: string | null
          old_value: string | null
          timestamp: string | null
          tool_id: string
          type: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          tool_id: string
          type: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          tool_id?: string
          type?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_movements_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          audit_frequency: string | null
          base_status: string
          brand: string | null
          created_at: string | null
          current_employee_id: string | null
          current_site_id: string | null
          daily_rental_cost: number | null
          id: string
          last_audit_date: string | null
          model: string | null
          name: string
          next_audit_date: string | null
          notes: string | null
          ownership: string
          purchase_date: string | null
          rental_company_id: string | null
          rental_end_date: string | null
          rental_start_date: string | null
          serial_number: string | null
          status_updated_at: string | null
        }
        Insert: {
          audit_frequency?: string | null
          base_status?: string
          brand?: string | null
          created_at?: string | null
          current_employee_id?: string | null
          current_site_id?: string | null
          daily_rental_cost?: number | null
          id?: string
          last_audit_date?: string | null
          model?: string | null
          name: string
          next_audit_date?: string | null
          notes?: string | null
          ownership?: string
          purchase_date?: string | null
          rental_company_id?: string | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          serial_number?: string | null
          status_updated_at?: string | null
        }
        Update: {
          audit_frequency?: string | null
          base_status?: string
          brand?: string | null
          created_at?: string | null
          current_employee_id?: string | null
          current_site_id?: string | null
          daily_rental_cost?: number | null
          id?: string
          last_audit_date?: string | null
          model?: string | null
          name?: string
          next_audit_date?: string | null
          notes?: string | null
          ownership?: string
          purchase_date?: string | null
          rental_company_id?: string | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          serial_number?: string | null
          status_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tools_current_employee_id_fkey"
            columns: ["current_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_current_site_id_fkey"
            columns: ["current_site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_rental_company_id_fkey"
            columns: ["rental_company_id"]
            isOneToOne: false
            referencedRelation: "rental_companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
