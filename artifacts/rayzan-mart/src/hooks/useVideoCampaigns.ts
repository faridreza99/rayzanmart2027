import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VideoCampaign } from "@/types/affiliate_video";

type DbRow = {
    id: string;
    title_bn: string;
    title_en: string;
    description_bn: string;
    description_en: string;
    video_url: string;
    thumbnail_url?: string;
    is_active: boolean;
    views: number;
    created_at: string;
};

function rowToModel(row: DbRow): VideoCampaign {
    return {
        id: row.id,
        title: { bn: row.title_bn || "", en: row.title_en || "" },
        description: { bn: row.description_bn || "", en: row.description_en || "" },
        video_url: row.video_url,
        thumbnail_url: row.thumbnail_url,
        is_active: row.is_active,
        created_at: row.created_at,
    };
}

function modelToRow(model: Partial<VideoCampaign>): Partial<DbRow> {
    const row: Partial<DbRow> = {};
    if (model.title) {
        row.title_bn = model.title.bn;
        row.title_en = model.title.en;
    }
    if (model.description) {
        row.description_bn = model.description.bn;
        row.description_en = model.description.en;
    }
    if (model.video_url !== undefined) row.video_url = model.video_url;
    if (model.thumbnail_url !== undefined) row.thumbnail_url = model.thumbnail_url;
    if (model.is_active !== undefined) row.is_active = model.is_active;
    return row;
}

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
            return (data as DbRow[]).map(rowToModel);
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
            return (data as DbRow[]).map(rowToModel);
        },
    });
};

export const useCreateVideoCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newCampaign: Omit<VideoCampaign, "id" | "created_at">) => {
            const row = modelToRow(newCampaign);
            const { data, error } = await (supabase as any)
                .from("affiliate_video_campaigns")
                .insert([row])
                .select()
                .single();

            if (error) throw error;
            return rowToModel(data as DbRow);
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
            const row = modelToRow(updates);
            const { data, error } = await (supabase as any)
                .from("affiliate_video_campaigns")
                .update(row)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return rowToModel(data as DbRow);
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
