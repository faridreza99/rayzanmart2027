import { useLanguage } from "@/contexts/LanguageContext";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { TrendingUp } from "lucide-react";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";

export const BestSelling = () => {
  const { language, t } = useLanguage();
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="h-7 w-32 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-7 w-20 rounded bg-muted animate-pulse" />
          </div>
          <ProductGridSkeleton count={5} />
        </div>
      </section>
    );
  }

  const bestSellingProducts = [...(products || [])]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 5);

  if (bestSellingProducts.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{t("bestSelling")}</h2>
          </div>
          <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
            <Link to="/products?sort=popular">
              {language === "bn" ? "সব দেখুন" : "See All"}
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {bestSellingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
