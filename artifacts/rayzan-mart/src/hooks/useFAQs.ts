import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FAQItem } from "@/types/faq";

type FAQType = "homepage" | "affiliate";

type DBFAQRow = {
  id: string;
  question_bn: string;
  question_en: string;
  answer_bn: string;
  answer_en: string;
  category?: string;
  faq_type: FAQType;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
};

function dbToFAQ(row: DBFAQRow): FAQItem {
  return {
    id: row.id,
    question_bn: row.question_bn,
    question_en: row.question_en,
    answer_bn: row.answer_bn,
    answer_en: row.answer_en,
    category: row.category,
    faq_type: row.faq_type,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function faqToDB(faq: any): Partial<DBFAQRow> {
  const out: any = { is_active: faq.is_active };
  if (faq.question) {
    out.question_bn = faq.question?.bn ?? "";
    out.question_en = faq.question?.en ?? "";
  } else {
    if (faq.question_bn !== undefined) out.question_bn = faq.question_bn;
    if (faq.question_en !== undefined) out.question_en = faq.question_en;
  }
  if (faq.answer) {
    out.answer_bn = faq.answer?.bn ?? "";
    out.answer_en = faq.answer?.en ?? "";
  } else {
    if (faq.answer_bn !== undefined) out.answer_bn = faq.answer_bn;
    if (faq.answer_en !== undefined) out.answer_en = faq.answer_en;
  }
  if (faq.sort_order !== undefined) out.sort_order = faq.sort_order;
  if (faq.category !== undefined) out.category = faq.category;
  if (faq.faq_type !== undefined) out.faq_type = faq.faq_type;
  return out;
}

export const useHomepageFAQs = () => {
  return useQuery({
    queryKey: ["faqs", "homepage", "active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .eq("faq_type", "homepage")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return ((data as unknown) as DBFAQRow[]).map(dbToFAQ);
    },
  });
};

export const useAffiliateFAQs = () => {
  return useQuery({
    queryKey: ["faqs", "affiliate", "active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .eq("faq_type", "affiliate")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return ((data as unknown) as DBFAQRow[]).map(dbToFAQ);
    },
  });
};

export const useAdminFAQs = (faqType: FAQType) => {
  return useQuery({
    queryKey: ["faqs", faqType, "admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("faq_items")
        .select("*")
        .eq("faq_type", faqType)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = (data as unknown) as DBFAQRow[];
      return rows.map((row) => ({
        id: row.id,
        question: { bn: row.question_bn, en: row.question_en },
        answer: { bn: row.answer_bn, en: row.answer_en },
        faq_type: row.faq_type,
        is_active: row.is_active,
        created_at: row.created_at,
      })) as any[];
    },
  });
};

export const useCreateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newFAQ: any) => {
      const dbPayload = faqToDB(newFAQ);
      const { data, error } = await (supabase as any)
        .from("faq_items")
        .insert([dbPayload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
  });
};

export const useUpdateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const dbPayload = faqToDB(updates);
      const { data, error } = await (supabase as any)
        .from("faq_items")
        .update(dbPayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
  });
};

export const useDeleteFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("faq_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
  });
};
