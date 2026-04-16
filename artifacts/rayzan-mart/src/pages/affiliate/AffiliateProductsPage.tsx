import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { Filter, SlidersHorizontal, Loader2, ShoppingBag, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import AffiliateProductCard from "@/components/affiliate/AffiliateProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useMyAffiliate } from "@/hooks/useAffiliate";
import AffiliateSidebar from "@/components/affiliate/AffiliateSidebar";

const AffiliateProductsPage = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const selectedCategoryId = searchParams.get("category");

  const { data: allProducts, isLoading: productsLoading } = useProducts();
  const { data: affiliate, isLoading: affiliateLoading } = useMyAffiliate();
  const { data: categories } = useCategories();
  const { data: brandsData } = useBrands();

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const selectedCategoryIds = useMemo(() => {
    if (!selectedCategoryId || !categories) return null;

    const ids = new Set<string>([selectedCategoryId]);
    const queue = [selectedCategoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = categories.filter((cat: any) => cat.parent_id === currentId);
      children.forEach((child: any) => {
        if (!ids.has(child.id)) {
          ids.add(child.id);
          queue.push(child.id);
        }
      });
    }

    return ids;
  }, [selectedCategoryId, categories]);

  const affiliateProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => p.affiliate_commission_value && p.affiliate_commission_value > 0);
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = affiliateProducts;

    if (selectedCategoryId && selectedCategoryIds) {
      result = result.filter((p) => selectedCategoryIds.has(p.category));
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name.bn?.toLowerCase() || "").includes(query) ||
          (p.name.en?.toLowerCase() || "").includes(query) ||
          (p.brand?.toLowerCase() || "").includes(query) ||
          (p.sku?.toLowerCase() || "").includes(query)
      );
    }

    if (priceRange.min > 0) {
      result = result.filter((p) => p.price >= priceRange.min);
    }
    if (priceRange.max > 0) {
      result = result.filter((p) => p.price <= priceRange.max);
    }

    if (inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    return result;
  }, [affiliateProducts, selectedCategoryId, selectedCategoryIds, searchTerm, priceRange, inStockOnly, selectedBrands]);

  const orderedCategories = useMemo(() => {
    if (!categories) return [];

    const sortCategories = (items: any[]) =>
      [...items].sort((a: any, b: any) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return (a.name_en || "").localeCompare(b.name_en || "");
      });

    const topLevel = sortCategories(categories.filter((cat: any) => !cat.parent_id));
    const result: Array<{ cat: any; level: number }> = [];
    const addedIds = new Set<string>();

    const addCategoryWithChildren = (cat: any, level: number) => {
      result.push({ cat, level });
      addedIds.add(cat.id);
      const children = sortCategories(categories.filter((child: any) => child.parent_id === cat.id));
      children.forEach((child) => addCategoryWithChildren(child, level + 1));
    };

    topLevel.forEach((cat) => addCategoryWithChildren(cat, 0));

    sortCategories(categories.filter((cat: any) => !addedIds.has(cat.id))).forEach((cat: any) => {
      result.push({ cat, level: 0 });
    });

    return result;
  }, [categories]);

  const brandMap = useMemo(() => {
    const map = new Map<string, any>();
    (brandsData || []).forEach((brand: any) => map.set(brand.id, brand));
    return map;
  }, [brandsData]);

  const brands = useMemo(() => {
    const ids = [...new Set(affiliateProducts.filter((p) => p.brand).map((p) => p.brand!))];
    return ids.map((id) => ({
      id,
      label: brandMap.get(id)
        ? (language === "bn" ? brandMap.get(id).name_bn : brandMap.get(id).name_en)
        : id,
    }));
  }, [affiliateProducts, brandMap, language]);

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 font-semibold">{t("categories")}</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              searchParams.delete("category");
              setSearchParams(searchParams);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${!selectedCategoryId ? "bg-primary text-primary-foreground" : ""}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{language === "bn" ? "সকল পণ্য" : "All Products"}</span>
          </button>
          {orderedCategories.map(({ cat, level }) => (
            <button
              key={cat.id}
              onClick={() => {
                searchParams.set("category", cat.id);
                setSearchParams(searchParams);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${level > 0 ? "ml-4" : ""} ${selectedCategoryId === cat.id ? "bg-primary text-primary-foreground" : ""}`}
            >
              <DynamicIcon name={cat.icon} className="h-4 w-4 shrink-0" fallback="📦" />
              <span>{language === "bn" ? cat.name_bn : cat.name_en}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">{t("price")}</h3>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceRange.min || ""}
            onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
            className="w-24"
          />
          <span className="self-center">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceRange.max || ""}
            onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
            className="w-24"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">{language === "bn" ? "ব্র্যান্ড" : "Brands"}</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-2">
              <Checkbox
                id={brand.id}
                checked={selectedBrands.includes(brand.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand.id]);
                  } else {
                    setSelectedBrands(selectedBrands.filter((b) => b !== brand.id));
                  }
                }}
              />
              <Label htmlFor={brand.id}>{brand.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="inStock"
          checked={inStockOnly}
          onCheckedChange={(checked) => setInStockOnly(!!checked)}
        />
        <Label htmlFor="inStock">{t("inStock")}</Label>
      </div>
    </div>
  );

  if (productsLoading || affiliateLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!affiliate) {
     return <Navigate to="/affiliate-landing" />;
  }

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-64px)] bg-slate-50/50">
        <AffiliateSidebar />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="container py-6 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {language === "bn" ? "সকল আফলিয়েট পণ্য" : "All Affiliate Products"}
                </h1>
                <p className="text-slate-500 mt-1">
                  {filteredProducts.length} {language === "bn" ? "টি পণ্য পাওয়া গেছে" : "products found"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={language === "bn" ? "পণ্য খুঁজুন..." : "Search products..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 rounded-xl"
                    />
                 </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden h-11 px-4 gap-2 rounded-xl">
                      <Filter className="h-4 w-4" />
                      {language === "bn" ? "ফিল্টার" : "Filters"}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>{language === "bn" ? "ফিল্টার" : "Filters"}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FiltersContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Horizontal Filter Bar - Desktop */}
            <div className="hidden lg:flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm sticky top-24 z-20">
              <div className="flex items-center gap-2 border-r pr-4">
                <Filter className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm uppercase tracking-wider">{t("filter")}</span>
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("categories")}:</Label>
                <Select
                  value={selectedCategoryId || "all"}
                  onValueChange={(val) => {
                    if (val === "all") searchParams.delete("category");
                    else searchParams.set("category", val);
                    setSearchParams(searchParams);
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue placeholder={t("allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}</SelectItem>
                    {orderedCategories.map(({ cat, level }) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {language === "bn" ? cat.name_bn : cat.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Filter */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">{language === "bn" ? "ব্র্যান্ড" : "Brands"}:</Label>
                <Select
                  value={selectedBrands[0] || "all"}
                  onValueChange={(val) => {
                    if (val === "all") setSelectedBrands([]);
                    else setSelectedBrands([val]);
                  }}
                >
                  <SelectTrigger className="w-[150px] h-9 text-sm">
                    <SelectValue placeholder={language === "bn" ? "সকল ব্র্যান্ড" : "All Brands"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "bn" ? "সকল ব্র্যান্ড" : "All Brands"}</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Filter */}
              <div className="flex items-center gap-2 border-l pl-4">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("price")}:</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min || ""}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                    className="w-20 h-9 text-xs"
                  />
                  <span className="text-slate-300">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max || ""}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    className="w-20 h-9 text-xs"
                  />
                </div>
              </div>

              {/* In Stock Toggle */}
              <div className="ml-auto flex items-center gap-2">
                <Checkbox
                  id="inStock-h"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(!!checked)}
                />
                <Label htmlFor="inStock-h" className="text-xs font-medium cursor-pointer">{t("inStock")}</Label>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="flex-1">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((p) => (
                      <AffiliateProductCard
                        key={p.id}
                        product={p}
                        referralCode={affiliate.referral_code}
                        defaultCommissionRate={affiliate.commission_rate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">
                      {language === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default AffiliateProductsPage;
