import { TranslationObject } from "./testimonial";

export interface AffiliatePageContent {
    id: string;
    section: string;
    key: string;
    value: TranslationObject;
    is_active: boolean;
    created_at: string;
}
