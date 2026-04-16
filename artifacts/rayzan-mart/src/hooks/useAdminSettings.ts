import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FooterPagesSettings } from "@/lib/footer-pages";

export interface SiteSettings {
  site_name: { bn: string; en: string };
  site_logo: { url: string };
  modules: { affiliate: boolean; coupons: boolean; demo_mode: boolean };
  delivery_charges: { inside_city: number; outside_city: number };
  delivery_fee_payment: {
    bkash_number: string;
    instructions_bn: string;
    instructions_en: string;
  };
  payment_settings: {
    bkash_number: string;
    nagad_number: string;
    instructions_bn: string;
    instructions_en: string;
  };
  flash_sale: { is_active: boolean; end_time: string };
  footer_pages: FooterPagesSettings;
  footer_tagline: {
    bn: string;
    en: string;
  };
  contact_info: {
    phone: string;
    email: string;
    address_bn: string;
    address_en: string;
  };
  social_links: {
    facebook: string;
    instagram: string;
    youtube: string;
  };
  loyalty_rules: {
    enabled: boolean;
    earn_ratio: number;
    redeem_ratio: number;
    min_redeem_points: number;
    max_redeem_percentage: number;
    points_validity_days: number;
  };
}

export interface CommissionRule {
  id: string;
  rule_type: "global" | "category" | "campaign" | "product";
  name_bn: string;
  name_en: string;
  commission_type: "percentage" | "fixed";
  commission_value: number;
  min_order_amount: number | null;
  category_id: string | null;
  product_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  created_at: string;
}

export interface HeroBanner {
  id: string;
  image_url: string;
  title_bn: string;
  title_en: string;
  subtitle_bn: string | null;
  subtitle_en: string | null;
  link: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  description_bn: string | null;
  description_en: string | null;
  created_at: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      const settings: Partial<SiteSettings> = {};
      data?.forEach((row: any) => {
        settings[row.setting_key as keyof SiteSettings] = row.setting_value;
      });

      return settings as SiteSettings;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { setting_key: key, setting_value: value },
          { onConflict: "setting_key" },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};

export const useCommissionRules = () => {
  return useQuery({
    queryKey: ["commission-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_rules")
        .select("*")
        .order("priority", { ascending: false });

      return (data as unknown) as CommissionRule[];
    },
  });
};

export const useCreateCommissionRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<CommissionRule, "id" | "created_at">) => {
      const { error } = await supabase
        .from("commission_rules")
        .insert(rule);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
    },
  });
};

export const useUpdateCommissionRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissionRule> & { id: string }) => {
      const { error } = await supabase
        .from("commission_rules")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
    },
  });
};

export const useAuditLogs = () => {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
};

export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<AuditLogEntry, "id" | "created_at">) => {
      const { error } = await supabase
        .from("admin_audit_log")
        .insert(entry);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
};

export const useAllProfiles = () => {
  return useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Failed to load user roles for profile list:", rolesError);
      }

      // Fetch email_confirmed status from admin endpoint
      let emailStatusByUserId = new Map<string, boolean>();
      try {
        const token = localStorage.getItem("rm_auth_token");
        const emailRes = await fetch("/api/auth/admin/users-email-status", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (emailRes.ok) {
          const emailData = await emailRes.json();
          (emailData || []).forEach((u: any) => {
            emailStatusByUserId.set(u.user_id, u.email_confirmed);
          });
        }
      } catch {
        // ignore — email_confirmed won't show
      }

      const rolesByUserId = new Map<string, Array<{ role: string }>>();
      (roles || []).forEach((r: any) => {
        const existing = rolesByUserId.get(r.user_id) || [];
        existing.push({ role: r.role });
        rolesByUserId.set(r.user_id, existing);
      });

      return (profiles || []).map((profile: any) => ({
        ...profile,
        user_roles: rolesByUserId.get(profile.user_id) || [],
        email_confirmed: emailStatusByUserId.get(profile.user_id) ?? null,
      }));
    },
  });
};

export const useAdminConfirmEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const token = localStorage.getItem("rm_auth_token");
      const res = await fetch("/api/auth/admin/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["all-profiles"] }); },
  });
};

export const useAdminResendVerification = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const token = localStorage.getItem("rm_auth_token");
      const res = await fetch("/api/auth/admin/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "customer" | "affiliate" | "admin" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
    },
  });
};

export const useUpdateOrderNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ notes })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useHeroBanners = () => {
  return useQuery({
    queryKey: ["hero-banners", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as HeroBanner[];
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
};

export const useAllHeroBanners = () => {
  return useQuery({
    queryKey: ["hero-banners", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as HeroBanner[];
    },
  });
};

export const useCreateHeroBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: Omit<HeroBanner, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("hero_banners")
        .insert(banner);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
    },
  });
};

export const useUpdateHeroBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HeroBanner> & { id: string }) => {
      const { error } = await supabase
        .from("hero_banners")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
    },
  });
};

export const useDeleteHeroBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hero_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
    },
  });
};
