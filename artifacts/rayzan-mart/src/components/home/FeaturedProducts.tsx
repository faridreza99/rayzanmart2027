import { useLanguage } from "@/contexts/LanguageContext";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";

export const FeaturedProducts = () => {
  const { language } = useLanguage();
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  if (isLoading) {
    return (
      <section className="py-8 bg-muted/30">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-7 w-40 rounded bg-muted animate-pulse" />
            <div className="h-7 w-20 rounded bg-muted animate-pulse" />
          </div>
          <ProductGridSkeleton count={5} />
        </div>
      </section>
    );
  }

  if (!featuredProducts || featuredProducts.length === 0) return null;

  return (
    <section className="py-8 bg-muted/30">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {language === "bn" ? "বিশেষ পণ্যসমূহ" : "Featured Products"}
          </h2>
          <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
            <Link to="/products">
              {language === "bn" ? "সব দেখুন" : "See All"}
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
