import { useState } from "react";
import { useSearch } from "wouter";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import { useListProducts, useListCategories, useListBrands } from "@workspace/api-client-react";

export default function ProductsPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  
  const [categoryId, setCategoryId] = useState(params.get("categoryId") ?? "");
  const [brandId, setBrandId] = useState(params.get("brandId") ?? "");
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const queryParams: Record<string, any> = { page: String(page), limit: "20", sortBy };
  if (categoryId) queryParams.categoryId = categoryId;
  if (brandId) queryParams.brandId = brandId;
  if (search) queryParams.search = search;
  if (params.get("featured") === "true") queryParams.featured = "true";

  const { data, isLoading } = useListProducts({ params: queryParams }, { query: {} });
  const { data: categories } = useListCategories({ query: {} });
  const { data: brands } = useListBrands({ query: {} });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function clearFilters() {
    setCategoryId("");
    setBrandId("");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Products</h1>
          <p className="text-muted-foreground text-sm">{total} products found</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
          <Filter className="w-4 h-4 mr-2" />Filters
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
          <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Filters</h3>
              {(categoryId || brandId) && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <X className="w-3 h-3" />Clear
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
              <Select value={categoryId || "all"} onValueChange={v => { setCategoryId(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(categories ?? []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Brand</label>
              <Select value={brandId || "all"} onValueChange={v => { setBrandId(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {(brands ?? []).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex justify-end mb-4">
            <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-44 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No products found</p>
              <Button onClick={clearFilters} variant="outline" className="mt-4">Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p as any} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
