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
      hero_banners: {
        Row: {
          id: string
          image_url: string
          title_bn: string
          title_en: string
          subtitle_bn: string | null
          subtitle_en: string | null
          link: string | null
          order_index: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_url: string
          title_bn: string
          title_en: string
          subtitle_bn?: string | null
          subtitle_en?: string | null
          link?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          title_bn?: string
          title_en?: string
          subtitle_bn?: string | null
          subtitle_en?: string | null
          link?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description_bn: string | null
          description_en: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      affiliate_campaigns: {
        Row: {
          affiliate_id: string
          clicks: number | null
          conversions: number | null
          created_at: string
          earnings: number | null
          id: string
          name_bn: string
          name_en: string
          status: string | null
          url: string
        }
        Insert: {
          affiliate_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          earnings?: number | null
          id?: string
          name_bn: string
          name_en: string
          status?: string | null
          url: string
        }
        Update: {
          affiliate_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          earnings?: number | null
          id?: string
          name_bn?: string
          name_en?: string
          status?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_campaigns_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          id: string
          ip_address: string | null
          referrer_url: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referrer_url?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referrer_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          paid_commission: number | null
          payment_details: string | null
          payment_method: string
          website_url: string | null
          marketing_plan: string | null
          pending_commission: number | null
          referral_code: string
          status: Database["public"]["Enums"]["affiliate_status"]
          tier: string | null
          total_clicks: number | null
          total_commission: number | null
          total_sales: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          paid_commission?: number | null
          payment_details?: string | null
          payment_method?: string
          website_url?: string | null
          marketing_plan?: string | null
          pending_commission?: number | null
          referral_code: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          tier?: string | null
          total_clicks?: number | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          paid_commission?: number | null
          payment_details?: string | null
          payment_method?: string
          website_url?: string | null
          marketing_plan?: string | null
          pending_commission?: number | null
          referral_code?: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          tier?: string | null
          total_clicks?: number | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          name_bn: string
          name_en: string
          slug: string | null
          updated_at: string
          visible_in_search: boolean | null
          visible_on_website: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name_bn: string
          name_en: string
          slug?: string | null
          updated_at?: string
          visible_in_search?: boolean | null
          visible_on_website?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name_bn?: string
          name_en?: string
          slug?: string | null
          updated_at?: string
          visible_in_search?: boolean | null
          visible_on_website?: boolean | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name_bn: string
          name_en: string
          parent_id: string | null
          slug: string | null
          sort_order: number | null
          updated_at: string | null
          visible_in_search: boolean | null
          visible_on_website: boolean | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name_bn: string
          name_en: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          visible_in_search?: boolean | null
          visible_on_website?: boolean | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name_bn?: string
          name_en?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          visible_in_search?: boolean | null
          visible_on_website?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          category_id: string | null
          commission_type: string
          commission_value: number
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          min_order_amount: number | null
          name_bn: string
          name_en: string
          priority: number | null
          rule_type: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          commission_type?: string
          commission_value?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          name_bn: string
          name_en: string
          priority?: number | null
          rule_type: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          commission_type?: string
          commission_value?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          name_bn?: string
          name_en?: string
          priority?: number | null
          rule_type?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          affiliate_id: string
          amount: number
          commission_type: string
          created_at: string
          id: string
          order_id: string | null
          status: Database["public"]["Enums"]["commission_status"]
        }
        Insert: {
          affiliate_id: string
          amount: number
          commission_type?: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_type?: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_amount: number | null
          name_bn: string
          name_en: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          name_bn: string
          name_en: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          name_bn?: string
          name_en?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name_bn: string
          product_name_en: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name_bn: string
          product_name_en: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name_bn?: string
          product_name_en?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          affiliate_id: string | null
          city: string
          coupon_code: string | null
          courier: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_charge: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          discount_amount: number | null
          district: string
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_address: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          delivery_fee_transaction_id: string | null
          affiliate_referral_code: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id?: string | null
          city: string
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_charge?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          discount_amount?: number | null
          district: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          delivery_fee_transaction_id?: string | null
          affiliate_referral_code?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string | null
          city?: string
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_charge?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          discount_amount?: number | null
          district?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          delivery_fee_transaction_id?: string | null
          affiliate_referral_code?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name_bn: string
          name_en: string
          price: number | null
          product_id: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_bn: string
          name_en: string
          price?: number | null
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_bn?: string
          name_en?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_activity_log: {
        Row: {
          action_type: string
          changed_at: string | null
          changed_by: string | null
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          product_id: string | null
        }
        Insert: {
          action_type: string
          changed_at?: string | null
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          product_id?: string | null
        }
        Update: {
          action_type?: string
          changed_at?: string | null
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_activity_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          order_id: string | null
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          order_id?: string | null
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          order_id?: string | null
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description_bn: string | null
          description_en: string | null
          discount_percent: number | null
          discount_type: string | null
          discount_value: number | null
          has_variants: boolean
          variant_options: Json | null
          id: string
          gallery_images: Json | null
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          name_bn: string
          name_en: string
          original_price: number | null
          price: number
          product_status: string | null
          rating: number | null
          reviews_count: number | null
          sku: string | null
          stock: number
          updated_at: string
          updated_by: string | null
          visible_in_search: boolean | null
          visible_on_website: boolean | null
        }
        Insert: {
          brand?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_bn?: string | null
          description_en?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          discount_value?: number | null
          has_variants?: boolean
          id?: string
          gallery_images?: Json | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name_bn: string
          name_en: string
          original_price?: number | null
          price: number
          product_status?: string | null
          rating?: number | null
          reviews_count?: number | null
          sku?: string | null
          stock?: number
          updated_at?: string
          updated_by?: string | null
          visible_in_search?: boolean | null
          visible_on_website?: boolean | null
        }
        Update: {
          brand?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_bn?: string | null
          description_en?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          discount_value?: number | null
          has_variants?: boolean
          id?: string
          gallery_images?: Json | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name_bn?: string
          name_en?: string
          original_price?: number | null
          price?: number
          product_status?: string | null
          rating?: number | null
          reviews_count?: number | null
          sku?: string | null
          stock?: number
          updated_at?: string
          updated_by?: string | null
          visible_in_search?: boolean | null
          visible_on_website?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          district: string | null
          email: string | null
          id: string
          is_blocked: boolean | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      brand_has_products: { Args: { brand_uuid: string }; Returns: boolean }
      category_has_products: {
        Args: { category_uuid: string }
        Returns: boolean
      }
      count_category_products: {
        Args: { category_uuid: string }
        Returns: number
      }
      get_my_affiliate_id: { Args: never; Returns: string }
      get_my_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_affiliate_clicks: {
        Args: { aff_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      affiliate_status: "pending" | "active" | "inactive"
      app_role: "customer" | "affiliate" | "admin"
      commission_status: "pending" | "approved" | "paid"
      delivery_type: "inside_city" | "outside_city"
      order_status:
      | "pending"
      | "processing"
      | "shipped"
      | "delivered"
      | "returned"
      | "cancelled"
      payment_method: "cod" | "online"
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
      affiliate_status: ["pending", "active", "inactive"],
      app_role: ["customer", "affiliate", "admin"],
      commission_status: ["pending", "approved", "paid"],
      delivery_type: ["inside_city", "outside_city"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "returned",
        "cancelled",
      ],
      payment_method: ["cod", "online"],
    },
  },
} as const
