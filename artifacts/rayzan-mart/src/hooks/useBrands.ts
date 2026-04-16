 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Brand {
   id: string;
   name_bn: string;
   name_en: string;
   slug: string | null;
   logo_url: string | null;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export const useBrands = () => {
   return useQuery({
     queryKey: ["brands"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("brands")
         .select("*")
         .order("name_en", { ascending: true });
 
       if (error) throw error;
       return data as Brand[];
     },
   });
 };
 
 export const useActiveBrands = () => {
   return useQuery({
     queryKey: ["brands", "active"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("brands")
         .select("*")
         .eq("is_active", true)
         .order("name_en", { ascending: true });
 
       if (error) throw error;
       return data as Brand[];
     },
   });
 };
 
 export const useCreateBrand = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (brand: Omit<Brand, "id" | "created_at" | "updated_at">) => {
       const { data, error } = await supabase
         .from("brands")
         .insert(brand)
         .select()
         .maybeSingle();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["brands"] });
     },
   });
 };
 
 export const useUpdateBrand = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({ id, ...updates }: Partial<Brand> & { id: string }) => {
       const { data, error } = await supabase
         .from("brands")
         .update(updates)
         .eq("id", id)
         .select()
         .maybeSingle();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["brands"] });
     },
   });
 };
 
 export const useDeleteBrand = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (id: string) => {
       // First check if brand has products
       const { data: hasProducts } = await supabase.rpc("brand_has_products", {
         brand_uuid: id,
       });
 
       if (hasProducts) {
         throw new Error("BRAND_HAS_PRODUCTS");
       }
 
       const { error } = await supabase.from("brands").delete().eq("id", id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["brands"] });
     },
   });
 };