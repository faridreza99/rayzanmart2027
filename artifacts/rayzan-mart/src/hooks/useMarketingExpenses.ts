import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketingExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  created_at: string;
}

export const useMarketingExpenses = () => {
  return useQuery({
    queryKey: ["marketing-expenses"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("marketing_expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as MarketingExpense[];
    },
  });
};

export const useAddMarketingExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<MarketingExpense, "id" | "created_at">) => {
      const { data, error } = await (supabase as any)
        .from("marketing_expenses")
        .insert(expense)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-expenses"] });
      toast.success("Marketing expense added successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to add expense: " + error.message);
    },
  });
};

export const useUpdateMarketingExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Partial<MarketingExpense> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("marketing_expenses")
        .update(expense)
        .eq("id", expense.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-expenses"] });
      toast.success("Marketing expense updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update expense: " + error.message);
    },
  });
};

export const useDeleteMarketingExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("marketing_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-expenses"] });
      toast.success("Marketing expense deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete expense: " + error.message);
    },
  });
};

export const useProfitLossData = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ["profit-loss", startDate, endDate],
    queryFn: async () => {
      let query = (supabase as any).from("vw_profit_loss").select("*");
      
      if (startDate) query = query.gte("order_date", startDate);
      if (endDate) query = query.lte("order_date", endDate);

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};
