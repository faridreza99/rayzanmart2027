import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Testimonial } from "@/types/testimonial";

type DBTestimonialRow = {
  id: string;
  name: string;
  role_bn: string;
  role_en: string;
  content_bn: string;
  content_en: string;
  income_bn: string | null;
  income_en: string | null;
  avatar_url: string | null;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

function dbToTestimonial(row: DBTestimonialRow): any {
  return {
    id: row.id,
    name: { bn: row.name, en: row.name },
    role: { bn: row.role_bn || "", en: row.role_en || "" },
    story: { bn: row.content_bn || "", en: row.content_en || "" },
    income: { bn: row.income_bn || "", en: row.income_en || "" },
    image: row.avatar_url || null,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

function testimonialToDB(t: any): Partial<DBTestimonialRow> {
  const out: any = {};
  if (t.name !== undefined) {
    out.name = typeof t.name === "object" ? (t.name.en || t.name.bn || "") : t.name;
  }
  if (t.role !== undefined) {
    out.role_bn = t.role?.bn ?? "";
    out.role_en = t.role?.en ?? "";
  }
  if (t.story !== undefined) {
    out.content_bn = t.story?.bn ?? "";
    out.content_en = t.story?.en ?? "";
  }
  if (t.income !== undefined) {
    out.income_bn = t.income?.bn ?? "";
    out.income_en = t.income?.en ?? "";
  }
  if (t.image !== undefined) out.avatar_url = t.image || null;
  if (t.is_active !== undefined) out.is_active = t.is_active;
  if (t.rating !== undefined) out.rating = t.rating;
  return out;
}

export const useTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials", "active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("affiliate_testimonials")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data as unknown) as DBTestimonialRow[]).map(dbToTestimonial);
    },
  });
};

export const useAdminTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials", "all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("affiliate_testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data as unknown) as DBTestimonialRow[]).map(dbToTestimonial);
    },
  });
};

export const useCreateTestimonial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testimonial: any) => {
      const dbPayload = testimonialToDB(testimonial);
      const { data, error } = await (supabase as any)
        .from("affiliate_testimonials")
        .insert(dbPayload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
};

export const useUpdateTestimonial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const dbPayload = testimonialToDB(updates);
      const { data, error } = await (supabase as any)
        .from("affiliate_testimonials")
        .update(dbPayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
};

export const useDeleteTestimonial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("affiliate_testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
};
