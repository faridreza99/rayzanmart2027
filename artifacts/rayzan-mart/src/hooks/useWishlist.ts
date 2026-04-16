import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toProduct, DBProduct } from "./useProducts";
import { Product } from "@/data/products";

export const useWishlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*, products(*)")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data.map((item: any) => ({
        id: item.id,
        product: toProduct(item.products as DBProduct),
        created_at: item.created_at,
      }));
    },
    enabled: !!user,
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("wishlist").insert({
        user_id: user.id,
        product_id: productId,
      });

      if (error && error.code !== "23505") throw error; // Ignore duplicate key error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useIsInWishlist = (productId: string) => {
  const { data: wishlist } = useWishlist();
  return wishlist?.some((item) => item.product.id === productId) || false;
};