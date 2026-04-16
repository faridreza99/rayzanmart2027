import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  product_name_bn?: string;
  product_name_en?: string;
}

const refreshProductReviewSummary = async (productId: string) => {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_approved", true);

  if (error) throw error;

  const count = data?.length || 0;
  const avg = count > 0 ? Number((data!.reduce((sum, r: any) => sum + Number(r.rating), 0) / count).toFixed(1)) : 0;

  const { error: updateError } = await supabase
    .from("products")
    .update({ rating: avg, reviews_count: count })
    .eq("id", productId);

  if (updateError) throw updateError;
};

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reviews = (data || []) as ProductReview[];
      const userIds = [...new Set(reviews.map((r) => r.user_id))];

      if (userIds.length === 0) return reviews;

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name]));
      return reviews.map((r) => ({ ...r, user_name: nameMap.get(r.user_id) || "User" }));
    },
    enabled: !!productId,
  });
};

export const useMyProductReviews = (productIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["product-reviews", "mine", user?.id, productIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, product_id, rating, comment, created_at")
        .eq("user_id", user?.id)
        .in("product_id", productIds);

      if (error) throw error;
      return data as Array<{ id: string; product_id: string; rating: number; comment: string | null; created_at: string }>;
    },
    enabled: !!user && productIds.length > 0,
  });
};

export const useAllProductReviews = () => {
  return useQuery({
    queryKey: ["product-reviews", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const reviews = (data || []) as ProductReview[];

      const userIds = [...new Set(reviews.map((r) => r.user_id))];
      const productIds = [...new Set(reviews.map((r) => r.product_id))];

      const [{ data: profiles, error: profileError }, { data: products, error: productError }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, name").in("user_id", userIds)
          : Promise.resolve({ data: [], error: null } as any),
        productIds.length
          ? supabase.from("products").select("id, name_bn, name_en").in("id", productIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (profileError) throw profileError;
      if (productError) throw productError;

      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name]));
      const productMap = new Map((products || []).map((p: any) => [p.id, p]));

      return reviews.map((r) => ({
        ...r,
        user_name: nameMap.get(r.user_id) || "User",
        product_name_bn: productMap.get(r.product_id)?.name_bn || "-",
        product_name_en: productMap.get(r.product_id)?.name_en || "-",
      }));
    },
  });
};

export const useCreateProductReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      orderId,
      rating,
      comment,
    }: {
      productId: string;
      orderId?: string | null;
      rating: number;
      comment: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        order_id: orderId || null,
        rating,
        comment,
      });

      if (error) throw error;

      await refreshProductReviewSummary(productId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", vars.productId] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews", "all"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", vars.productId] });
    },
  });
};

export const useUpdateMyProductReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      productId,
      rating,
      comment,
    }: {
      reviewId: string;
      productId: string;
      rating: number;
      comment: string;
    }) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ rating, comment })
        .eq("id", reviewId);

      if (error) throw error;
      await refreshProductReviewSummary(productId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", vars.productId] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews", "all"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", vars.productId] });
    },
  });
};

export const useUpdateProductReviewApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      productId,
      isApproved,
    }: {
      reviewId: string;
      productId: string;
      isApproved: boolean;
    }) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ is_approved: isApproved })
        .eq("id", reviewId);

      if (error) throw error;
      await refreshProductReviewSummary(productId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", vars.productId] });
    },
  });
};

export const useDeleteProductReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId);
      if (error) throw error;
      await refreshProductReviewSummary(productId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", vars.productId] });
    },
  });
};
