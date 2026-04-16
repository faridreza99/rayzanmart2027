import { useState } from "react";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Eye, 
    EyeOff, 
    Loader2
} from "lucide-react";
import { 
    useAdminFAQs, 
    useCreateFAQ, 
    useUpdateFAQ, 
    useDeleteFAQ 
} from "@/hooks/useFAQs";
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
import { FAQItem } from "@/types/faq";
import { EnterpriseConfirmDialog } from "./EnterpriseConfirmDialog";
import { EnterpriseEmptyState } from "./EnterpriseEmptyState";

export const FAQManagement = () => {
    const { language, t } = useLanguage();
    const { data: faqs, isLoading } = useAdminFAQs();
    const createFAQ = useCreateFAQ();
    const updateFAQ = useUpdateFAQ();
    const deleteFAQ = useDeleteFAQ();

    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        question: { bn: "", en: "" },
        answer: { bn: "", en: "" },
        is_active: true,
    });

    const filteredFAQs = faqs?.filter(f => 
        f.question.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.question.bn.includes(searchQuery)
    );

    const handleOpenDialog = (faq?: FAQItem) => {
        if (faq) {
            setEditingFAQ(faq);
            setFormData({
                question: { ...faq.question },
                answer: { ...faq.answer },
                is_active: faq.is_active,
            });
        } else {
            setEditingFAQ(null);
            setFormData({
                question: { bn: "", en: "" },
                answer: { bn: "", en: "" },
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingFAQ) {
                await updateFAQ.mutateAsync({
                    id: editingFAQ.id,
                    ...formData,
                });
                toast.success(language === "bn" ? "FAQ আপডেট করা হয়েছে" : "FAQ updated successfully");
            } else {
                await createFAQ.mutateAsync(formData);
                toast.success(language === "bn" ? "FAQ যোগ করা হয়েছে" : "FAQ added successfully");
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteFAQ.mutateAsync(confirmDelete);
            toast.success(language === "bn" ? "FAQ মুছে ফেলা হয়েছে" : "FAQ deleted successfully");
            setConfirmDelete(null);
        } catch (error) {
            toast.error(t("somethingWentWrong"));
        }
    };

    const toggleStatus = async (faq: FAQItem) => {
        try {
            await updateFAQ.mutateAsync({
                id: faq.id,
                is_active: !faq.is_active,
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
                <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading FAQs..."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{language === "bn" ? "সাধারণ জিজ্ঞাসাসমূহ" : "FAQs"}</h2>
                    <p className="text-muted-foreground">
                        {language === "bn" ? "ল্যান্ডিং পেজের FAQ-গুলো ম্যানেজ করুন।" : "Manage FAQs displayed on the landing page."}
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {language === "bn" ? "নতুন FAQ" : "Add FAQ"}
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
                            <TableHead className="w-[40%]">{language === "bn" ? "প্রশ্ন" : "Question"}</TableHead>
                            <TableHead className="w-[40%]">{language === "bn" ? "উত্তর" : "Answer"}</TableHead>
                            <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                            <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFAQs?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <EnterpriseEmptyState 
                                        title={language === "bn" ? "কোনো প্রশ্ন পাওয়া যায়নি" : "No FAQs found"}
                                        description={language === "bn" ? "নতুন একটি প্রশ্ন যোগ করে শুরু করুন।" : "Start by adding a new FAQ."}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFAQs?.map((faq) => (
                                <TableRow key={faq.id}>
                                    <TableCell className="font-medium">
                                        <div className="max-w-[300px] truncate">
                                            {language === "bn" ? faq.question.bn : faq.question.en}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[300px] truncate text-muted-foreground">
                                            {language === "bn" ? faq.answer.bn : faq.answer.en}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(faq)}
                                            className={faq.is_active ? "text-success" : "text-destructive"}
                                        >
                                            {faq.is_active ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                            {faq.is_active ? t("active") : t("inactive")}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleOpenDialog(faq)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => setConfirmDelete(faq.id)}
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
                        <DialogTitle>{editingFAQ ? (language === "bn" ? "FAQ এডিট করুন" : "Edit FAQ") : (language === "bn" ? "নতুন FAQ যোগ করুন" : "Add New FAQ")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">Bangla Content</h4>
                            <div className="space-y-2">
                                <Label>প্রশ্ন (Bangla)</Label>
                                <Input
                                    value={formData.question.bn}
                                    onChange={(e) => setFormData({ ...formData, question: { ...formData.question, bn: e.target.value } })}
                                    placeholder="আপনার প্রশ্ন লিখুন..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>উত্তর (Bangla)</Label>
                                <Textarea
                                    value={formData.answer.bn}
                                    onChange={(e) => setFormData({ ...formData, answer: { ...formData.answer, bn: e.target.value } })}
                                    placeholder="বিস্তারিত উত্তর লিখুন..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">English Content</h4>
                            <div className="space-y-2">
                                <Label>Question (English)</Label>
                                <Input
                                    value={formData.question.en}
                                    onChange={(e) => setFormData({ ...formData, question: { ...formData.question, en: e.target.value } })}
                                    placeholder="Write your question..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Answer (English)</Label>
                                <Textarea
                                    value={formData.answer.en}
                                    onChange={(e) => setFormData({ ...formData, answer: { ...formData.answer, en: e.target.value } })}
                                    placeholder="Write the detailed answer..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t("cancel")}
                        </Button>
                        <Button onClick={handleSubmit} disabled={createFAQ.isPending || updateFAQ.isPending}>
                            {(createFAQ.isPending || updateFAQ.isPending) && (
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
                title={language === "bn" ? "FAQ মুছে ফেলুন" : "Delete FAQ"}
                description={language === "bn" ? "আপনি কি নিশ্চিত যে আপনি এই প্রশ্নটি স্থায়ীভাবে মুছে ফেলতে চান?" : "Are you sure you want to permanently delete this FAQ?"}
                confirmLabel={t("delete")}
                cancelLabel={t("cancel")}
                type="destructive"
            />
        </div>
    );
};
