import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const apiFetch = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem("rm_auth_token");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "Error");
    throw new Error(msg);
  }
  return res.json();
};

export interface WebsiteFeedback {
  id: string;
  user_id?: string;
  user_name: string;
  email?: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface FeedbackStats {
  total: number;
  avg: number;
}

// Public approved feedback with pagination
export const usePublicFeedback = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ["website-feedback", "public", page, limit],
    queryFn: () => apiFetch(`/api/website-feedback?page=${page}&limit=${limit}`),
  });
};

// Public stats: avg rating + total count
export const useFeedbackStats = () => {
  return useQuery({
    queryKey: ["website-feedback", "stats"],
    queryFn: () => apiFetch("/api/website-feedback/stats") as Promise<FeedbackStats>,
  });
};

// Authenticated user's own feedback
export const useMyFeedback = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["website-feedback", "my", user?.id],
    queryFn: () => apiFetch("/api/website-feedback/my") as Promise<WebsiteFeedback[]>,
    enabled: !!user,
  });
};

// Admin: all feedback
export const useAdminFeedback = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["website-feedback", "admin", page, limit],
    queryFn: () => apiFetch(`/api/website-feedback/admin?page=${page}&limit=${limit}`),
  });
};

// Submit feedback
export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string }) =>
      apiFetch("/api/website-feedback", {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-feedback"] });
    },
  });
};

// Admin: approve / unapprove
export const useApproveFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_approved }: { id: string; is_approved: boolean }) =>
      apiFetch(`/api/website-feedback/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ is_approved }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-feedback"] });
    },
  });
};

// Delete feedback
export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/website-feedback/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-feedback"] });
    },
  });
};
