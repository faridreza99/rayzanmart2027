import { Link, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useAdminSettings";
import { FOOTER_PAGES_DEFAULTS } from "@/lib/footer-pages";

const FooterInfoPage = () => {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const { data: settings } = useSiteSettings();

  const pageKey = pathname.replace("/", "");
  const pageContent = settings?.footer_pages?.[pageKey] || FOOTER_PAGES_DEFAULTS[pageKey];

  if (!pageContent) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === "bn" ? "পেজ পাওয়া যায়নি" : "Page not found"}
          </h1>
          <Link to="/">
            <Button>{language === "bn" ? "হোমে ফিরুন" : "Back to Home"}</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const title = language === "bn" ? pageContent.title_bn : pageContent.title_en;
  const body = (language === "bn" ? pageContent.content_bn : pageContent.content_en)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <MainLayout>
      <div className="container py-10">
        <h1 className="mb-6 text-3xl font-bold">{title}</h1>
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-4 text-muted-foreground">
            {body.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FooterInfoPage;
