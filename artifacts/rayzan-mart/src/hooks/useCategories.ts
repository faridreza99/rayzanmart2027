 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Category {
   id: string;
   name_bn: string;
   name_en: string;
   parent_id: string | null;
   slug: string | null;
   icon: string | null;
   sort_order: number;
   is_active: boolean;
   created_at: string;
   updated_at: string;
   product_count?: number;
 }
 
 export const useCategories = () => {
   return useQuery({
     queryKey: ["categories"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("categories")
         .select("*")
         .order("sort_order", { ascending: true })
         .order("name_en", { ascending: true });
 
       if (error) throw error;
       return data as Category[];
     },
   });
 };
 
 export const useMainCategories = () => {
   return useQuery({
     queryKey: ["categories", "main"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("categories")
         .select("*")
         .is("parent_id", null)
         .order("sort_order", { ascending: true });
 
       if (error) throw error;
       return data as Category[];
     },
   });
 };
 
 export const useSubCategories = (parentId: string | null) => {
   return useQuery({
     queryKey: ["categories", "sub", parentId],
     queryFn: async () => {
       if (!parentId) return [];
       const { data, error } = await supabase
         .from("categories")
         .select("*")
         .eq("parent_id", parentId)
         .order("sort_order", { ascending: true });
 
       if (error) throw error;
       return data as Category[];
     },
     enabled: !!parentId,
   });
 };
 
 export const useCategoryProductCount = (categoryId: string) => {
   return useQuery({
     queryKey: ["category-product-count", categoryId],
     queryFn: async () => {
       const { data, error } = await supabase.rpc("count_category_products", {
         category_uuid: categoryId,
       });
       if (error) throw error;
       return data as number;
     },
     enabled: !!categoryId,
   });
 };
 
 export const useCreateCategory = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (category: Omit<Category, "id" | "created_at" | "updated_at">) => {
       const { data, error } = await supabase
         .from("categories")
         .insert(category)
         .select()
         .maybeSingle();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["categories"] });
     },
   });
 };
 
 export const useUpdateCategory = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
       const { data, error } = await supabase
         .from("categories")
         .update(updates)
         .eq("id", id)
         .select()
         .maybeSingle();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["categories"] });
     },
   });
 };
 
 export const useDeleteCategory = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (id: string) => {
       // First check if category has products
       const { data: hasProducts } = await supabase.rpc("category_has_products", {
         category_uuid: id,
       });
 
       if (hasProducts) {
         throw new Error("CATEGORY_HAS_PRODUCTS");
       }
 
       // Check if category has subcategories
       const { data: subCategories } = await supabase
         .from("categories")
         .select("id")
         .eq("parent_id", id)
         .limit(1);
 
       if (subCategories && subCategories.length > 0) {
         throw new Error("CATEGORY_HAS_SUBCATEGORIES");
       }
 
       const { error } = await supabase.from("categories").delete().eq("id", id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["categories"] });
     },
   });
 };