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
      assessments: {
        Row: {
          aiml: string | null
          aml_functions: string[] | null
          aml_status: string | null
          audit: string | null
          auto_close: string | null
          bia_status: string | null
          biggest_concern: string | null
          budget_status: string | null
          bvn_status: string | null
          cbn_risk: string | null
          channels: string[] | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          contact_role: string
          core_integ: string | null
          cov_audit: string | null
          cov_case: string | null
          cov_cdd: string | null
          cov_fraud: string | null
          cov_reporting: string | null
          cov_risk: string | null
          cov_sanctions: string | null
          cov_security: string | null
          cov_txmon: string | null
          created_at: string
          cust_base: string | null
          data_sov: string | null
          encryption: string | null
          extra_context: string | null
          fraud_capab: string | null
          fraud_feed: string | null
          geo: string | null
          gov_bvn: string | null
          gov_change: string | null
          gov_framework: string | null
          gov_mlro: string | null
          gov_model: string | null
          gov_policy: string | null
          gov_retention: string | null
          gov_sla: string | null
          gov_training: string | null
          gov_vendor: string | null
          governance: Json | null
          group_structure: string | null
          id: string
          impl_approach: string | null
          inst_name: string
          inst_type: string
          kyc_review: string | null
          mfa: string | null
          products: string[] | null
          regulatory_context: string | null
          report_approval: string | null
          reporting_method: string | null
          risk_factors: string[] | null
          roadmap_status: string | null
          sanction_lists: string[] | null
          sanctions_capab: string | null
          support: string[] | null
          tech_capacity: string | null
          tx_vol: string | null
          ubo_map: string | null
          vendor_status: string | null
        }
        Insert: {
          aiml?: string | null
          aml_functions?: string[] | null
          aml_status?: string | null
          audit?: string | null
          auto_close?: string | null
          bia_status?: string | null
          biggest_concern?: string | null
          budget_status?: string | null
          bvn_status?: string | null
          cbn_risk?: string | null
          channels?: string[] | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          contact_role: string
          core_integ?: string | null
          cov_audit?: string | null
          cov_case?: string | null
          cov_cdd?: string | null
          cov_fraud?: string | null
          cov_reporting?: string | null
          cov_risk?: string | null
          cov_sanctions?: string | null
          cov_security?: string | null
          cov_txmon?: string | null
          created_at?: string
          cust_base?: string | null
          data_sov?: string | null
          encryption?: string | null
          extra_context?: string | null
          fraud_capab?: string | null
          fraud_feed?: string | null
          geo?: string | null
          gov_bvn?: string | null
          gov_change?: string | null
          gov_framework?: string | null
          gov_mlro?: string | null
          gov_model?: string | null
          gov_policy?: string | null
          gov_retention?: string | null
          gov_sla?: string | null
          gov_training?: string | null
          gov_vendor?: string | null
          governance?: Json | null
          group_structure?: string | null
          id?: string
          impl_approach?: string | null
          inst_name: string
          inst_type: string
          kyc_review?: string | null
          mfa?: string | null
          products?: string[] | null
          regulatory_context?: string | null
          report_approval?: string | null
          reporting_method?: string | null
          risk_factors?: string[] | null
          roadmap_status?: string | null
          sanction_lists?: string[] | null
          sanctions_capab?: string | null
          support?: string[] | null
          tech_capacity?: string | null
          tx_vol?: string | null
          ubo_map?: string | null
          vendor_status?: string | null
        }
        Update: {
          aiml?: string | null
          aml_functions?: string[] | null
          aml_status?: string | null
          audit?: string | null
          auto_close?: string | null
          bia_status?: string | null
          biggest_concern?: string | null
          budget_status?: string | null
          bvn_status?: string | null
          cbn_risk?: string | null
          channels?: string[] | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          contact_role?: string
          core_integ?: string | null
          cov_audit?: string | null
          cov_case?: string | null
          cov_cdd?: string | null
          cov_fraud?: string | null
          cov_reporting?: string | null
          cov_risk?: string | null
          cov_sanctions?: string | null
          cov_security?: string | null
          cov_txmon?: string | null
          created_at?: string
          cust_base?: string | null
          data_sov?: string | null
          encryption?: string | null
          extra_context?: string | null
          fraud_capab?: string | null
          fraud_feed?: string | null
          geo?: string | null
          gov_bvn?: string | null
          gov_change?: string | null
          gov_framework?: string | null
          gov_mlro?: string | null
          gov_model?: string | null
          gov_policy?: string | null
          gov_retention?: string | null
          gov_sla?: string | null
          gov_training?: string | null
          gov_vendor?: string | null
          governance?: Json | null
          group_structure?: string | null
          id?: string
          impl_approach?: string | null
          inst_name?: string
          inst_type?: string
          kyc_review?: string | null
          mfa?: string | null
          products?: string[] | null
          regulatory_context?: string | null
          report_approval?: string | null
          reporting_method?: string | null
          risk_factors?: string[] | null
          roadmap_status?: string | null
          sanction_lists?: string[] | null
          sanctions_capab?: string | null
          support?: string[] | null
          tech_capacity?: string | null
          tx_vol?: string | null
          ubo_map?: string | null
          vendor_status?: string | null
        }
        Relationships: []
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
