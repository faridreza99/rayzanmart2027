import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { generateReferralCode } from "@/lib/supabase-helpers";

export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  payment_method: string;
  payment_details: string | null;
  website_url: string | null;
  marketing_plan: string | null;
  status: "pending" | "active" | "inactive" | "approved" | "rejected";
  commission_rate: number;
  tier: string;
  total_clicks: number;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  created_at: string;
}

export interface AffiliateCampaign {
  id: string;
  affiliate_id: string;
  name_bn: string;
  name_en: string;
  url: string;
  status: string;
  clicks: number;
  conversions: number;
  earnings: number;
  created_at: string;
}

export interface Commission {
  id: string;
  affiliate_id: string;
  order_id: string | null;
  amount: number;
  commission_type: string;
  status: "pending" | "approved" | "paid" | "rejected";
  created_at: string;
  orders?: {
    order_number: string;
  };
  product_id?: string;
  product_name_bn?: string;
  product_name_en?: string;
  product_price?: number;
}

export const useMyAffiliate = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["affiliate", "my", user?.id],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("affiliates")
        .select("*")
        .eq("user_id", user?.id)
        .limit(1);

      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as Affiliate | null ?? null;
    },
    enabled: !!user,
  });
};

export const useAllAffiliates = () => {
  return useQuery({
    queryKey: ["affiliates", "all"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("affiliates")
        .select("*, profiles(name,email,phone)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as (Affiliate & { profiles: { name: string; email: string; phone?: string } | null })[];
    },
  });
};

export const useMyCampaigns = () => {
  const { data: affiliate } = useMyAffiliate();

  return useQuery({
    queryKey: ["campaigns", "my", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("affiliate_campaigns")
        .select("*")
        .eq("affiliate_id", affiliate?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AffiliateCampaign[];
    },
    enabled: !!affiliate,
  });
};

export const useMyCommissions = () => {
  const { data: affiliate } = useMyAffiliate();

  return useQuery({
    queryKey: ["commissions", "my", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("commissions")
        .select("*, orders(order_number)")
        .eq("affiliate_id", affiliate?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Commission[];
    },
    enabled: !!affiliate,
  });
};

export const useCreateAffiliate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      paymentMethod,
      paymentDetails,
      phone,
      websiteUrl,
      marketingPlan,
    }: {
      paymentMethod: string;
      paymentDetails: string;
      phone?: string;
      websiteUrl?: string;
      marketingPlan?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const referralCode = generateReferralCode(user.name);

      const { data, error } = await apiClient
        .from("affiliates")
        .insert({
          user_id: user.id,
          referral_code: referralCode,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          website_url: websiteUrl,
          marketing_plan: marketingPlan,
          status: "pending",
        })
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (phone) {
        await apiClient
          .from("profiles")
          .update({ phone })
          .eq("user_id", user.id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
    },
  });
};

export const useUpdateAffiliateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      affiliateId,
      status,
    }: {
      affiliateId: string;
      status: "pending" | "active" | "inactive" | "approved" | "rejected";
    }) => {
      const { error } = await apiClient
        .from("affiliates")
        .update({ status })
        .eq("id", affiliateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
    },
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  const { data: affiliate } = useMyAffiliate();

  return useMutation({
    mutationFn: async ({
      nameBn,
      nameEn,
      utmSource,
      productUrl,
    }: {
      nameBn: string;
      nameEn: string;
      utmSource: string;
      productUrl?: string;
    }) => {
      if (!affiliate) throw new Error("Affiliate not found");

      const url = productUrl || `${window.location.origin}/?ref=${affiliate.referral_code}&utm_source=${utmSource}`;

      const { data, error } = await apiClient
        .from("affiliate_campaigns")
        .insert({
          affiliate_id: affiliate.id,
          name_bn: nameBn,
          name_en: nameEn,
          url,
          status: "active",
        })
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};
