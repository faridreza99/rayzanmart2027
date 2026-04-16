import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfitLossData {
  order_date: string;
  category_name: string;
  total_sales: number;
  total_product_cost: number;
  total_delivery_cost: number;
  total_commissions: number;
  total_marketing_expense: number;
  net_profit: number;
  order_count: number;
}

export const useProfitLoss = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ["profit-loss", startDate, endDate],
    queryFn: async () => {
      let query = supabase.from("vw_profit_loss").select("*");

      if (startDate) {
        query = query.gte("order_date", startDate);
      }
      if (endDate) {
        query = query.lte("order_date", endDate);
      }

      const { data, error } = await query.order("order_date", { ascending: false });

      if (error) throw error;
      return (data as unknown) as ProfitLossData[];
    },
  });
};
