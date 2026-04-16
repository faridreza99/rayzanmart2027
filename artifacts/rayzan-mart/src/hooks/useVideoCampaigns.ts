import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VideoCampaign } from "@/types/affiliate_video";

export const useVideoCampaigns = () => {
    return useQuery({
        queryKey: ["video_campaigns", "active"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("affiliate_video_campaigns")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data as unknown) as VideoCampaign[];
        },
    });
};

export const useAdminVideoCampaigns = () => {
    return useQuery({
        queryKey: ["video_campaigns", "admin"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("affiliate_video_campaigns")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data as unknown) as VideoCampaign[];
        },
    });
};

export const useCreateVideoCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newCampaign: Omit<VideoCampaign, "id" | "created_at">) => {
            const { data, error } = await (supabase as any)
                .from("affiliate_video_campaigns")
                .insert([newCampaign])
                .select()
                .single();

            if (error) throw error;
            return (data as unknown) as VideoCampaign;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["video_campaigns"] });
        },
    });
};

export const useUpdateVideoCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<VideoCampaign> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("affiliate_video_campaigns")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return (data as unknown) as VideoCampaign;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["video_campaigns"] });
        },
    });
};

export const useDeleteVideoCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("affiliate_video_campaigns")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["video_campaigns"] });
        },
    });
};
