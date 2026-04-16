import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Settings, Upload, Info, Zap, CreditCard, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useAdminSettings";
import { FOOTER_PAGES_DEFAULTS, FooterPageItem, FooterPagesSettings } from "@/lib/footer-pages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SingleImageUpload } from "./CloudinaryImageUpload";

export const SystemSettings = () => {
  const { language, t } = useLanguage();
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [siteNameBn, setSiteNameBn] = useState("");
  const [siteNameEn, setSiteNameEn] = useState("");
  const [footerTaglineBn, setFooterTaglineBn] = useState("");
  const [footerTaglineEn, setFooterTaglineEn] = useState("");
  const [affiliateEnabled, setAffiliateEnabled] = useState(true);
  const [couponsEnabled, setCouponsEnabled] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [insideCityCharge, setInsideCityCharge] = useState(60);
  const [outsideCityCharge, setOutsideCityCharge] = useState(120);
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [flashSaleActive, setFlashSaleActive] = useState(false);
  const [flashSaleEnd, setFlashSaleEnd] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");
  const [nagadNumber, setNagadNumber] = useState("");
  const [paymentInstructionsBn, setPaymentInstructionsBn] = useState("");
  const [paymentInstructionsEn, setPaymentInstructionsEn] = useState("");
  const [footerPages, setFooterPages] = useState<FooterPagesSettings>(FOOTER_PAGES_DEFAULTS);
  const [selectedFooterPage, setSelectedFooterPage] = useState<keyof FooterPagesSettings>("about");

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddressBn, setContactAddressBn] = useState("");
  const [contactAddressEn, setContactAddressEn] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("হ্যালো! আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।");
  const [ctaTitleBn, setCtaTitleBn] = useState("আমাদের সাথে পথচলা শুরু করুন");
  const [ctaTitleEn, setCtaTitleEn] = useState("Start Your Journey With Us");
  const [ctaSubtitleBn, setCtaSubtitleBn] = useState("সেরা পণ্য, সেরা দাম — এখনই শুরু করুন");
  const [ctaSubtitleEn, setCtaSubtitleEn] = useState("Best products, best prices — start now");
  const [ctaButtonTextBn, setCtaButtonTextBn] = useState("এখনই কেনাকাটা করুন");
  const [ctaButtonTextEn, setCtaButtonTextEn] = useState("Shop Now");
  const [ctaButtonLink, setCtaButtonLink] = useState("/products");

  useEffect(() => {
    if (settings) {
      setSiteNameBn(settings.site_name?.bn || "রায়জন মার্ট");
      setSiteNameEn(settings.site_name?.en || "BanglaShop");
      setFooterTaglineBn(settings.footer_tagline?.bn || "");
      setFooterTaglineEn(settings.footer_tagline?.en || "");
      setAffiliateEnabled(settings.modules?.affiliate ?? true);
      setCouponsEnabled(settings.modules?.coupons ?? true);
      setDemoMode(settings.modules?.demo_mode ?? true);
      setInsideCityCharge(settings.delivery_charges?.inside_city ?? 60);
      setOutsideCityCharge(settings.delivery_charges?.outside_city ?? 120);
      setSiteLogoUrl(settings.site_logo?.url || "");
      setFlashSaleActive(settings.flash_sale?.is_active ?? false);
      setFlashSaleEnd(settings.flash_sale?.end_time || "");
      setBkashNumber(settings.payment_settings?.bkash_number || "");
      setNagadNumber(settings.payment_settings?.nagad_number || "");
      setPaymentInstructionsBn(settings.payment_settings?.instructions_bn || "");
      setPaymentInstructionsEn(settings.payment_settings?.instructions_en || "");
      setFooterPages({ ...FOOTER_PAGES_DEFAULTS, ...(settings.footer_pages || {}) });
      setContactPhone(settings.contact_info?.phone || "");
      setContactEmail(settings.contact_info?.email || "");
      setContactAddressBn(settings.contact_info?.address_bn || "");
      setContactAddressEn(settings.contact_info?.address_en || "");
      setSocialFacebook(settings.social_links?.facebook || "");
      setSocialInstagram(settings.social_links?.instagram || "");
      setSocialYoutube(settings.social_links?.youtube || "");
      const s = settings as any;
      const wa = s.whatsapp_number;
      setWhatsappNumber(wa ? String(wa).replace(/"/g, "") : "8801347195345");
      const wm = s.whatsapp_message;
      if (wm) setWhatsappMessage(String(wm).replace(/^"|"$/g, ""));
      const cta = s.cta_section || {};
      setCtaTitleBn(cta.title_bn || "আমাদের সাথে পথচলা শুরু করুন");
      setCtaTitleEn(cta.title_en || "Start Your Journey With Us");
      setCtaSubtitleBn(cta.subtitle_bn || "সেরা পণ্য, সেরা দাম — এখনই শুরু করুন");
      setCtaSubtitleEn(cta.subtitle_en || "Best products, best prices — start now");
      setCtaButtonTextBn(cta.button_text_bn || "এখনই কেনাকাটা করুন");
      setCtaButtonTextEn(cta.button_text_en || "Shop Now");
      setCtaButtonLink(cta.button_link || "/products");
    }
  }, [settings]);

  const handleSaveGeneral = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "site_name",
        value: { bn: siteNameBn, en: siteNameEn },
      });
      await updateSetting.mutateAsync({
        key: "footer_tagline",
        value: { bn: footerTaglineBn, en: footerTaglineEn },
      });

      if (siteLogoUrl !== settings?.site_logo?.url) {
        await updateSetting.mutateAsync({
          key: "site_logo",
          value: { url: siteLogoUrl },
        });
      }

      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleSaveFlashSale = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "flash_sale",
        value: { is_active: flashSaleActive, end_time: flashSaleEnd },
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleModuleToggle = async (module: string, enabled: boolean) => {
    try {
      const newModules = {
        affiliate: module === "affiliate" ? enabled : affiliateEnabled,
        coupons: module === "coupons" ? enabled : couponsEnabled,
        demo_mode: module === "demo_mode" ? enabled : demoMode,
      };

      if (module === "affiliate") setAffiliateEnabled(enabled);
      if (module === "coupons") setCouponsEnabled(enabled);
      if (module === "demo_mode") setDemoMode(enabled);

      await updateSetting.mutateAsync({
        key: "modules",
        value: newModules,
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleSaveDelivery = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "delivery_charges",
        value: { inside_city: insideCityCharge, outside_city: outsideCityCharge },
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleSavePayment = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "payment_settings",
        value: {
          bkash_number: bkashNumber,
          nagad_number: nagadNumber,
          instructions_bn: paymentInstructionsBn,
          instructions_en: paymentInstructionsEn,
        },
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const updateSelectedFooterPageField = (field: keyof FooterPageItem, value: string) => {
    setFooterPages((prev) => ({
      ...prev,
      [selectedFooterPage]: {
        ...prev[selectedFooterPage],
        [field]: value,
      },
    }));
  };

  const handleSaveFooterPages = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "footer_pages",
        value: footerPages,
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleSaveContactSocial = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "contact_info",
        value: {
          phone: contactPhone,
          email: contactEmail,
          address_bn: contactAddressBn,
          address_en: contactAddressEn,
        },
      });
      await updateSetting.mutateAsync({
        key: "social_links",
        value: {
          facebook: socialFacebook,
          instagram: socialInstagram,
          youtube: socialYoutube,
        },
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({
          key: "whatsapp_number",
          value: whatsappNumber.trim(),
        }),
        updateSetting.mutateAsync({
          key: "whatsapp_message",
          value: whatsappMessage.trim(),
        }),
      ]);
      toast.success(language === "bn" ? "WhatsApp সেটিংস সংরক্ষিত হয়েছে" : "WhatsApp settings saved");
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleSaveCTA = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "cta_section",
        value: {
          title_bn: ctaTitleBn,
          title_en: ctaTitleEn,
          subtitle_bn: ctaSubtitleBn,
          subtitle_en: ctaSubtitleEn,
          button_text_bn: ctaButtonTextBn,
          button_text_en: ctaButtonTextEn,
          button_link: ctaButtonLink,
        },
      });
      toast.success(language === "bn" ? "CTA সেকশন সংরক্ষিত হয়েছে" : "CTA section saved");
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  if (isLoading) {
    return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <Alert className="border-info/30 bg-info/5">
        <Info className="h-4 w-4 text-info" />
        <AlertDescription className="text-sm text-info">
          {t("systemSettingsHelper")}
        </AlertDescription>
      </Alert>

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("siteInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("siteNameBn")}</Label>
              <Input
                value={siteNameBn}
                onChange={(e) => setSiteNameBn(e.target.value)}
                placeholder="রায়জন মার্ট"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("siteNameEn")}</Label>
              <Input
                value={siteNameEn}
                onChange={(e) => setSiteNameEn(e.target.value)}
                placeholder="BanglaShop"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "Footer ট্যাগলাইন (বাংলা)" : "Footer Tagline (Bangla)"}</Label>
              <Input
                value={footerTaglineBn}
                onChange={(e) => setFooterTaglineBn(e.target.value)}
                placeholder="বাংলাদেশের বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম।"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "Footer ট্যাগলাইন (ইংরেজি)" : "Footer Tagline (English)"}</Label>
              <Input
                value={footerTaglineEn}
                onChange={(e) => setFooterTaglineEn(e.target.value)}
                placeholder="Bangladesh's trusted online shopping platform."
              />
            </div>
          </div>

          <div className="space-y-2">
            <SingleImageUpload
              label={t("siteLogo")}
              value={siteLogoUrl || settings?.site_logo?.url}
              onChange={(url) => setSiteLogoUrl(url)}
            />
          </div>

          <Button onClick={handleSaveGeneral} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Module Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{t("moduleControls")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("moduleControlsHelper")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{t("affiliateModule")}</p>
              <p className="text-sm text-muted-foreground">{t("affiliateModuleDesc")}</p>
            </div>
            <Switch
              checked={affiliateEnabled}
              onCheckedChange={(checked) => handleModuleToggle("affiliate", checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{t("couponModule")}</p>
              <p className="text-sm text-muted-foreground">{t("couponModuleDesc")}</p>
            </div>
            <Switch
              checked={couponsEnabled}
              onCheckedChange={(checked) => handleModuleToggle("coupons", checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{t("demoModeLabel")}</p>
              <p className="text-sm text-muted-foreground">{t("demoModeDesc")}</p>
            </div>
            <Switch
              checked={demoMode}
              onCheckedChange={(checked) => handleModuleToggle("demo_mode", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Charges */}
      <Card>
        <CardHeader>
          <CardTitle>{t("deliverySettings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("insideCityCharge")}</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("currency")}</span>
                <Input
                  type="number"
                  value={insideCityCharge}
                  onChange={(e) => setInsideCityCharge(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("outsideCityCharge")}</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("currency")}</span>
                <Input
                  type="number"
                  value={outsideCityCharge}
                  onChange={(e) => setOutsideCityCharge(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveDelivery} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {language === "bn" ? "পেমেন্ট সেটিংস" : "Payment Settings"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === "bn" ? "ডেলিভারি চার্জ সংগ্রহের জন্য বিকাশ তথ্য প্রদান করুন" : "Provide bKash information for collecting delivery charges"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "বিকাশ নাম্বার" : "bKash Number"}</Label>
              <Input
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                placeholder="017XXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "নগদ নাম্বার" : "Nagad Number"}</Label>
              <Input
                value={nagadNumber}
                onChange={(e) => setNagadNumber(e.target.value)}
                placeholder="017XXXXXXXX"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "নির্দেশনা (বাংলা)" : "Instructions (Bangla)"}</Label>
              <Textarea
                value={paymentInstructionsBn}
                onChange={(e) => setPaymentInstructionsBn(e.target.value)}
                placeholder="বিকাশ নাম্বারে ডেলিভারি চার্জ সেন্ড মানি করুন..."
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "নির্দেশনা (ইংরেজি)" : "Instructions (English)"}</Label>
              <Textarea
                value={paymentInstructionsEn}
                onChange={(e) => setPaymentInstructionsEn(e.target.value)}
                placeholder="Send Money the delivery charge to bKash number..."
              />
            </div>
          </div>

          <Button onClick={handleSavePayment} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Flash Sale Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-destructive" />
            {language === "bn" ? "ফ্ল্যাশ সেল সেটিংস" : "Flash Sale Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{language === "bn" ? "ফ্ল্যাশ সেল চালু করুন" : "Enable Flash Sale"}</p>
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "হোমপেজে ফ্ল্যাশ সেল ব্যানার দেখান" : "Show flash sale banner on homepage"}
              </p>
            </div>
            <Switch
              checked={flashSaleActive}
              onCheckedChange={setFlashSaleActive}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === "bn" ? "শেষ হওয়ার সময়" : "End Time"}</Label>
            <Input
              type="datetime-local"
              value={flashSaleEnd}
              onChange={(e) => setFlashSaleEnd(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveFlashSale} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Footer Pages CMS */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "bn" ? "ফুটার পেজ কনটেন্ট" : "Footer Page Content"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === "bn"
              ? "এখান থেকে About/Contact/FAQ/নীতিমালা পেজের কনটেন্ট আপডেট করুন"
              : "Update About/Contact/FAQ/Policy pages from here"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{language === "bn" ? "পেজ নির্বাচন করুন" : "Select Page"}</Label>
            <Select
              value={selectedFooterPage}
              onValueChange={(value) => setSelectedFooterPage(value as keyof FooterPagesSettings)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="about">About</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="privacy">Privacy</SelectItem>
                <SelectItem value="terms">Terms</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "শিরোনাম (বাংলা)" : "Title (Bangla)"}</Label>
              <Input
                value={footerPages[selectedFooterPage]?.title_bn || ""}
                onChange={(e) => updateSelectedFooterPageField("title_bn", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "শিরোনাম (ইংরেজি)" : "Title (English)"}</Label>
              <Input
                value={footerPages[selectedFooterPage]?.title_en || ""}
                onChange={(e) => updateSelectedFooterPageField("title_en", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "কনটেন্ট (বাংলা)" : "Content (Bangla)"}</Label>
              <Textarea
                rows={8}
                value={footerPages[selectedFooterPage]?.content_bn || ""}
                onChange={(e) => updateSelectedFooterPageField("content_bn", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "নতুন লাইনে নতুন প্যারাগ্রাফ হবে" : "Each line will be shown as a separate paragraph"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "কনটেন্ট (ইংরেজি)" : "Content (English)"}</Label>
              <Textarea
                rows={8}
                value={footerPages[selectedFooterPage]?.content_en || ""}
                onChange={(e) => updateSelectedFooterPageField("content_en", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "নতুন লাইনে নতুন প্যারাগ্রাফ হবে" : "Each line will be shown as a separate paragraph"}
              </p>
            </div>
          </div>

          <Button onClick={handleSaveFooterPages} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Contact Info & Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {language === "bn" ? "যোগাযোগ তথ্য ও সোশ্যাল লিংক" : "Contact Info & Social Links"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === "bn"
              ? "Footer-এ প্রদর্শিত ফোন, ইমেইল, ঠিকানা এবং সোশ্যাল মিডিয়া লিংক"
              : "Phone, email, address and social media links shown in the footer"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "ফোন নম্বর" : "Phone Number"}</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+880 17XXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "ইমেইল" : "Email"}</Label>
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="support@example.com"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "ঠিকানা (বাংলা)" : "Address (Bangla)"}</Label>
              <Input
                value={contactAddressBn}
                onChange={(e) => setContactAddressBn(e.target.value)}
                placeholder="ঢাকা, বাংলাদেশ"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "ঠিকানা (ইংরেজি)" : "Address (English)"}</Label>
              <Input
                value={contactAddressEn}
                onChange={(e) => setContactAddressEn(e.target.value)}
                placeholder="Dhaka, Bangladesh"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
          <Button onClick={handleSaveContactSocial} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            {language === "bn" ? "WhatsApp সেটিংস" : "WhatsApp Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{language === "bn" ? "WhatsApp নম্বর (880 দিয়ে শুরু)" : "WhatsApp Number (starts with 880)"}</Label>
            <Input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="8801XXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">
              {language === "bn"
                ? "উদাহরণ: 8801347195345 — Homepage-এর WhatsApp বাটনে এই নম্বর ব্যবহার হবে"
                : "Example: 8801347195345 — This number will be used on the homepage WhatsApp button"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{language === "bn" ? "WhatsApp Default Message" : "WhatsApp Default Message"}</Label>
            <Textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder={language === "bn" ? "হ্যালো! আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।" : "Hello! I am interested in a product."}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {language === "bn"
                ? "User WhatsApp বাটনে click করলে এই message auto-fill হবে"
                : "This message will be auto-filled when the user clicks the WhatsApp button"}
            </p>
          </div>

          <Button onClick={handleSaveWhatsApp} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* CTA Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {language === "bn" ? "CTA সেকশন (Homepage)" : "CTA Section (Homepage)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "শিরোনাম (বাংলা)" : "Title (Bangla)"}</Label>
              <Input value={ctaTitleBn} onChange={(e) => setCtaTitleBn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "শিরোনাম (ইংরেজি)" : "Title (English)"}</Label>
              <Input value={ctaTitleEn} onChange={(e) => setCtaTitleEn(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "সাবটাইটেল (বাংলা)" : "Subtitle (Bangla)"}</Label>
              <Input value={ctaSubtitleBn} onChange={(e) => setCtaSubtitleBn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "সাবটাইটেল (ইংরেজি)" : "Subtitle (English)"}</Label>
              <Input value={ctaSubtitleEn} onChange={(e) => setCtaSubtitleEn(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "bn" ? "বাটন টেক্সট (বাংলা)" : "Button Text (Bangla)"}</Label>
              <Input value={ctaButtonTextBn} onChange={(e) => setCtaButtonTextBn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "বাটন টেক্সট (ইংরেজি)" : "Button Text (English)"}</Label>
              <Input value={ctaButtonTextEn} onChange={(e) => setCtaButtonTextEn(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{language === "bn" ? "বাটন লিংক" : "Button Link"}</Label>
            <Input value={ctaButtonLink} onChange={(e) => setCtaButtonLink(e.target.value)} placeholder="/products" />
          </div>
          <Button onClick={handleSaveCTA} disabled={updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
