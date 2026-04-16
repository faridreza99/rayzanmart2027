import { useState } from "react";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Eye, 
    EyeOff, 
    Loader2,
    Image as ImageIcon
} from "lucide-react";
import { 
    useAdminTestimonials, 
    useCreateTestimonial, 
    useUpdateTestimonial, 
    useDeleteTestimonial 
} from "@/hooks/useTestimonials";
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
import { SingleImageUpload } from "./CloudinaryImageUpload";
import { Testimonial } from "@/types/testimonial";
import { EnterpriseConfirmDialog } from "./EnterpriseConfirmDialog";
import { EnterpriseEmptyState } from "./EnterpriseEmptyState";

export const TestimonialManagement = () => {
    const { language, t } = useLanguage();
    const { data: testimonials, isLoading } = useAdminTestimonials();
    const createTestimonial = useCreateTestimonial();
    const updateTestimonial = useUpdateTestimonial();
    const deleteTestimonial = useDeleteTestimonial();

    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: { bn: "", en: "" },
        role: { bn: "", en: "" },
        income: { bn: "", en: "" },
        story: { bn: "", en: "" },
        image: "",
        is_active: true,
    });

    const filteredTestimonials = testimonials?.filter(t => 
        t.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.bn.includes(searchQuery)
    );

    const handleOpenDialog = (testimonial?: Testimonial) => {
        if (testimonial) {
            setEditingTestimonial(testimonial);
            setFormData({
                name: { ...testimonial.name },
                role: { ...testimonial.role },
                income: { ...testimonial.income },
                story: { ...testimonial.story },
                image: testimonial.image || "",
                is_active: testimonial.is_active,
            });
        } else {
            setEditingTestimonial(null);
            setFormData({
                name: { bn: "", en: "" },
                role: { bn: "", en: "" },
                income: { bn: "", en: "" },
                story: { bn: "", en: "" },
                image: "",
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingTestimonial) {
                await updateTestimonial.mutateAsync({
                    id: editingTestimonial.id,
                    ...formData,
                });
                toast.success(t("testimonialUpdated"));
            } else {
                await createTestimonial.mutateAsync(formData);
                toast.success(t("testimonialCreated"));
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteTestimonial.mutateAsync(confirmDelete);
            toast.success(t("testimonialDeleted"));
            setConfirmDelete(null);
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const toggleStatus = async (testimonial: Testimonial) => {
        try {
            await updateTestimonial.mutateAsync({
                id: testimonial.id,
                is_active: !testimonial.is_active,
            });
            toast.success(t("statusUpdated"));
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading testimonials..."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("testimonials")}</h2>
                    <p className="text-muted-foreground">
                        {language === "bn" ? "অ্যাফিলিয়েটদের সফলতার গল্পগুলো ম্যানেজ করুন।" : "Manage success stories from your affiliates."}
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("addTestimonial")}
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

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">{language === "bn" ? "ছবি" : "Image"}</TableHead>
                            <TableHead>{language === "bn" ? "নাম ও ভূমিকা" : "Name & Role"}</TableHead>
                            <TableHead>{language === "bn" ? "আয়" : "Income"}</TableHead>
                            <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                            <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTestimonials?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <EnterpriseEmptyState 
                                        title={language === "bn" ? "কোনো গল্প পাওয়া যায়নি" : "No stories found"}
                                        description={language === "bn" ? "নতুন একটি গল্প যোগ করে শুরু করুন।" : "Start by adding a new success story."}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTestimonials?.map((testimonial) => (
                                <TableRow key={testimonial.id}>
                                    <TableCell>
                                        {testimonial.image ? (
                                            <img
                                                src={testimonial.image}
                                                alt={testimonial.name.en}
                                                className="h-10 w-10 rounded-full object-cover border"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {language === "bn" ? testimonial.name.bn : testimonial.name.en}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {language === "bn" ? testimonial.role.bn : testimonial.role.en}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {language === "bn" ? testimonial.income.bn : testimonial.income.en}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(testimonial)}
                                            className={testimonial.is_active ? "text-success" : "text-destructive"}
                                        >
                                            {testimonial.is_active ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                            {testimonial.is_active ? t("active") : t("inactive")}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleOpenDialog(testimonial)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => setConfirmDelete(testimonial.id)}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTestimonial ? t("editTestimonial") : t("addTestimonial")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t("name")} (Bangla)</Label>
                                <Input
                                    value={formData.name.bn}
                                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, bn: e.target.value } })}
                                    placeholder="রাকিব"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t("name")} (English)</Label>
                                <Input
                                    value={formData.name.en}
                                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                                    placeholder="Rakib"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t("roleBn")}</Label>
                                <Input
                                    value={formData.role.bn}
                                    onChange={(e) => setFormData({ ...formData, role: { ...formData.role, bn: e.target.value } })}
                                    placeholder="ছাত্র"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t("roleEn")}</Label>
                                <Input
                                    value={formData.role.en}
                                    onChange={(e) => setFormData({ ...formData, role: { ...formData.role, en: e.target.value } })}
                                    placeholder="Student"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t("incomeBn")}</Label>
                                <Input
                                    value={formData.income.bn}
                                    onChange={(e) => setFormData({ ...formData, income: { ...formData.income, bn: e.target.value } })}
                                    placeholder="২৫,০০০+ টাকা/মাস"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t("incomeEn")}</Label>
                                <Input
                                    value={formData.income.en}
                                    onChange={(e) => setFormData({ ...formData, income: { ...formData.income, en: e.target.value } })}
                                    placeholder="25,000+ BDT/month"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("storyBn")}</Label>
                            <Textarea
                                value={formData.story.bn}
                                onChange={(e) => setFormData({ ...formData, story: { ...formData.story, bn: e.target.value } })}
                                placeholder="পূর্ণ গল্প লিখুন..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t("storyEn")}</Label>
                            <Textarea
                                value={formData.story.en}
                                onChange={(e) => setFormData({ ...formData, story: { ...formData.story, en: e.target.value } })}
                                placeholder="Full story in English..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <SingleImageUpload
                            label={language === "bn" ? "প্রোফাইল ছবি" : "Profile Image"}
                            value={formData.image}
                            onChange={(url) => setFormData({ ...formData, image: url })}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t("cancel")}
                        </Button>
                        <Button onClick={handleSubmit} disabled={createTestimonial.isPending || updateTestimonial.isPending}>
                            {(createTestimonial.isPending || updateTestimonial.isPending) && (
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
                title={language === "bn" ? "গল্পটি মুছে ফেলুন" : "Delete Story"}
                description={language === "bn" ? "আপনি কি নিশ্চিত যে আপনি এই টেস্টিমোনিয়ালটি স্থায়ীভাবে মুছে ফেলতে চান?" : "Are you sure you want to permanently delete this testimonial?"}
                confirmLabel={t("delete")}
                cancelLabel={t("cancel")}
                type="destructive"
            />
        </div>
    );
};
