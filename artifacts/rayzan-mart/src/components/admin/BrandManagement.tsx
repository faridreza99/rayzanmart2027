 import { useState, useMemo } from "react";
 import { Loader2, Plus, Pencil, Trash2, Tag, Search, Filter, Download, Eye, EyeOff, ChevronDown } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, Brand } from "@/hooks/useBrands";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
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
 
 const generateSlug = (text: string) => {
   return text
     .toLowerCase()
     .replace(/[^a-z0-9\s-]/g, "")
     .replace(/\s+/g, "-")
     .replace(/-+/g, "-")
     .trim();
 };
 
 export const BrandManagement = () => {
   const { language, t } = useLanguage();
   const { data: brands, isLoading } = useBrands();
   const createBrand = useCreateBrand();
   const updateBrand = useUpdateBrand();
   const deleteBrand = useDeleteBrand();
 
   const [dialogOpen, setDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
   const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
   const [searchTerm, setSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
   const [importExportOpen, setImportExportOpen] = useState(false);
   const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(25);
 
   const [form, setForm] = useState({
     name_bn: "",
     name_en: "",
     slug: "",
     logo_url: "",
     is_active: true,
     meta_title: "",
     meta_description: "",
     visible_on_website: true,
     visible_in_search: true,
   });
 
   const filteredBrands = useMemo(() => {
     let filtered = brands || [];
 
     if (searchTerm) {
       filtered = filtered.filter(
         (b) =>
           b.name_bn.toLowerCase().includes(searchTerm.toLowerCase()) ||
           b.name_en.toLowerCase().includes(searchTerm.toLowerCase())
       );
     }
 
     if (statusFilter !== "all") {
       filtered = filtered.filter((b) => (statusFilter === "active" ? b.is_active : !b.is_active));
     }
 
     return filtered;
   }, [brands, searchTerm, statusFilter]);
 
   const resetForm = () => {
     setForm({
       name_bn: "",
       name_en: "",
       slug: "",
       logo_url: "",
       is_active: true,
       meta_title: "",
       meta_description: "",
       visible_on_website: true,
       visible_in_search: true,
     });
     setEditingBrand(null);
   };
 
   const openCreateDialog = () => {
     resetForm();
     setDialogOpen(true);
   };
 
   const openEditDialog = (brand: Brand) => {
     setEditingBrand(brand);
     setForm({
       name_bn: brand.name_bn,
       name_en: brand.name_en,
       slug: brand.slug || "",
       logo_url: brand.logo_url || "",
       is_active: brand.is_active,
       meta_title: (brand as any).meta_title || "",
       meta_description: (brand as any).meta_description || "",
       visible_on_website: (brand as any).visible_on_website !== false,
       visible_in_search: (brand as any).visible_in_search !== false,
     });
     setDialogOpen(true);
   };
 
   const handleNameChange = (value: string, field: "name_bn" | "name_en") => {
     setForm((prev) => {
       const updated = { ...prev, [field]: value };
       if (field === "name_en" && !editingBrand) {
         updated.slug = generateSlug(value);
       }
       return updated;
     });
   };
 
   const handleSubmit = async () => {
     try {
       if (editingBrand) {
         await updateBrand.mutateAsync({ 
           id: editingBrand.id, 
           ...form,
           meta_title: form.meta_title || null,
           meta_description: form.meta_description || null,
         } as any);
         toast.success(t("brandUpdated" as any));
       } else {
         await createBrand.mutateAsync({
           ...form,
           meta_title: form.meta_title || null,
           meta_description: form.meta_description || null,
         } as any);
         toast.success(t("brandCreated" as any));
       }
       setDialogOpen(false);
       resetForm();
     } catch (error) {
       toast.error(t("somethingWentWrong"));
     }
   };
 
   const handleDelete = async () => {
     if (!deletingBrand) return;
     try {
       await deleteBrand.mutateAsync(deletingBrand.id);
       toast.success(t("brandDeleted" as any));
       setDeleteDialogOpen(false);
       setDeletingBrand(null);
     } catch (error: any) {
       if (error.message === "BRAND_HAS_PRODUCTS") {
         toast.error(t("brandHasProducts" as any));
       } else {
         toast.error(t("somethingWentWrong"));
       }
     }
   };
 
   const confirmDelete = (brand: Brand) => {
     setDeletingBrand(brand);
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
             <CardTitle>{t("brandManagement")}</CardTitle>
             <p className="text-sm text-muted-foreground mt-1">
               {language === "bn" ? "পণ্যের ব্র্যান্ড ম্যানেজ করুন" : "Manage product brands"}
             </p>
           </div>
           <Button onClick={openCreateDialog} size="sm">
             <Plus className="h-4 w-4 mr-2" />
             {t("addBrand" as any)}
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
 
           {filteredBrands.length === 0 ? (
             <EnterpriseEmptyState
               icon={Tag}
               title={t("noBrandsYet" as any)}
               description={t("noBrandsDescription" as any)}
              actionLabel={t("addBrand" as any)}
              onAction={openCreateDialog}
             />
           ) : (
             <div className="border rounded-lg overflow-hidden">
               <Table>
                 <TableHeader className="sticky top-0 bg-background z-10">
                   <TableRow>
                     <TableHead className="w-[80px]">{t("brandLogo" as any)}</TableHead>
                     <TableHead>{t("name")}</TableHead>
                     <TableHead>{t("brandSlug" as any)}</TableHead>
                     <TableHead className="text-center">{t("orderStatus")}</TableHead>
                     <TableHead className="text-center">{language === "bn" ? "দৃশ্যমানতা" : "Visibility"}</TableHead>
                     <TableHead className="text-right">{t("lastUpdated")}</TableHead>
                     <TableHead className="w-[100px]"></TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredBrands.map((brand) => (
                     <TableRow key={brand.id}>
                       <TableCell>
                         {brand.logo_url ? (
                           <img
                             src={brand.logo_url}
                             alt={brand.name_en}
                             className="h-10 w-10 rounded object-contain bg-muted"
                           />
                         ) : (
                           <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                             <Tag className="h-5 w-5" />
                           </div>
                         )}
                       </TableCell>
                       <TableCell>
                         <div>
                           <p className="font-medium">{brand.name_bn}</p>
                           <p className="text-sm text-muted-foreground">{brand.name_en}</p>
                         </div>
                       </TableCell>
                       <TableCell className="font-mono text-sm text-muted-foreground">
                         {brand.slug || "-"}
                       </TableCell>
                       <TableCell className="text-center">
                         <ItemStateIndicator state={brand.is_active ? "active" : "paused"} size="sm" />
                       </TableCell>
                       <TableCell className="text-center">
                         <div className="flex justify-center gap-1">
                           {(brand as any).visible_on_website !== false ? (
                             <Eye className="h-4 w-4 text-green-500" />
                           ) : (
                             <EyeOff className="h-4 w-4 text-muted-foreground" />
                           )}
                         </div>
                       </TableCell>
                       <TableCell className="text-right text-sm text-muted-foreground">
                         {brand.updated_at ? format(new Date(brand.updated_at), "MMM d, yyyy") : "-"}
                       </TableCell>
                       <TableCell>
                         <div className="flex justify-end gap-1">
                           <Button variant="ghost" size="icon" onClick={() => openEditDialog(brand)}>
                             <Pencil className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="text-destructive hover:text-destructive"
                             onClick={() => confirmDelete(brand)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Create/Edit Dialog */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>{editingBrand ? t("editBrand" as any) : t("addBrand" as any)}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>{t("brandNameBn" as any)} *</Label>
                 <Input value={form.name_bn} onChange={(e) => handleNameChange(e.target.value, "name_bn")} />
               </div>
               <div className="space-y-2">
                 <Label>{t("brandNameEn" as any)} *</Label>
                 <Input value={form.name_en} onChange={(e) => handleNameChange(e.target.value, "name_en")} />
               </div>
             </div>
 
             <div className="space-y-2">
               <Label>{t("brandSlug" as any)}</Label>
               <Input
                 value={form.slug}
                 onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                 placeholder={t("slugAutoGenerated" as any)}
                 className="font-mono"
               />
             </div>
 
             <div className="space-y-2">
               <Label>{t("brandLogo" as any)}</Label>
               <Input
                 value={form.logo_url}
                 onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                 placeholder="https://..."
               />
               {form.logo_url && (
                 <img src={form.logo_url} alt="Preview" className="h-16 w-16 rounded object-contain bg-muted mt-2" />
               )}
             </div>
 
             <div className="flex items-center justify-between py-2">
               <div>
                 <Label>{t("active")}</Label>
                 {!form.is_active && (
                   <p className="text-xs text-muted-foreground mt-1">{t("inactiveBrandHidesProducts" as any)}</p>
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
               disabled={!form.name_bn || !form.name_en || createBrand.isPending || updateBrand.isPending}
             >
               {(createBrand.isPending || updateBrand.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               {t("save")}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation */}
       <EnterpriseConfirmDialog
         open={deleteDialogOpen}
         onOpenChange={setDeleteDialogOpen}
         title={t("confirmDeleteBrand" as any)}
         description={t("confirmDeleteBrandDesc" as any)}
        type="destructive"
         impacts={[
           {
             label: t("brandManagement"),
             value: deletingBrand ? (language === "bn" ? deletingBrand.name_bn : deletingBrand.name_en) : "",
           },
         ]}
         onConfirm={handleDelete}
       />

       {/* Import/Export Dialog */}
       <EnterpriseImportExport
         open={importExportOpen}
         onOpenChange={setImportExportOpen}
         entityType="brands"
         onExport={() => {
           const headers = ["Name (BN)", "Name (EN)", "Slug", "Logo URL", "Status"];
           const rows = (brands || []).map((b) => [
             b.name_bn,
             b.name_en,
             b.slug || "",
             b.logo_url || "",
             b.is_active ? "active" : "inactive",
           ]);
           const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
           const blob = new Blob([csv], { type: "text/csv" });
           const url = URL.createObjectURL(blob);
           const a = document.createElement("a");
           a.href = url;
           a.download = `brands-export-${new Date().toISOString().split("T")[0]}.csv`;
           a.click();
         }}
         totalItems={(brands || []).length}
       />
     </div>
   );
 };