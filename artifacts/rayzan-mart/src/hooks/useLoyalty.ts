import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  points: number;
  type: 'earn' | 'redeem' | 'refund' | 'expire';
  amount: number;
  description_bn: string;
  description_en: string;
  created_at: string;
  expires_at: string | null;
}

export const useLoyaltyTransactions = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  return useQuery({
    queryKey: ["loyalty-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await (supabase as any).from("loyalty_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((t: any) => ({
        ...t,
        description: language === "bn" ? t.description_bn : t.description_en
      })) as (LoyaltyTransaction & { description: string })[];
    },
    enabled: !!user,
  });
};
