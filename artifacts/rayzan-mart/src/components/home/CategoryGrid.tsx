import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

export const CategoryGrid = () => {
  const { language, t } = useLanguage();
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </section>
    );
  }

  // Show only top-level active categories
  const topCategories = categories?.filter((c: any) => !c.parent_id && c.is_active) || [];

  if (topCategories.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("categories")}</h2>
          <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
            <Link to="/products">
              {language === "bn" ? "সব দেখুন" : "See All"}
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
          {topCategories.map((category: any) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group flex flex-col items-center gap-2 rounded-xl bg-card p-4 text-center shadow-sm transition-all card-hover"
            >
              <DynamicIcon
                name={category.icon}
                className="h-10 w-10 text-primary group-hover:scale-110 transition-transform"
                fallback="📦"
              />
              <span className="text-sm font-medium group-hover:text-primary">
                {language === "bn" ? category.name_bn : category.name_en}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};