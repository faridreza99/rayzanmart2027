import { useState, useMemo } from "react";
import { Loader2, Plus, Pencil, Trash2, ChevronRight, FolderTree, Search, Filter, Download, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from "@/hooks/useCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EnterpriseEmptyState } from "./EnterpriseEmptyState";
import { EnterpriseConfirmDialog } from "./EnterpriseConfirmDialog";
import { ItemStateIndicator } from "./ItemStateIndicator";
import { EnterpriseImportExport } from "./EnterpriseImportExport";
import { EnterprisePagination } from "./EnterprisePagination";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { IconPicker } from "@/components/ui/IconPicker";

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const CategoryManagement = () => {
  const { language, t } = useLanguage();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [form, setForm] = useState({
    name_bn: "",
    name_en: "",
    slug: "",
    icon: "📦",
    sort_order: 0,
    parent_id: null as string | null,
    is_active: true,
    meta_title: "",
    meta_description: "",
    visible_on_website: true,
    visible_in_search: true,
  });

  const mainCategories = useMemo(() => {
    return categories?.filter((c) => !c.parent_id) || [];
  }, [categories]);

  const getSubCategories = (parentId: string) => {
    return categories?.filter((c) => c.parent_id === parentId) || [];
  };

  const filteredCategories = useMemo(() => {
    let filtered = categories || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name_bn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.name_en.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => (statusFilter === "active" ? c.is_active : !c.is_active));
    }

    return filtered;
  }, [categories, searchTerm, statusFilter]);

  const resetForm = () => {
    setForm({
      name_bn: "",
      name_en: "",
      slug: "",
      icon: "📦",
      sort_order: 0,
      parent_id: null,
      is_active: true,
      meta_title: "",
      meta_description: "",
      visible_on_website: true,
      visible_in_search: true,
    });
    setEditingCategory(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name_bn: category.name_bn,
      name_en: category.name_en,
      slug: category.slug || "",
      icon: category.icon || "📦",
      sort_order: category.sort_order,
      parent_id: category.parent_id,
      is_active: category.is_active,
      meta_title: (category as any).meta_title || "",
      meta_description: (category as any).meta_description || "",
      visible_on_website: (category as any).visible_on_website !== false,
      visible_in_search: (category as any).visible_in_search !== false,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (value: string, field: "name_bn" | "name_en") => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name_en" && !editingCategory) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...form,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
        } as any);
        toast.success(t("categoryUpdated" as any));
      } else {
        await createCategory.mutateAsync({
          ...form,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
        } as any);
        toast.success(t("categoryCreated" as any));
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast.success(t("categoryDeleted" as any));
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error: any) {
      if (error.message === "CATEGORY_HAS_PRODUCTS") {
        toast.error(t("categoryHasProducts" as any));
      } else if (error.message === "CATEGORY_HAS_SUBCATEGORIES") {
        toast.error(t("categoryHasSubcategories" as any));
      } else {
        toast.error(t("somethingWentWrong"));
      }
    }
  };

  const confirmDelete = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{t("categoryManagement")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "bn"
                ? "হায়ারার্কিক্যাল ক্যাটাগরি স্ট্রাকচার ম্যানেজ করুন"
                : "Manage hierarchical category structure"}
            </p>
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t("addCategory" as any)}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            {t("importExport" as any)}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses" as any)}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="inactive">{t("inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCategories.length === 0 ? (
            <EnterpriseEmptyState
              icon={FolderTree}
              title={t("noCategoriesYet" as any)}
              description={t("noCategoriesDescription" as any)}
              actionLabel={t("addCategory" as any)}
              onAction={openCreateDialog}
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[300px]">{t("name")}</TableHead>
                    <TableHead>{t("categorySlug" as any)}</TableHead>
                    <TableHead className="text-center">{t("sortOrder" as any)}</TableHead>
                    <TableHead className="text-center">{t("orderStatus")}</TableHead>
                    <TableHead className="text-center">{language === "bn" ? "দৃশ্যমানতা" : "Visibility"}</TableHead>
                    <TableHead className="text-right">{t("lastUpdated")}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainCategories
                    .filter((c) => filteredCategories.some((fc) => fc.id === c.id || fc.parent_id === c.id))
                    .map((category) => (
                      <>
                        <TableRow key={category.id} className="bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DynamicIcon name={category.icon} className="h-5 w-5 text-primary" fallback="📦" />
                              <div>
                                <p className="font-medium">{category.name_bn}</p>
                                <p className="text-xs text-muted-foreground">{category.name_en}</p>
                              </div>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {t("mainCategory" as any)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {category.slug || "-"}
                          </TableCell>
                          <TableCell className="text-center">{category.sort_order}</TableCell>
                          <TableCell className="text-center">
                            <ItemStateIndicator state={category.is_active ? "active" : "paused"} size="sm" />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              {(category as any).visible_on_website !== false ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {category.updated_at ? format(new Date(category.updated_at), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => confirmDelete(category)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {getSubCategories(category.id)
                          .filter((sub) => filteredCategories.some((fc) => fc.id === sub.id))
                          .map((subCategory) => (
                            <TableRow key={subCategory.id}>
                              <TableCell>
                                <div className="flex items-center gap-2 pl-8">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  <DynamicIcon name={subCategory.icon} className="h-5 w-5 text-primary" fallback="📦" />
                                  <div>
                                    <p className="font-medium">{subCategory.name_bn}</p>
                                    <p className="text-xs text-muted-foreground">{subCategory.name_en}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-muted-foreground">
                                {subCategory.slug || "-"}
                              </TableCell>
                              <TableCell className="text-center">{subCategory.sort_order}</TableCell>
                              <TableCell className="text-center">
                                <ItemStateIndicator state={subCategory.is_active ? "active" : "paused"} size="sm" />
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-1">
                                  {(subCategory as any).visible_on_website !== false ? (
                                    <Eye className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {subCategory.updated_at ? format(new Date(subCategory.updated_at), "MMM d, yyyy") : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(subCategory)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => confirmDelete(subCategory)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </>
                    ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t("editCategory" as any) : t("addCategory" as any)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("categoryNameBn" as any)} *</Label>
                <Input value={form.name_bn} onChange={(e) => handleNameChange(e.target.value, "name_bn")} />
              </div>
              <div className="space-y-2">
                <Label>{t("categoryNameEn" as any)} *</Label>
                <Input value={form.name_en} onChange={(e) => handleNameChange(e.target.value, "name_en")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("categorySlug" as any)}</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder={t("slugAutoGenerated" as any)}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("categoryIcon" as any)}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.icon || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g. 📦 or Shirt"
                    className="flex-1"
                  />
                  <IconPicker
                    value={form.icon || ""}
                    onChange={(value) => setForm((prev) => ({ ...prev, icon: value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("sortOrder" as any)}</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("parentCategory" as any)}</Label>
              <Select
                value={form.parent_id || "none"}
                onValueChange={(v) => setForm((prev) => ({ ...prev, parent_id: v === "none" ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("noParent" as any)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noParent" as any)}</SelectItem>
                  {mainCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <DynamicIcon name={cat.icon} className="h-4 w-4" fallback="📦" />
                          <span>{language === "bn" ? cat.name_bn : cat.name_en}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>{t("active")}</Label>
                {!form.is_active && !form.parent_id && (
                  <p className="text-xs text-muted-foreground mt-1">{t("inactiveHidesSubcategories" as any)}</p>
                )}
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>

            {/* SEO Settings */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">{t("seoSettings" as any)}</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t("metaTitle" as any)}</Label>
                  <Input
                    value={form.meta_title}
                    onChange={(e) => setForm((prev) => ({ ...prev, meta_title: e.target.value }))}
                    placeholder={language === "bn" ? "সার্চ রেজাল্টে টাইটেল" : "Title in search results"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("metaDescription" as any)}</Label>
                  <Textarea
                    value={form.meta_description}
                    onChange={(e) => setForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                    rows={2}
                    placeholder={language === "bn" ? "সার্চ ইঞ্জিনে বিবরণ" : "Description for search engines"}
                  />
                </div>
              </div>
            </div>

            {/* Visibility Controls */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">{t("visibilitySettings" as any)}</h4>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.visible_on_website}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, visible_on_website: checked }))}
                  />
                  <Label>{t("visibleOnWebsite" as any)}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.visible_in_search}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, visible_in_search: checked }))}
                  />
                  <Label>{t("visibleInSearch" as any)}</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name_bn || !form.name_en || createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <EnterpriseConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("confirmDeleteCategory" as any)}
        description={t("confirmDeleteCategoryDesc" as any)}
        type="destructive"
        impacts={[
          {
            label: t("categories"),
            value: deletingCategory ? (language === "bn" ? deletingCategory.name_bn : deletingCategory.name_en) : "",
          },
        ]}
        onConfirm={handleDelete}
      />

      {/* Import/Export Dialog */}
      <EnterpriseImportExport
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        entityType="categories"
        onExport={() => {
          const headers = ["Name (BN)", "Name (EN)", "Slug", "Icon", "Sort Order", "Parent", "Status"];
          const rows = (categories || []).map((c) => [
            c.name_bn,
            c.name_en,
            c.slug || "",
            c.icon || "",
            c.sort_order,
            c.parent_id ? (categories?.find((p) => p.id === c.parent_id)?.name_en || "") : "",
            c.is_active ? "active" : "inactive",
          ]);
          const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `categories-export-${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
        }}
        totalItems={(categories || []).length}
      />
    </div>
  );
};