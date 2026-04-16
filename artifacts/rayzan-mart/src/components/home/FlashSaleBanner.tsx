import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useAdminSettings";

export const FlashSaleBanner = () => {
  const { language, t } = useLanguage();
  const { data: settings } = useSiteSettings();
  const flashSaleConfig = settings?.flash_sale;

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!flashSaleConfig?.is_active || !flashSaleConfig?.end_time) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(flashSaleConfig.end_time) - +new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [flashSaleConfig?.is_active, flashSaleConfig?.end_time]);

  if (!flashSaleConfig?.is_active) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="bg-gradient-to-r from-destructive/90 to-destructive py-4">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/20">
              <Zap className="h-5 w-5 text-destructive-foreground" />
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-destructive-foreground">
                {t("flashSale")}
              </h3>
              <p className="text-sm text-destructive-foreground/80">
                {t("flashSaleDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-destructive-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{t("endsIn")}:</span>
            </div>
            <div className="flex gap-2">
              {[
                ...(timeLeft.days > 0 ? [{ value: timeLeft.days, label: language === "bn" ? "দিন" : "days" }] : []),
                { value: timeLeft.hours, label: language === "bn" ? "ঘণ্টা" : "hrs" },
                { value: timeLeft.minutes, label: language === "bn" ? "মিনিট" : "min" },
                { value: timeLeft.seconds, label: language === "bn" ? "সেকেন্ড" : "sec" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="rounded bg-background/20 px-3 py-1 text-lg font-bold text-destructive-foreground">
                    {pad(item.value)}
                  </div>
                  <span className="mt-1 text-[10px] text-destructive-foreground/70">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/products?sale=flash">
              <Button
                variant="secondary"
                size="sm"
                className="bg-background/20 text-destructive-foreground hover:bg-background/30"
              >
                {t("shopNow")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};