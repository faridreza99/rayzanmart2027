import { Link } from "react-router-dom";
import { Gift, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useAdminSettings";

export const LoyaltyBanner = () => {
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { data: settings } = useSiteSettings();

  const isDemoMode = settings?.modules?.demo_mode ?? false;
  const pointsPerOrder = settings?.loyalty_points_per_order ?? 10;
  const pointsValue = settings?.loyalty_points_value ?? 100;
  const earnRatio = settings?.loyalty_rules?.earn_ratio ?? 100;

  return (
    <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-6">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-card p-6 shadow-sm sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold">
                {t("loyaltyProgram")}
                {isDemoMode && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t("demoMode")}
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">{t("loyaltyDesc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                <Star className="h-5 w-5 fill-primary" />
                {pointsPerOrder}
              </div>
              <p className="text-xs text-muted-foreground">{t("pointsPerOrder")}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pointsValue}</div>
              <p className="text-xs text-muted-foreground">
                {language === "bn"
                  ? `টাকা = ${earnRatio} পয়েন্ট`
                  : `Taka = ${earnRatio} Points`}
              </p>
            </div>
            {!isAuthenticated && (
              <Link to="/signup">
                <Button variant="outline" size="sm" className="gap-1">
                  {t("joinNow")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
