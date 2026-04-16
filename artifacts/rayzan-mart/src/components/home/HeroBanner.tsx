import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHeroBanners } from "@/hooks/useAdminSettings";

const HeroBannerSkeleton = () => (
  <section className="relative overflow-hidden">
    <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-r from-muted to-muted/50 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="container">
          <div className="max-w-lg space-y-4">
            <div className="h-10 w-3/4 rounded-lg bg-muted-foreground/20 animate-pulse" />
            <div className="h-6 w-2/3 rounded-lg bg-muted-foreground/20 animate-pulse" />
            <div className="h-12 w-36 rounded-lg bg-primary/30 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export const HeroBanner = () => {
  const { language, t } = useLanguage();
  const { data: banners, isLoading } = useHeroBanners();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners && banners.length > 0) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  const prev = () => banners && setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  const next = () => banners && setCurrent((prev) => (prev + 1) % banners.length);

  if (isLoading) return <HeroBannerSkeleton />;
  if (!banners || banners.length === 0) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${index === current ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent z-10" />
            <img
              src={banner.image_url}
              alt={language === "bn" ? banner.title_bn : banner.title_en}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center z-20">
              <div className="container">
                <div className="max-w-lg animate-slide-up">
                  <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
                    {language === "bn" ? banner.title_bn : banner.title_en}
                  </h1>
                  <p className="mb-6 text-lg text-muted-foreground sm:text-xl">
                    {language === "bn" ? banner.subtitle_bn : banner.subtitle_en}
                  </p>
                  <Link to={banner.link || "/products"}>
                    <Button size="lg" className="btn-bounce">
                      {t("shopNow")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm transition-colors hover:bg-card z-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm transition-colors hover:bg-card z-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-30">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 w-2 rounded-full transition-all ${index === current ? "w-6 bg-primary" : "bg-card/60"
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
