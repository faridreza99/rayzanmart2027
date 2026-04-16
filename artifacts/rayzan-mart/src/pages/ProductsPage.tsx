import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";

const ProductsPage = () => {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";
  const saleType = searchParams.get("sale");
  const isFlashSalePage = saleType === "flash";

  const { data: allProducts, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: brandsData } = useBrands();

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const selectedCategoryIds = useMemo(() => {
    if (!categoryId || !categories) return null;

    const ids = new Set<string>([categoryId]);
    const queue = [categoryId];

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
  }, [categoryId, categories]);

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

    // Keep orphaned categories visible if parent is missing.
    sortCategories(categories.filter((cat: any) => !addedIds.has(cat.id))).forEach((cat: any) => {
      result.push({ cat, level: 0 });
    });

    return result;
  }, [categories]);

  const productsInSelectedCategory = useMemo(() => {
    let result = allProducts || [];
    if (categoryId && selectedCategoryIds) {
      result = result.filter((p) => selectedCategoryIds.has(p.category));
    }
    return result;
  }, [allProducts, categoryId, selectedCategoryIds]);

  const filteredProducts = useMemo(() => {
    let result = productsInSelectedCategory;

    if (isFlashSalePage) {
      result = result.filter(
        (p) => (Number(p.discount) || 0) > 0 || (!!p.originalPrice && p.originalPrice > p.price),
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.bn.toLowerCase().includes(query) ||
          p.name.en.toLowerCase().includes(query) ||
          p.description.bn.toLowerCase().includes(query) ||
          p.description.en.toLowerCase().includes(query)
      );
    }

    result = result.filter(
      (p) => p.price >= priceRange.min && (priceRange.max <= 0 || p.price <= priceRange.max)
    );

    if (inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    return result;
  }, [productsInSelectedCategory, isFlashSalePage, searchQuery, priceRange, inStockOnly, selectedBrands]);

  const brandMap = useMemo(() => {
    const map = new Map<string, any>();
    (brandsData || []).forEach((brand: any) => map.set(brand.id, brand));
    return map;
  }, [brandsData]);

  const brands = useMemo(() => {
    const ids = [...new Set(productsInSelectedCategory.filter((p) => p.brand).map((p) => p.brand!))];
    return ids.map((id) => ({
      id,
      label: brandMap.get(id)
        ? (language === "bn" ? brandMap.get(id).name_bn : brandMap.get(id).name_en)
        : id,
    }));
  }, [productsInSelectedCategory, brandMap, language]);

  useEffect(() => {
    const validIds = new Set(brands.map((b) => b.id));
    setSelectedBrands((prev) => prev.filter((id) => validIds.has(id)));
  }, [brands]);

  const currentCategory = categories?.find((c: any) => c.id === categoryId);

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 font-semibold">{t("categories")}</h3>
        <div className="space-y-2">
          {orderedCategories.map(({ cat, level }) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${level > 0 ? "ml-4" : ""} ${categoryId === cat.id ? "bg-primary text-primary-foreground" : ""
                }`}
            >
              <DynamicIcon name={cat.icon} className="h-4 w-4 shrink-0" fallback="📦" />
              <span>{language === "bn" ? cat.name_bn : cat.name_en}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Price Range */}
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

      {/* Brands */}
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

      {/* In Stock */}
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

  if (productsLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isFlashSalePage
                ? (language === "bn" ? "ফ্ল্যাশ সেল পণ্যসমূহ" : "Flash Sale Products")
                : currentCategory
                  ? (language === "bn" ? currentCategory.name_bn : currentCategory.name_en)
                  : t("products")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} {language === "bn" ? "টি পণ্য পাওয়া গেছে" : "products found"}
            </p>
          </div>

          {/* Mobile filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="mr-2 h-4 w-4" />
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

        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-xl bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                <h2 className="font-semibold">{language === "bn" ? "ফিল্টার" : "Filters"}</h2>
              </div>
              <FiltersContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {language === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
