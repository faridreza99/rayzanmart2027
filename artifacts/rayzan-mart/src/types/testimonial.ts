export interface TranslationObject {
    bn: string;
    en: string;
}

export interface Testimonial {
    id: string;
    name: TranslationObject;
    role: TranslationObject;
    image: string | null;
    story: TranslationObject;
    income: TranslationObject;
    is_active: boolean;
    created_at: string;
}

export interface TestimonialFlat {
    id: string;
    name: string;
    role_bn: string;
    role_en: string;
    content_bn: string;
    content_en: string;
    avatar_url: string | null;
    rating: number;
    is_active: boolean;
    created_at: string;
}
