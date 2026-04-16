import { useState } from "react";
import { Plus, Trash2, Edit2, GripVertical, Save, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    useAllHeroBanners,
    useCreateHeroBanner,
    useUpdateHeroBanner,
    useDeleteHeroBanner,
    HeroBanner
} from "@/hooks/useAdminSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SingleImageUpload } from "./CloudinaryImageUpload";
import { toast } from "sonner";

export const HeroBannerManagement = () => {
    const { language, t } = useLanguage();
    const { data: banners, isLoading } = useAllHeroBanners();
    const createBanner = useCreateHeroBanner();
    const updateBanner = useUpdateHeroBanner();
    const deleteBanner = useDeleteHeroBanner();

    const [isEditing, setIsEditing] = useState<string | null>(null); // 'new' or ID
    const [formData, setFormData] = useState<Partial<HeroBanner>>({
        image_url: "",
        title_bn: "",
        title_en: "",
        subtitle_bn: "",
        subtitle_en: "",
        link: "/products",
        order_index: 0,
        is_active: true,
    });

    const handleEdit = (banner: HeroBanner) => {
        setFormData(banner);
        setIsEditing(banner.id);
    };

    const handleAddNew = () => {
        setFormData({
            image_url: "",
            title_bn: "",
            title_en: "",
            subtitle_bn: "",
            subtitle_en: "",
            link: "/products",
            order_index: (banners?.length || 0) + 1,
            is_active: true,
        });
        setIsEditing("new");
    };

    const handleSave = async () => {
        if (!formData.image_url || !formData.title_en || !formData.title_bn) {
            toast.error(language === "bn" ? "সবগুলো ঘর পূরণ করুন" : "Please fill required fields");
            return;
        }

        try {
            if (isEditing === "new") {
                await createBanner.mutateAsync(formData as any);
                toast.success(language === "bn" ? "ব্যানার তৈরি হয়েছে" : "Banner created successfully");
            } else {
                await updateBanner.mutateAsync({ id: isEditing!, ...formData });
                toast.success(language === "bn" ? "ব্যানার আপডেট হয়েছে" : "Banner updated successfully");
            }
            setIsEditing(null);
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(language === "bn" ? "আপনি কি নিশ্চিত?" : "Are you sure?")) {
            try {
                await deleteBanner.mutateAsync(id);
                toast.success(language === "bn" ? "ব্যানার মুছে ফেলা হয়েছে" : "Banner deleted successfully");
            } catch (error) {
                toast.error(t("somethingWentWrong"));
            }
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {language === "bn" ? "হোম পেজ ব্যানার" : "Home Page Banners"}
                    </h2>
                    <p className="text-muted-foreground">
                        {language === "bn"
                            ? "আপনার ওয়েবসাইটের শুরুর স্লাইডারটি এখান থেকে পরিবর্তন করুন"
                            : "Manage the hero slider at the top of your homepage"}
                    </p>
                </div>
                {!isEditing && (
                    <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        {language === "bn" ? "নতুন ব্যানার" : "Add New Banner"}
                    </Button>
                )}
            </div>

            {isEditing && (
                <Card>
                    <CardHeader>
                        <CardTitle>{isEditing === "new" ? "Add New" : "Edit"} Banner</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Title (Bangla)</Label>
                                <Input
                                    value={formData.title_bn}
                                    onChange={e => setFormData({ ...formData, title_bn: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Title (English)</Label>
                                <Input
                                    value={formData.title_en}
                                    onChange={e => setFormData({ ...formData, title_en: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Subtitle (Bangla)</Label>
                                <Input
                                    value={formData.subtitle_bn || ""}
                                    onChange={e => setFormData({ ...formData, subtitle_bn: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Subtitle (English)</Label>
                                <Input
                                    value={formData.subtitle_en || ""}
                                    onChange={e => setFormData({ ...formData, subtitle_en: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Link URL</Label>
                                <Input
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Order</Label>
                                <Input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label>Active</Label>
                        </div>

                        <SingleImageUpload
                            label="Banner Image"
                            value={formData.image_url}
                            onChange={url => setFormData({ ...formData, image_url: url })}
                        />

                        <div className="flex gap-2">
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(null)}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isEditing && (
                <div className="grid gap-4">
                    {banners?.map((banner) => (
                        <Card key={banner.id} className={!banner.is_active ? "opacity-60" : ""}>
                            <CardContent className="flex items-center p-4">
                                <div className="mr-4 h-16 w-32 overflow-hidden rounded bg-muted">
                                    <img
                                        src={banner.image_url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold">{language === "bn" ? banner.title_bn : banner.title_en}</h3>
                                    <p className="text-sm text-muted-foreground">{banner.link}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(banner)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(banner.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {banners?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No banners found. Add your first one to get started!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
