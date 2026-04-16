import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface CTAData {
  title_bn: string;
  title_en: string;
  subtitle_bn: string;
  subtitle_en: string;
  button_text_bn: string;
  button_text_en: string;
  button_link: string;
}

const STATIC_CTA: CTAData = {
  title_bn: "আমাদের সাথে পথচলা শুরু করুন",
  title_en: "Start Your Journey With Us",
  subtitle_bn: "সেরা পণ্য, সেরা দাম — এখনই শুরু করুন",
  subtitle_en: "Best products, best prices — start now",
  button_text_bn: "এখনই কেনাকাটা করুন",
  button_text_en: "Shop Now",
  button_link: "/products",
};

export const CTASection = () => {
  const { language } = useLanguage();

  const { data: cta } = useQuery<CTAData>({
    queryKey: ["cta-section-public"],
    queryFn: async () => {
      const res = await fetch("/api/db/site_settings?setting_key=cta_section&_limit=1");
      if (!res.ok) return STATIC_CTA;
      const json = await res.json();
      const rows = Array.isArray(json) ? json : json?.data ?? [];
      if (rows.length > 0 && rows[0]?.setting_value) {
        const val = rows[0].setting_value;
        return typeof val === "string" ? JSON.parse(val) : val;
      }
      return STATIC_CTA;
    },
    staleTime: 5 * 60 * 1000,
  });

  const data = cta ?? STATIC_CTA;

  return (
    <section className="bg-primary py-16 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {language === "bn" ? data.title_bn : data.title_en}
        </h2>
        <p className="mt-4 text-lg text-white/80">
          {language === "bn" ? data.subtitle_bn : data.subtitle_en}
        </p>
        <div className="mt-8">
          <Link
            to={data.button_link || "/products"}
            className="inline-block rounded-full bg-white px-8 py-3 font-bold text-primary shadow-lg transition hover:bg-white/90 hover:scale-105"
          >
            {language === "bn" ? data.button_text_bn : data.button_text_en}
          </Link>
        </div>
      </div>
    </section>
  );
};
