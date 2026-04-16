import { useState, useMemo } from "react";
import { Loader2, Plus, Pencil, Package, Search, Filter, Check, X, ChevronDown, Download, Trash2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, DBProduct } from "@/hooks/useProducts";
import { useCategories, Category } from "@/hooks/useCategories";
import { useBrands, Brand } from "@/hooks/useBrands";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { EnterpriseEmptyState } from "./EnterpriseEmptyState";
import { EnterpriseConfirmDialog } from "./EnterpriseConfirmDialog";
import { ItemStateIndicator, ItemState } from "./ItemStateIndicator";
import { EnterpriseBulkActions } from "./EnterpriseBulkActions";
import { EnterpriseImportExport } from "./EnterpriseImportExport";
import { EnterpriseAuditInfo } from "./EnterpriseAuditInfo";
import { EnterprisePagination } from "./EnterprisePagination";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SingleImageUpload, GalleryImageUpload } from "./CloudinaryImageUpload";
import { ProductVariantsForm, VariantOption, VariantFormData } from "./ProductVariantsForm";

type ProductStatus = "active" | "inactive" | "draft";

export const ProductManagement = () => {
  const { language, t } = useLanguage();
  const { data: products, isLoading: productsLoading, refetch } = useProducts(undefined, true);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [bulkActionType, setBulkActionType] = useState("");

  const [form, setForm] = useState({
    name_bn: "",
    name_en: "",
    description_bn: "",
    description_en: "",
    category_id: "",
    brand_id: "",
    sku: "",
    price: 0,
    original_price: 0,
    discount_type: "percentage",
    discount_value: 0,
    stock: 0,
    image_url: "",
    gallery_images: [] as string[],
    product_status: "active" as ProductStatus,
    is_featured: false,
    meta_title: "",
    meta_description: "",
    visible_on_website: true,
    visible_in_search: true,
    has_variants: false,
    variant_options: [] as VariantOption[],
    product_variants: [] as VariantFormData[],
    affiliate_commission_type: "percentage",
    affiliate_commission_value: 0,
    cost_price: 0,
  });

  const mainCategories = useMemo(() => {
    return categories?.filter((c) => !c.parent_id && c.is_active) || [];
  }, [categories]);

  const getSubCategories = (parentId: string) => {
    return categories?.filter((c) => c.parent_id === parentId && c.is_active) || [];
  };

  const activeBrands = useMemo(() => {
    return brands?.filter((b) => b.is_active) || [];
  }, [brands]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.bn.toLowerCase().includes(term) ||
          p.name.en.toLowerCase().includes(term) ||
          (p as any).sku?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (brandFilter !== "all") {
      filtered = filtered.filter((p) => (p as any).brand_id === brandFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        const status = (p as any).product_status || "active";
        return status === statusFilter;
      });
    }

    return filtered;
  }, [products, searchTerm, categoryFilter, brandFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetForm = () => {
    setForm({
      name_bn: "",
      name_en: "",
      description_bn: "",
      description_en: "",
      category_id: "",
      brand_id: "",
      sku: "",
      price: 0,
      original_price: 0,
      discount_type: "percentage",
      discount_value: 0,
      stock: 0,
      image_url: "",
      gallery_images: [],
      product_status: "active",
      is_featured: false,
      meta_title: "",
      meta_description: "",
      visible_on_website: true,
      visible_in_search: true,
      has_variants: false,
      variant_options: [],
      product_variants: [],
      affiliate_commission_type: "percentage",
      affiliate_commission_value: 0,
      cost_price: 0,
    });
    setEditingProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };
  const openEditDialog = async (productId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*, product_variants(*)")
        .eq("id", productId)
        .maybeSingle();
      
      if (data) {
        const productData = data as any;
        const basePrice = Number(productData.original_price ?? productData.price) || 0;
        const currentPrice = Number(productData.price) || 0;
        const normalizedDiscountType = productData.discount_type || "percentage";
        let normalizedDiscountValue = Number(productData.discount_value) || 0;
        if (!normalizedDiscountValue && Number(productData.discount_percent) > 0) {
          if (normalizedDiscountType === "percentage") {
            normalizedDiscountValue = Number(productData.discount_percent);
          } else if (basePrice > 0 && currentPrice > 0) {
            normalizedDiscountValue = Math.max(0, basePrice - currentPrice);
          }
        }
  
        setEditingProduct(productData);
        setForm({
          name_bn: productData.name_bn,
          name_en: productData.name_en,
          description_bn: productData.description_bn || "",
          description_en: productData.description_en || "",
          category_id: productData.category_id || "",
          brand_id: productData.brand_id || "",
          sku: productData.sku || "",
          price: basePrice,
          original_price: Number(productData.original_price) || 0,
          discount_type: normalizedDiscountType,
          discount_value: normalizedDiscountValue,
          stock: productData.stock,
          image_url: productData.image_url || "",
          gallery_images: (productData.gallery_images as string[]) || [],
          product_status: (productData.product_status || "active") as ProductStatus,
          is_featured: productData.is_featured || false,
          meta_title: productData.meta_title || "",
          meta_description: productData.meta_description || "",
          visible_on_website: productData.visible_on_website !== false,
          visible_in_search: productData.visible_in_search !== false,
          has_variants: productData.has_variants || false,
          variant_options: (productData.variant_options as any) || [],
          product_variants: (productData.product_variants as any) || [],
          affiliate_commission_type: productData.affiliate_commission_type || "percentage",
          affiliate_commission_value: Number(productData.affiliate_commission_value) || 0,
          cost_price: Number(productData.cost_price) || 0,
        });
      setDialogOpen(true);
      }
    } catch (error: any) {
      console.error("Fetch product error:", error);
      toast.error(t("somethingWentWrong") + " - " + (error?.message || ""));
    }
  };

  const calculateFinalPrice = () => {
    const basePrice = Number(form.price) || 0;
    const discountValue = Number(form.discount_value) || 0;
    if (form.discount_type === "percentage") {
      return Math.max(0, basePrice - (basePrice * discountValue) / 100);
    }
    return Math.max(0, basePrice - discountValue);
  };

  const handleSubmit = async () => {
    if (!form.category_id) {
      toast.error(t("categoryRequired" as any));
      return;
    }

    try {
      const basePrice = Number(form.price) || 0;
      const rawDiscountValue = Number(form.discount_value) || 0;
      const discountPercent =
        form.discount_type === "percentage"
          ? Math.max(0, Math.min(100, rawDiscountValue))
          : basePrice > 0
            ? Math.max(0, Math.round((rawDiscountValue / basePrice) * 100))
            : 0;
      const finalPrice = Math.max(
        0,
        form.discount_type === "percentage"
          ? basePrice - (basePrice * discountPercent) / 100
          : basePrice - rawDiscountValue
      );
      const shouldPersistDiscount =
        !form.has_variants && basePrice > 0 && discountPercent > 0 && finalPrice < basePrice;

      const productData: any = {
        name_bn: form.name_bn,
        name_en: form.name_en,
        description_bn: form.description_bn || null,
        description_en: form.description_en || null,
        category_id: form.category_id || null,
        brand: form.brand_id || null,
        price: shouldPersistDiscount ? finalPrice : basePrice,
        original_price: shouldPersistDiscount ? basePrice : null,
        discount_type: shouldPersistDiscount ? form.discount_type : null,
        discount_value: shouldPersistDiscount ? rawDiscountValue : 0,
        discount_percent: shouldPersistDiscount ? discountPercent : 0,
        stock: form.has_variants ? form.product_variants.reduce((acc, v) => acc + (v.is_active ? v.stock : 0), 0) : form.stock,
        image_url: form.image_url || null,
        gallery_images: form.gallery_images,
        product_status: form.product_status,
        is_featured: form.is_featured,
        is_active: form.product_status === "active",
        sku: form.sku || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        visible_on_website: form.visible_on_website,
        visible_in_search: form.visible_in_search,
        has_variants: form.has_variants,
        variant_options: form.variant_options,
        affiliate_commission_type: form.affiliate_commission_type,
        affiliate_commission_value: form.affiliate_commission_value,
        cost_price: form.cost_price,
      };

      let savedProduct: any;
      if (editingProduct) {
        savedProduct = await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast.success(t("productUpdated" as any));
      } else {
        savedProduct = await createProduct.mutateAsync(productData);
        toast.success(t("productCreated" as any));
      }

      // Save variants if applicable
      if (form.has_variants && form.product_variants.length > 0) {
        const variantsData = form.product_variants.map(v => {
          const variantPayload: any = {
            product_id: savedProduct.id,
            name_en: v.name_en,
            name_bn: v.name_bn,
            sku: v.sku || null,
            price: v.price,
            cost_price: v.cost_price || 0,
            stock: v.stock,
            attributes: v.attributes,
            is_active: v.is_active
          };
          if (v.id) {
            variantPayload.id = v.id;
          }
          return variantPayload;
        });
        const { data: upsertData, error: upsertError } = await supabase.from("product_variants").upsert(variantsData).select();
        if (upsertError) {
          console.error("Variant upsert error:", upsertError);
          toast.error("Variations failed to save: " + upsertError.message);
          return;
        }
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(t("somethingWentWrong") + " - " + (error?.message || ""));
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map((p) => p.id));
    }
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;

    try {
      let updateData: any = {};

      if (bulkAction === "activate") {
        updateData = { product_status: "active", is_active: true };
      } else if (bulkAction === "deactivate") {
        updateData = { product_status: "inactive", is_active: false };
      }

      for (const id of selectedProducts) {
        await supabase.from("products").update(updateData).eq("id", id);
      }

      toast.success(t("productsUpdated" as any));
      setSelectedProducts([]);
      setBulkDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct.mutateAsync(productToDelete);
      toast.success(language === "bn" ? "পণ্য মুছে ফেলা হয়েছে" : "Product deleted successfully");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      refetch();
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      for (const id of selectedProducts) {
        await deleteProduct.mutateAsync(id);
      }
      toast.success(language === "bn" ? `${selectedProducts.length}টি পণ্য মুছে ফেলা হয়েছে` : `${selectedProducts.length} products deleted`);
      setSelectedProducts([]);
      setBulkDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const openBulkDialog = (action: string) => {
    setBulkAction(action);
    setBulkDialogOpen(true);
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories?.find((c) => c.id === categoryId);
    return cat ? (language === "bn" ? cat.name_bn : cat.name_en) : "-";
  };

  const getBrandName = (brandId: string | undefined) => {
    if (!brandId) return "-";
    const brand = brands?.find((b) => b.id === brandId);
    return brand ? (language === "bn" ? brand.name_bn : brand.name_en) : "-";
  };

  const getProductState = (product: any): ItemState => {
    const status = product.product_status || (product.is_active !== false ? "active" : "inactive");
    if (status === "active") return "active";
    if (status === "draft") return "draft";
    return "paused";
  };

  if (productsLoading) {
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
            <CardTitle>{t("productManagement")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "bn"
                ? "এন্টারপ্রাইজ-গ্রেড পণ্য ম্যানেজমেন্ট"
                : "Enterprise-grade product management"}
            </p>
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t("addProduct" as any)}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t("search")} / ${t("searchBySKU" as any)}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("allCategories" as any)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories" as any)}</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.parent_id ? "↳ " : ""}{language === "bn" ? cat.name_bn : cat.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("allBrands" as any)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allBrands" as any)}</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {language === "bn" ? brand.name_bn : brand.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("allStatuses" as any)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses" as any)}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="inactive">{t("inactive")}</SelectItem>
                <SelectItem value="draft">{t("draftStatus" as any)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedProducts.length} {t("selectedOrders")}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {t("bulkActions")} <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => openBulkDialog("activate")}>
                    <Check className="h-4 w-4 mr-2" /> {t("bulkActivate" as any)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openBulkDialog("deactivate")}>
                    <X className="h-4 w-4 mr-2" /> {t("bulkDeactivate" as any)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openBulkDialog("delete")} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> {t("delete" as any)}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <EnterpriseEmptyState
              icon={Package}
              title={t("noProducts")}
              description={language === "bn" ? "পণ্য যোগ করে আপনার ক্যাটালগ তৈরি করুন।" : "Add products to build your catalog."}
              actionLabel={t("addProduct" as any)}
              onAction={openCreateDialog}
            />
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[80px]">{t("productImage" as any)}</TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("sku" as any)}</TableHead>
                      <TableHead>{t("categories")}</TableHead>
                      <TableHead>{t("brandManagement")}</TableHead>
                      <TableHead className="text-right">{t("price")}</TableHead>
                      <TableHead className="text-center">{t("stock")}</TableHead>
                      <TableHead className="text-center">{t("orderStatus")}</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow key={product.id} className={selectedProducts.includes(product.id) ? "bg-muted/30" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelect(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <img
                            src={product.image}
                            alt={product.name.en}
                            className="h-12 w-12 rounded object-cover bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium line-clamp-1">{product.name.bn}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{product.name.en}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {(product as any).sku || "-"}
                        </TableCell>
                        <TableCell className="text-sm">{getCategoryName(product.category)}</TableCell>
                        <TableCell className="text-sm">{getBrandName((product as any).brand)}</TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium">
                              {t("currency")}
                              {(product.hasVariants && product.variants && product.variants.length > 0)
                                ? Math.min(...product.variants.filter((v: any) => v.is_active !== false).map((v: any) => v.price || 0)).toLocaleString()
                                : product.price.toLocaleString()}
                            </p>
                            {product.originalPrice && !product.hasVariants && (
                              <p className="text-xs text-muted-foreground line-through">
                                {t("currency")}{product.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            (product.hasVariants && product.variants && product.variants.length > 0) ?
                              (product.variants.reduce((acc: number, v: any) => acc + (v.is_active !== false ? v.stock : 0), 0) > 0 ? "outline" : "destructive")
                              : (product.stock > 0 ? "outline" : "destructive")
                          }>
                            {product.hasVariants && product.variants && product.variants.length > 0
                              ? product.variants.reduce((acc: number, v: any) => acc + (v.is_active !== false ? v.stock : 0), 0)
                              : product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <ItemStateIndicator state={getProductState(product)} size="sm" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(product.id)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setProductToDelete(product.id);
                                setDeleteDialogOpen(true);
                              }}
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t("showing" as any)} {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredProducts.length)} {t("of" as any)} {filteredProducts.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    →
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? t("editProduct" as any) : t("addProduct" as any)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("productNameBn" as any)} *</Label>
                <Input
                  value={form.name_bn}
                  onChange={(e) => setForm((prev) => ({ ...prev, name_bn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("productNameEn" as any)} *</Label>
                <Input
                  value={form.name_en}
                  onChange={(e) => setForm((prev) => ({ ...prev, name_en: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("description")} (বাংলা)</Label>
                <Textarea
                  value={form.description_bn}
                  onChange={(e) => setForm((prev) => ({ ...prev, description_bn: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("description")} (English)</Label>
                <Textarea
                  value={form.description_en}
                  onChange={(e) => setForm((prev) => ({ ...prev, description_en: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("categories")} *</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, category_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCategory" as any)} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.parent_id ? "↳ " : ""}{cat.icon} {language === "bn" ? cat.name_bn : cat.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("brandManagement")}</Label>
                <Select
                  value={form.brand_id || "none"}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, brand_id: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectBrand" as any)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {activeBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {language === "bn" ? brand.name_bn : brand.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label>{t("sku" as any)}</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU-001"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">{t("skuUnique" as any)}</p>
            </div>

            {/* Primary Image Upload */}
            <SingleImageUpload
              label={t("productImage" as any) + " *"}
              value={form.image_url}
              onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
            />

            {/* Gallery Images */}
            <GalleryImageUpload
              label={language === "bn" ? "গ্যালারি ছবি" : "Gallery Images"}
              value={form.gallery_images}
              onChange={(urls) => setForm((prev) => ({ ...prev, gallery_images: urls }))}
              max={4}
            />

            {/* Variants Toggle */}
            <div className="flex items-center gap-4 py-4 border-y">
              <Switch
                checked={form.has_variants}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, has_variants: checked }))}
              />
              <div className="space-y-0.5">
                <Label>This product has options (e.g. Size, Color)</Label>
                <p className="text-sm text-muted-foreground">Enable this if you need to track stock and price separately for different variations.</p>
              </div>
            </div>

            {form.has_variants ? (
              <ProductVariantsForm
                baseProductNameEn={form.name_en}
                baseProductNameBn={form.name_bn}
                basePrice={form.price}
                options={form.variant_options}
                setOptions={(opts) => setForm(prev => ({ ...prev, variant_options: opts }))}
                variants={form.product_variants}
                setVariants={(vars) => setForm(prev => ({ ...prev, product_variants: vars }))}
              />
            ) : (
              <>
                {/* Pricing (Standard) */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "ক্রয় মূল্য" : "Cost Price"}</Label>
                    <Input
                      type="number"
                      value={form.cost_price}
                      onChange={(e) => setForm((prev) => ({ ...prev, cost_price: Number(e.target.value) }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("discountType" as any)}</Label>
                    <Select
                      value={form.discount_type}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, discount_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">{t("percentage")}</SelectItem>
                        <SelectItem value="fixed">{t("fixedAmount")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("discountValue" as any)}</Label>
                    <Input
                      type="number"
                      value={form.discount_value}
                      onChange={(e) => setForm((prev) => ({ ...prev, discount_value: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("finalPrice" as any)}</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border bg-muted font-medium">
                      {t("currency")}{calculateFinalPrice().toLocaleString()}
                    </div>
                  </div>

                  {/* Affiliate Commission Settings */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="col-span-4">
                      <Label className="text-primary font-bold">Affiliate Commission Settings</Label>
                      <p className="text-xs text-muted-foreground mb-2">Set a specific commission for this product. If left at 0, the affiliate's default rate will apply.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={form.affiliate_commission_type}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, affiliate_commission_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed (৳)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-3">
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={form.affiliate_commission_value}
                        onChange={(e) => setForm((prev) => ({ ...prev, affiliate_commission_value: Number(e.target.value) }))}
                        placeholder="e.g. 10 for 10% or 50 for ৳50"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock (Standard) */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>{t("stockQuantity" as any)}</Label>
                    <Input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("productStatus" as any)}</Label>
                <Select
                  value={form.product_status}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, product_status: v as ProductStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("draftStatus" as any)}</SelectItem>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
                {form.product_status === "draft" && (
                  <p className="text-xs text-muted-foreground">{t("draftProductsHidden" as any)}</p>
                )}
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_featured: checked }))}
                  />
                  <Label>Featured</Label>
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
              disabled={!form.name_bn || !form.name_en || !form.category_id || createProduct.isPending || updateProduct.isPending}
            >
              {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Delete Confirmation */}
      <EnterpriseConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={language === "bn" ? "পণ্য মুছে ফেলার নিশ্চিতকরণ" : "Confirm Product Deletion"}
        description={language === "bn" ? "আপনি কি নিশ্চিত যে আপনি এই পণ্যটি মুছে ফেলতে চান? এটি স্থায়ীভাবে মুছে যাবে।" : "Are you sure you want to delete this product? This action cannot be undone."}
        type="destructive"
        impacts={[
          {
            label: t("action"),
            value: t("delete" as any),
            type: "negative",
          },
        ]}
        onConfirm={handleDelete}
      />

      {/* Bulk Action Confirmation */}
      <EnterpriseConfirmDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        title={bulkAction === "delete" ? (language === "bn" ? "একসাথে একাধিক পণ্য মোছার নিশ্চিতকরণ" : "Confirm Bulk Product Deletion") : t("confirmBulkProductUpdate" as any)}
        description={bulkAction === "delete" ? (language === "bn" ? "আপনি কি নিশ্চিত যে আপনি নির্বাচিত পণ্যগুলি মুছে ফেলতে চান? এটি স্থায়ীভাবে মুছে যাবে।" : "Are you sure you want to delete the selected products? This action cannot be undone.") : t("confirmBulkProductUpdateDesc" as any)}
        type={bulkAction === "delete" ? "destructive" : "warning"}
        impacts={[
          {
            label: t("affectedProducts" as any),
            value: selectedProducts.length,
          },
          {
            label: t("action"),
            value: bulkAction === "activate" ? t("bulkActivate" as any) : (bulkAction === "deactivate" ? t("bulkDeactivate" as any) : t("delete" as any)),
            type: bulkAction === "deactivate" || bulkAction === "delete" ? "negative" : "positive",
          },
        ]}
        adminNote={bulkAction === "deactivate" ? t("inactiveProductsHidden" as any) : undefined}
        onConfirm={bulkAction === "delete" ? handleBulkDelete : handleBulkAction}
      />
    </div>
  );
};
