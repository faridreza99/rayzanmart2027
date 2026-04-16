import { useVideoCampaigns } from "@/hooks/useVideoCampaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Video, PlayCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const VideoCampaignsPanel = () => {
    const { language } = useLanguage();
    const { data: videos, isLoading } = useVideoCampaigns();

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const activeVideos = videos || [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-xl font-bold text-slate-800">
                    {language === "bn" ? "ভিডিও ক্যাম্পেইন" : "Video Campaigns"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {language === "bn" 
                        ? "আপনার প্রচারের জন্য এই ভিডিওগুলো ব্যবহার করুন।" 
                        : "Use these videos for your promotions."}
                </p>
            </div>

            {activeVideos.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <Video className="mb-4 h-12 w-12 opacity-20" />
                        <p>{language === "bn" ? "বর্তমানে কোনো ভিডিও নেই।" : "No video campaigns currently available."}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {activeVideos.map((video) => (
                        <Card key={video.id} className="overflow-hidden card-hover">
                            <div className="aspect-video relative bg-slate-100">
                                <iframe
                                    className="h-full w-full"
                                    src={video.video_url.replace('watch?v=', 'embed/')}
                                    title={video.title[language]}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <PlayCircle className="h-4 w-4 text-primary" />
                                    {video.title[language]}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {video.description[language]}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
