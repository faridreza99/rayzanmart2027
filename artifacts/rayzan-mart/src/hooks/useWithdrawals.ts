import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyAffiliate } from "./useAffiliate";

export interface Withdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  method: "bkash" | "nagad";
  account_number: string;
  status: "pending" | "approved" | "rejected" | "completed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  total_earned: number;
  pending_commission: number;
  withdrawn: number;
  pending_withdrawal: number;
  available_balance: number;
}

export const useMyWalletBalance = () => {
  const { data: affiliate } = useMyAffiliate();

  return useQuery({
    queryKey: ["wallet_balance", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await apiClient.rpc("get_affiliate_balance", {
        p_affiliate_id: affiliate?.id,
      });

      if (error) {
        console.error("get_affiliate_balance failed:", error);
        return { total_earned: 0, withdrawn: 0, pending_withdrawal: 0, available_balance: 0 } as WalletBalance;
      }

      const d = data as any;
      return {
        total_earned: Number(d?.total_earned) || 0,
        pending_commission: Number(d?.pending_commission) || 0,
        withdrawn: Number(d?.withdrawn) || 0,
        pending_withdrawal: Number(d?.pending_withdrawal) || 0,
        available_balance: Number(d?.available_balance) || 0,
      } as WalletBalance;
    },
    enabled: !!affiliate?.id,
  });
};

export const useMyWithdrawals = () => {
  const { data: affiliate } = useMyAffiliate();

  return useQuery({
    queryKey: ["withdrawals", "my", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("withdrawals")
        .select("*")
        .eq("affiliate_id", affiliate?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Withdrawal[];
    },
    enabled: !!affiliate?.id,
  });
};

export const useAllWithdrawals = () => {
  return useQuery({
    queryKey: ["withdrawals", "all"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("withdrawals")
        .select("*, affiliates(id, referral_code, profiles(name, email, phone))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  const { data: affiliate } = useMyAffiliate();

  return useMutation({
    mutationFn: async ({
      amount,
      method,
      accountNumber,
    }: {
      amount: number;
      method: "bkash" | "nagad";
      accountNumber: string;
    }) => {
      if (!affiliate) throw new Error("Affiliate not found");

      const { data, error } = await apiClient
        .from("withdrawals")
        .insert({
          affiliate_id: affiliate.id,
          amount,
          method,
          account_number: accountNumber,
          status: "pending",
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet_balance"] });
    },
  });
};

export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      withdrawalId,
      status,
      adminNotes,
    }: {
      withdrawalId: string;
      status: "approved" | "rejected" | "completed";
      adminNotes?: string;
    }) => {
      const { data, error } = await apiClient
        .from("withdrawals")
        .update({ status, admin_notes: adminNotes })
        .eq("id", withdrawalId)
        .select()
        .maybeSingle();

      if (error) throw error;

      try {
        await apiClient.rpc("send_withdrawal_email", {
          withdrawal_id: withdrawalId,
          status,
          reason: adminNotes,
        });
      } catch (err) {
        console.error("Failed to send withdrawal email:", err);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet_balance"] });
    },
  });
};
