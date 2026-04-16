import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AffiliatePageContent } from "@/types/affiliate_page_content";
import { TranslationObject } from "@/types/testimonial";

export const useAffiliatePageContent = () => {
    return useQuery({
        queryKey: ["affiliate_page_content", "active"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("affiliate_page_content")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return (data as unknown) as AffiliatePageContent[];
        },
    });
};

export const useAdminAffiliatePageContent = () => {
    return useQuery({
        queryKey: ["affiliate_page_content", "admin"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("affiliate_page_content")
                .select("*")
                .order("section", { ascending: true });

            if (error) throw error;
            return (data as unknown) as AffiliatePageContent[];
        },
    });
};

export const useUpdateAffiliatePageContent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<AffiliatePageContent> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("affiliate_page_content")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return (data as unknown) as AffiliatePageContent;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affiliate_page_content"] });
        },
    });
};

export const getContent = (
    items: AffiliatePageContent[] | undefined,
    section: string,
    key: string
): TranslationObject => {
    const item = items?.find((i) => i.section === section && i.key === key);
    return item?.value ?? { bn: "", en: "" };
};
