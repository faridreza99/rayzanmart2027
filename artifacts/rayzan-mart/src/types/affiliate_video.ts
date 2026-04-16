import { TranslationObject } from "./testimonial"; // Reusing the translation interface

export interface VideoCampaign {
    id: string;
    title: TranslationObject;
    description: TranslationObject;
    video_url: string;
    thumbnail_url?: string;
    is_active: boolean;
    created_at: string;
}
