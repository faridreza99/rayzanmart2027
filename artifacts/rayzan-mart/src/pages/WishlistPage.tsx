import { Link } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductCard } from "@/components/product/ProductCard";

const WishlistPage = () => {
  const { language, t } = useLanguage();
  const { data: wishlistItems, isLoading } = useWishlist();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const products = wishlistItems?.map((item: any) => item.product) || [];

  if (products.length === 0) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">{t("noWishlist")}</h1>
          <p className="mb-6 text-muted-foreground">{t("emptyStateWishlistHelper")}</p>
          <Link to="/products">
            <Button>{language === "bn" ? "পণ্য দেখুন" : "Browse Products"}</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("wishlist")}</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default WishlistPage;
