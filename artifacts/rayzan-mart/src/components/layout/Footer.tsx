import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "@/hooks/useAdminSettings";
import { FOOTER_PAGES_DEFAULTS } from "@/lib/footer-pages";

export const Footer = () => {
  const { language, t } = useLanguage();
  const { data: settings } = useSiteSettings();

  const siteName = language === "bn"
    ? settings?.site_name?.bn || t("appName")
    : settings?.site_name?.en || t("appName");

  const getFooterPageTitle = (key: keyof typeof FOOTER_PAGES_DEFAULTS, fallback: string) => {
    const page = settings?.footer_pages?.[key] || FOOTER_PAGES_DEFAULTS[key];
    if (!page) return fallback;
    return language === "bn" ? page.title_bn : page.title_en;
  };

  const contactPhone = settings?.contact_info?.phone || "";
  const contactEmail = settings?.contact_info?.email || "";
  const contactAddress = language === "bn"
    ? settings?.contact_info?.address_bn || ""
    : settings?.contact_info?.address_en || "";

  const facebookUrl = settings?.social_links?.facebook || "";
  const instagramUrl = settings?.social_links?.instagram || "";
  const youtubeUrl = settings?.social_links?.youtube || "";

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-4 text-xl font-bold text-primary flex items-center gap-2">
              {settings?.site_logo?.url ? (
                <img src={settings.site_logo.url} alt={siteName} className="h-8 w-auto object-contain" />
              ) : null}
              <span>{siteName}</span>
            </h3>
            {(settings?.footer_tagline?.bn || settings?.footer_tagline?.en) && (
              <p className="mb-4 text-sm text-muted-foreground">
                {language === "bn"
                  ? settings.footer_tagline.bn
                  : settings.footer_tagline.en}
              </p>
            )}
            <div className="flex gap-3">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {!facebookUrl && !instagramUrl && !youtubeUrl && (
                <span className="text-xs text-muted-foreground italic">
                  {language === "bn" ? "সোশ্যাল লিংক সেট করা হয়নি" : "No social links set"}
                </span>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-semibold">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary">
                  {getFooterPageTitle("about", t("aboutUs"))}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary">
                  {getFooterPageTitle("contact", t("contactUs"))}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary">
                  {getFooterPageTitle("faq", t("faq"))}
                </Link>
              </li>
              <li>
                <Link to="/affiliate-landing" className="text-muted-foreground hover:text-primary">
                  {t("affiliateProgram")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="mb-4 font-semibold">
              {t("policies")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary">
                  {getFooterPageTitle("privacy", t("privacyPolicy"))}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary">
                  {getFooterPageTitle("terms", t("termsConditions"))}
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-muted-foreground hover:text-primary">
                  {getFooterPageTitle("refund", t("refundPolicy"))}
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-muted-foreground hover:text-primary">
                  {getFooterPageTitle("shipping", t("shippingPolicy"))}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-semibold">{t("contactUs")}</h4>
            <ul className="space-y-3 text-sm">
              {contactPhone && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{contactPhone}</span>
                </li>
              )}
              {contactEmail && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{contactEmail}</span>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>{contactAddress}</span>
                </li>
              )}
              {!contactPhone && !contactEmail && !contactAddress && (
                <li className="text-xs text-muted-foreground italic">
                  {language === "bn" ? "যোগাযোগ তথ্য সেট করা হয়নি" : "Contact info not set"}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Payment & Delivery Partners */}
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium">
                {t("paymentPartners")}
              </p>
              <div className="flex gap-2">
                <span className="rounded bg-muted px-3 py-1 text-xs font-medium">bKash</span>
                <span className="rounded bg-muted px-3 py-1 text-xs font-medium">Nagad</span>
                <span className="rounded bg-muted px-3 py-1 text-xs font-medium">VISA</span>
                <span className="rounded bg-muted px-3 py-1 text-xs font-medium">Mastercard</span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">
                {t("deliveryPartners")}
              </p>
              <div className="flex gap-2">
                <span className="rounded bg-muted px-3 py-1 text-xs font-medium">Pathao</span>
                <span className="rounded bg-muted px-3 py-1 text-xs font-medium">Steadfast</span>
                <span className="rounded bg-muted px-3 py-1 text-xs font-medium">RedX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {siteName}. {t("allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
};
