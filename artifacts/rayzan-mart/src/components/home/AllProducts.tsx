import { useLanguage } from "@/contexts/LanguageContext";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";

export const AllProducts = () => {
  const { language, t } = useLanguage();
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-7 w-24 rounded bg-muted animate-pulse" />
            <div className="h-7 w-20 rounded bg-muted animate-pulse" />
          </div>
          <ProductGridSkeleton count={10} />
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-8">
        <div className="container text-center py-12 text-muted-foreground">
          {language === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("products")}</h2>
          <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
            <Link to="/products">
              {language === "bn" ? "সব দেখুন" : "See All"}
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
