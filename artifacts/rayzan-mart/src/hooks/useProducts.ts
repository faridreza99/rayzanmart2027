import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant } from "@/data/products";

export interface DBProductVariant {
  id: string;
  product_id: string;
  name_en: string;
  name_bn: string;
  sku: string | null;
  price: number | null;
  stock: number;
  attributes: any;
  image_url: string | null;
  is_active: boolean;
  cost_price: number | null;
}

export interface DBProduct {
  id: string;
  name_bn: string;
  name_en: string;
  description_bn: string | null;
  description_en: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  gallery_images: string[] | null;
  category_id: string | null;
  brand: string | null;
  stock: number;
  rating: number | null;
  reviews_count: number | null;
  is_featured: boolean | null;
  discount_percent: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
  is_active: boolean | null;
  sku: string | null;
  created_at: string;
  has_variants: boolean | null;
  variant_options: any | null;
  product_variants?: DBProductVariant[];
  affiliate_commission_type?: string;
  affiliate_commission_value?: number;
  cost_price?: number | null;
  is_affiliate?: boolean | null;
}

export const toProductVariant = (v: DBProductVariant): ProductVariant => ({
  id: v.id,
  name: { bn: v.name_bn, en: v.name_en },
  sku: v.sku || undefined,
  price: v.price ? Number(v.price) : undefined,
  stock: v.stock,
  attributes: v.attributes as Record<string, string>,
  image: v.image_url || undefined,
  cost_price: v.cost_price ? Number(v.cost_price) : undefined,
});

// Convert DB product to frontend Product format
export const toProduct = (p: DBProduct): Product => {
  const variants = p.product_variants ? p.product_variants.filter(v => v.is_active).map(toProductVariant) : [];
  const derivedDiscountPercent =
    Number(p.discount_percent) > 0
      ? Number(p.discount_percent)
      : p.discount_type === "percentage" && Number(p.discount_value) > 0
        ? Number(p.discount_value)
        : 0;

  const basePrice = Number(p.original_price ?? p.price) || 0;
  const discountValue = Number(p.discount_value) || 0;
  const hasDiscount = (derivedDiscountPercent > 0 || discountValue > 0) && basePrice > 0;

  let discountedPrice = basePrice;
  if (hasDiscount) {
    if (p.discount_type === "fixed" && discountValue > 0) {
      discountedPrice = Math.max(0, basePrice - discountValue);
    } else if (p.discount_type === "percentage" && discountValue > 0) {
      discountedPrice = Math.max(0, basePrice - (basePrice * discountValue) / 100);
    } else if (derivedDiscountPercent > 0) {
      discountedPrice = Math.max(0, basePrice - (basePrice * derivedDiscountPercent) / 100);
    }
  }

  // For simple products: always show discounted price if discount exists.
  // For variant products: if product price is not set, fallback to lowest active variant price.
  let displayPrice = hasDiscount ? discountedPrice : (Number(p.price) || basePrice || 0);
  if (displayPrice === 0 && p.has_variants && variants.length > 0) {
    const validPrices = variants.map(v => v.price).filter((price): price is number => price !== undefined && price > 0);
    if (validPrices.length > 0) {
      displayPrice = Math.min(...validPrices);
    }
  }

  const originalPrice =
    basePrice > 0 && displayPrice < basePrice
      ? basePrice
      : p.original_price
        ? Number(p.original_price)
        : undefined;

  return {
    id: p.id,
    name: { bn: p.name_bn, en: p.name_en },
    description: { bn: p.description_bn || "", en: p.description_en || "" },
    price: displayPrice,
    originalPrice,
    image: p.image_url || "https://via.placeholder.com/400",
    category: p.category_id || "",
    brand: p.brand || undefined,
    sku: p.sku || undefined,
    stock: p.stock,
    rating: Number(p.rating) || 0,
    reviews: p.reviews_count || 0,
    featured: p.is_featured || false,
    discount: derivedDiscountPercent > 0 ? derivedDiscountPercent : undefined,
    images: (p.gallery_images as string[]) || [],
    hasVariants: p.has_variants || false,
    variantOptions: (p.variant_options as any) || [],
    variants,
    is_affiliate: p.is_affiliate || false,
    affiliate_commission_type: p.affiliate_commission_type || "percentage",
    affiliate_commission_value: p.affiliate_commission_value ? Number(p.affiliate_commission_value) : undefined,
    cost_price: p.cost_price ? Number(p.cost_price) : undefined,
  };
};

export const useProducts = (categoryId?: string, includeInactive = false, affiliateOnly = false, searchQuery?: string) => {
  return useQuery({
    queryKey: ["products", categoryId, includeInactive, affiliateOnly, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, product_variants(*)")
        .order("created_at", { ascending: false });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (affiliateOnly) {
        query = query.or(`is_affiliate.eq.true,affiliate_commission_value.gt.0`);
      }

      if (searchQuery && searchQuery.trim().length > 0) {
        query = query.or(`name_bn.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return ((data as unknown) as DBProduct[]).map(p => toProduct(p));
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("is_featured", true)
        .eq("is_active", true)
        .limit(10);

      if (error) throw error;
      return ((data as unknown) as DBProduct[]).map(toProduct);
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return toProduct((data as unknown) as DBProduct);
    },
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<DBProduct, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DBProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
