export interface FAQItem {
    id: string;
    question: { bn: string; en: string };
    answer: { bn: string; en: string };
    is_active: boolean;
    created_at: string;
}

export interface FAQItemFlat {
    id: string;
    question_bn: string;
    question_en: string;
    answer_bn: string;
    answer_en: string;
    category?: string;
    is_active: boolean;
    sort_order?: number;
    created_at: string;
    updated_at?: string;
}
