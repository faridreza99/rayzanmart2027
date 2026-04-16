import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useListBanners, useListProducts, useListCategories } from "@workspace/api-client-react";

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);

  const { data: bannersData } = useListBanners({ query: {} });
  const { data: featuredData } = useListProducts({ params: { featured: "true", limit: 8 } }, { query: {} });
  const { data: newArrivalsData } = useListProducts({ params: { sortBy: "newest", limit: 8 } }, { query: {} });
  const { data: categoriesData } = useListCategories({ query: {} });

  const banners = bannersData ?? [];
  const featured = featuredData?.products ?? [];
  const newArrivals = newArrivalsData?.products ?? [];
  const categories = (categoriesData ?? []).slice(0, 8);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentBanner(c => (c + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = banners[currentBanner];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-secondary to-green-800 h-[400px] md:h-[500px]">
        {banner ? (
          <div className="relative w-full h-full">
            <img src={banner.imageUrl} alt={banner.titleEn} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center">
              <div className="max-w-7xl mx-auto px-4 w-full">
                <div className="max-w-lg">
                  <p className="text-white/80 text-lg mb-2">{banner.titleBn}</p>
                  <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">{banner.titleEn}</h1>
                  {banner.subtitleEn && <p className="text-white/80 mb-6">{banner.subtitleEn}</p>}
                  {banner.link && (
                    <Link href={banner.link}>
                      <Button className="bg-primary hover:bg-red-700 text-white px-8">Shop Now</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={() => setCurrentBanner(c => (c - 1 + banners.length) % banners.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setCurrentBanner(c => (c + 1) % banners.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setCurrentBanner(i)}
                      className={`w-2 h-2 rounded-full transition ${i === currentBanner ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <p className="text-2xl mb-2">রাইজান মার্টে স্বাগতম</p>
              <h1 className="text-5xl font-bold mb-4">Welcome to RayzanMart</h1>
              <p className="text-white/80 mb-8">Bangladesh's best online marketplace</p>
              <Link href="/products">
                <Button className="bg-primary hover:bg-red-700 text-white px-8 text-lg">Shop Now</Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Shop by Category</h2>
            <Link href="/products" className="text-secondary flex items-center gap-1 text-sm hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {categories.map(cat => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-secondary hover:bg-secondary/5 transition cursor-pointer text-center">
                  {cat.icon ? (
                    <span className="text-2xl">{cat.icon}</span>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-secondary font-bold text-sm">{cat.nameEn.slice(0, 2)}</span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground line-clamp-1">{cat.nameEn}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
              <p className="text-muted-foreground text-sm">বিশেষ পণ্য সমূহ</p>
            </div>
            <Link href="/products?featured=true" className="text-secondary flex items-center gap-1 text-sm hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(product => <ProductCard key={product.id} product={product as any} />)}
          </div>
        </section>
      )}

      {/* Affiliate Banner */}
      <section className="bg-gradient-to-r from-primary to-red-700 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Earn Money with RayzanMart</h2>
          <p className="text-white/80 mb-2 text-lg">রেফারেল করুন, আয় করুন — প্রতিটি বিক্রয়ে কমিশন পান</p>
          <p className="text-white/70 mb-8">Join our affiliate program and earn commission on every sale you refer</p>
          <Link href="/affiliate">
            <Button className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-3 font-semibold">
              Join Affiliate Program
            </Button>
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">New Arrivals</h2>
              <p className="text-muted-foreground text-sm">নতুন পণ্য সমূহ</p>
            </div>
            <Link href="/products" className="text-secondary flex items-center gap-1 text-sm hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.map(product => <ProductCard key={product.id} product={product as any} />)}
          </div>
        </section>
      )}

      {/* Empty state if no products */}
      {featured.length === 0 && newArrivals.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Products coming soon!</h2>
          <p className="text-muted-foreground mb-8">We're stocking our shelves. Check back soon.</p>
          <Link href="/admin">
            <Button className="bg-secondary text-white">Go to Admin to Add Products</Button>
          </Link>
        </section>
      )}
    </div>
  );
}
