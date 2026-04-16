import { useState } from "react";
import {
    Edit2,
    Loader2,
    Eye,
    EyeOff,
    Search,
} from "lucide-react";
import {
    useAdminAffiliatePageContent,
    useUpdateAffiliatePageContent,
} from "@/hooks/useAffiliatePageContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { AffiliatePageContent } from "@/types/affiliate_page_content";

const SECTION_LABELS: Record<string, { bn: string; en: string }> = {
    hero: { bn: "হিরো সেকশন", en: "Hero Section" },
    success_stories: { bn: "সাফল্যের গল্প", en: "Success Stories" },
    mid_cta: { bn: "মিড CTA", en: "Mid CTA" },
    faq: { bn: "FAQ হেডিং", en: "FAQ Heading" },
    final_cta: { bn: "ফাইনাল CTA", en: "Final CTA" },
    contact: { bn: "যোগাযোগ", en: "Contact" },
};

export const AffiliatePageContentManagement = () => {
    const { language, t } = useLanguage();
    const { data: items, isLoading } = useAdminAffiliatePageContent();
    const updateContent = useUpdateAffiliatePageContent();

    const [searchQuery, setSearchQuery] = useState("");
    const [editingItem, setEditingItem] = useState<AffiliatePageContent | null>(null);
    const [formData, setFormData] = useState({ bn: "", en: "" });

    const filteredItems = items?.filter(
        (item) =>
            item.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.value.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.value.bn.includes(searchQuery)
    );

    const handleOpenEdit = (item: AffiliatePageContent) => {
        setEditingItem(item);
        setFormData({ bn: item.value.bn, en: item.value.en });
    };

    const handleSave = async () => {
        if (!editingItem) return;
        try {
            await updateContent.mutateAsync({
                id: editingItem.id,
                value: { bn: formData.bn, en: formData.en },
            });
            toast.success(
                language === "bn" ? "কন্টেন্ট আপডেট হয়েছে" : "Content updated successfully"
            );
            setEditingItem(null);
        } catch {
            toast.error(t("somethingWentWrong"));
        }
    };

    const handleToggleStatus = async (item: AffiliatePageContent) => {
        try {
            await updateContent.mutateAsync({
                id: item.id,
                is_active: !item.is_active,
            });
            toast.success(t("statusUpdated"));
        } catch {
            toast.error(t("somethingWentWrong"));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                    {language === "bn" ? "লোড হচ্ছে..." : "Loading page content..."}
                </p>
            </div>
        );
    }

    const isLong = (text: string) => text.length > 60;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {language === "bn" ? "ল্যান্ডিং পেজ কন্টেন্ট" : "Landing Page Content"}
                    </h2>
                    <p className="text-muted-foreground">
                        {language === "bn"
                            ? "অ্যাফিলিয়েট ল্যান্ডিং পেজের সব টেক্সট এখানে সম্পাদনা করুন।"
                            : "Edit all text content on the affiliate landing page."}
                    </p>
                </div>
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
                            <TableHead className="w-[18%]">
                                {language === "bn" ? "সেকশন" : "Section"}
                            </TableHead>
                            <TableHead className="w-[14%]">
                                {language === "bn" ? "কী" : "Key"}
                            </TableHead>
                            <TableHead className="w-[28%]">
                                {language === "bn" ? "বাংলা" : "Bangla"}
                            </TableHead>
                            <TableHead className="w-[28%]">
                                {language === "bn" ? "ইংরেজি" : "English"}
                            </TableHead>
                            <TableHead>
                                {language === "bn" ? "স্ট্যাটাস" : "Status"}
                            </TableHead>
                            <TableHead className="text-right">
                                {language === "bn" ? "অ্যাকশন" : "Actions"}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                    {language === "bn" ? "কোনো কন্টেন্ট পাওয়া যায়নি" : "No content found"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems?.map((item) => {
                                const sectionLabel =
                                    SECTION_LABELS[item.section]?.[language] ?? item.section;
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-medium">
                                                {sectionLabel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {item.key}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate text-sm">
                                                {isLong(item.value.bn) ? item.value.bn.slice(0, 60) + "…" : item.value.bn}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                                                {isLong(item.value.en) ? item.value.en.slice(0, 60) + "…" : item.value.en}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(item)}
                                                className={item.is_active ? "text-success" : "text-destructive"}
                                            >
                                                {item.is_active ? (
                                                    <Eye className="h-4 w-4 mr-1" />
                                                ) : (
                                                    <EyeOff className="h-4 w-4 mr-1" />
                                                )}
                                                {item.is_active ? t("active") : t("inactive")}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleOpenEdit(item)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {language === "bn" ? "কন্টেন্ট সম্পাদনা করুন" : "Edit Content"}
                            {editingItem && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground font-mono">
                                    {editingItem.section} / {editingItem.key}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">Bangla Content</h4>
                            <div className="space-y-2">
                                <Label>মান (Bangla)</Label>
                                <Textarea
                                    value={formData.bn}
                                    onChange={(e) =>
                                        setFormData({ ...formData, bn: e.target.value })
                                    }
                                    placeholder="বাংলায় লিখুন..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">English Content</h4>
                            <div className="space-y-2">
                                <Label>Value (English)</Label>
                                <Textarea
                                    value={formData.en}
                                    onChange={(e) =>
                                        setFormData({ ...formData, en: e.target.value })
                                    }
                                    placeholder="Write in English..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>
                            {t("cancel")}
                        </Button>
                        <Button onClick={handleSave} disabled={updateContent.isPending}>
                            {updateContent.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t("save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
