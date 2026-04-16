import { useState } from "react";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Eye, 
    EyeOff, 
    Loader2,
    Video
} from "lucide-react";
import { 
    useAdminVideoCampaigns, 
    useCreateVideoCampaign, 
    useUpdateVideoCampaign, 
    useDeleteVideoCampaign 
} from "@/hooks/useVideoCampaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { VideoCampaign } from "@/types/affiliate_video";
import { EnterpriseConfirmDialog } from "./EnterpriseConfirmDialog";
import { EnterpriseEmptyState } from "./EnterpriseEmptyState";

export const VideoCampaignManagement = () => {
    const { language, t } = useLanguage();
    const { data: campaigns, isLoading } = useAdminVideoCampaigns();
    const createCampaign = useCreateVideoCampaign();
    const updateCampaign = useUpdateVideoCampaign();
    const deleteCampaign = useDeleteVideoCampaign();

    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<VideoCampaign | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: { bn: "", en: "" },
        description: { bn: "", en: "" },
        video_url: "",
        is_active: true,
    });

    const filteredCampaigns = campaigns?.filter(c => 
        c.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.bn.includes(searchQuery)
    );

    const handleOpenDialog = (campaign?: VideoCampaign) => {
        if (campaign) {
            setEditingCampaign(campaign);
            setFormData({
                title: { ...campaign.title },
                description: { ...campaign.description },
                video_url: campaign.video_url,
                is_active: campaign.is_active,
            });
        } else {
            setEditingCampaign(null);
            setFormData({
                title: { bn: "", en: "" },
                description: { bn: "", en: "" },
                video_url: "",
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.video_url) {
            toast.error(language === "bn" ? "ভিডিও ইউআরএল প্রয়োজন" : "Video URL is required");
            return;
        }

        try {
            if (editingCampaign) {
                await updateCampaign.mutateAsync({
                    id: editingCampaign.id,
                    ...formData,
                });
                toast.success(language === "bn" ? "ক্যাম্পেইন আপডেট করা হয়েছে" : "Campaign updated successfully");
            } else {
                await createCampaign.mutateAsync(formData);
                toast.success(language === "bn" ? "ক্যাম্পেইন যোগ করা হয়েছে" : "Campaign added successfully");
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteCampaign.mutateAsync(confirmDelete);
            toast.success(language === "bn" ? "ক্যাম্পেইন মুছে ফেলা হয়েছে" : "Campaign deleted successfully");
            setConfirmDelete(null);
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const toggleStatus = async (campaign: VideoCampaign) => {
        try {
            await updateCampaign.mutateAsync({
                id: campaign.id,
                is_active: !campaign.is_active,
            });
            toast.success(t("statusUpdated"));
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading Campaigns..."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{language === "bn" ? "ভিডিও ক্যাম্পেইন" : "Video Campaigns"}</h2>
                    <p className="text-muted-foreground">
                        {language === "bn" ? "অ্যাফিলিয়েটদের জন্য ভিডিও ক্যাম্পেইন ম্যানেজ করুন।" : "Manage video campaigns for affiliates."}
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {language === "bn" ? "নতুন ভিডিও ক্যাম্পেইন" : "Add Video Campaign"}
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">{language === "bn" ? "প্রিভিউ" : "Preview"}</TableHead>
                            <TableHead className="w-[30%]">{language === "bn" ? "টাইটেল" : "Title"}</TableHead>
                            <TableHead className="w-[30%]">{language === "bn" ? "ডেসক্রিপশন" : "Description"}</TableHead>
                            <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                            <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCampaigns?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <EnterpriseEmptyState 
                                        title={language === "bn" ? "কোনো ক্যাম্পেইন পাওয়া যায়নি" : "No campaigns found"}
                                        description={language === "bn" ? "নতুন একটি ভিডিও ক্যাম্পেইন যোগ করে শুরু করুন।" : "Start by adding a new video campaign."}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCampaigns?.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell>
                                        <div className="relative aspect-video w-[120px] rounded bg-muted overflow-hidden">
                                            {getYoutubeId(campaign.video_url) ? (
                                                <img 
                                                    src={`https://img.youtube.com/vi/${getYoutubeId(campaign.video_url)}/mqdefault.jpg`}
                                                    alt="Thumbnail"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Video className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="max-w-[250px] truncate">
                                            {language === "bn" ? campaign.title.bn : campaign.title.en}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[250px] truncate text-muted-foreground">
                                            {language === "bn" ? campaign.description.bn : campaign.description.en}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(campaign)}
                                            className={campaign.is_active ? "text-success" : "text-destructive"}
                                        >
                                            {campaign.is_active ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                            {campaign.is_active ? t("active") : t("inactive")}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleOpenDialog(campaign)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => setConfirmDelete(campaign.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCampaign ? (language === "bn" ? "ভিডিও ক্যাম্পেইন এডিট করুন" : "Edit Video Campaign") : (language === "bn" ? "নতুন ভিডিও ক্যাম্পেইন যোগ করুন" : "Add New Video Campaign")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">Information</h4>
                            <div className="space-y-2">
                                <Label>YouTube URL</Label>
                                <Input
                                    value={formData.video_url}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                                <p className="text-[10px] text-muted-foreground">Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">Bangla Content</h4>
                            <div className="space-y-2">
                                <Label>টাইটেল (Bangla)</Label>
                                <Input
                                    value={formData.title.bn}
                                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, bn: e.target.value } })}
                                    placeholder="ক্যাম্পেইনের টাইটেল লিখুন..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ডেসক্রিপশন (Bangla)</Label>
                                <Textarea
                                    value={formData.description.bn}
                                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, bn: e.target.value } })}
                                    placeholder="সংক্ষিপ্ত ডেসক্রিপশন লিখুন..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">English Content</h4>
                            <div className="space-y-2">
                                <Label>Title (English)</Label>
                                <Input
                                    value={formData.title.en}
                                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                                    placeholder="Write the campaign title..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (English)</Label>
                                <Textarea
                                    value={formData.description.en}
                                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                                    placeholder="Write a short description..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t("cancel")}
                        </Button>
                        <Button onClick={handleSubmit} disabled={createCampaign.isPending || updateCampaign.isPending}>
                            {(createCampaign.isPending || updateCampaign.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t("save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EnterpriseConfirmDialog
                open={!!confirmDelete}
                onOpenChange={(open) => !open && setConfirmDelete(null)}
                onConfirm={handleDelete}
                title={language === "bn" ? "ক্যাম্পেইন মুছে ফেলুন" : "Delete Campaign"}
                description={language === "bn" ? "আপনি কি নিশ্চিত যে আপনি এই ভিডিও ক্যাম্পেইনটি স্থায়ীভাবে মুছে ফেলতে চান?" : "Are you sure you want to permanently delete this video campaign?"}
                confirmLabel={t("delete")}
                cancelLabel={t("cancel")}
                type="destructive"
            />
        </div>
    );
};
