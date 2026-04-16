import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Info, 
  Shield, 
  Server, 
  Package, 
  Users, 
  CreditCard, 
  Truck,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  Database,
  Globe,
  Lock,
  Rocket,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FeatureStatusIndicator } from "./ComingSoonBadge";

interface ModuleInfo {
  id: string;
  nameBn: string;
  nameEn: string;
  status: "live" | "demo" | "coming_soon" | "requires_setup";
  descriptionBn: string;
  descriptionEn: string;
  configurable: boolean;
  productionNoteBn?: string;
  productionNoteEn?: string;
}

const PLATFORM_MODULES: ModuleInfo[] = [
  {
    id: "products",
    nameBn: "পণ্য ব্যবস্থাপনা",
    nameEn: "Product Management",
    status: "live",
    descriptionBn: "পণ্য যোগ, সম্পাদনা, বাল্ক অপারেশন, SEO সেটিংস",
    descriptionEn: "Add, edit products, bulk operations, SEO settings",
    configurable: true,
  },
  {
    id: "categories",
    nameBn: "ক্যাটাগরি ব্যবস্থাপনা",
    nameEn: "Category Management", 
    status: "live",
    descriptionBn: "হায়ারার্কিক্যাল ক্যাটাগরি, সর্টিং, ভিজিবিলিটি কন্ট্রোল",
    descriptionEn: "Hierarchical categories, sorting, visibility control",
    configurable: true,
  },
  {
    id: "brands",
    nameBn: "ব্র্যান্ড ব্যবস্থাপনা",
    nameEn: "Brand Management",
    status: "live",
    descriptionBn: "ব্র্যান্ড পরিচালনা, লোগো, SEO মেটাডেটা",
    descriptionEn: "Manage brands, logos, SEO metadata",
    configurable: true,
  },
  {
    id: "orders",
    nameBn: "অর্ডার ব্যবস্থাপনা",
    nameEn: "Order Management",
    status: "live",
    descriptionBn: "অর্ডার প্রসেসিং, স্ট্যাটাস আপডেট, ট্র্যাকিং",
    descriptionEn: "Order processing, status updates, tracking",
    configurable: true,
  },
  {
    id: "users",
    nameBn: "ইউজার ব্যবস্থাপনা",
    nameEn: "User Management",
    status: "live",
    descriptionBn: "গ্রাহক তালিকা, ব্লক/আনব্লক, প্রোফাইল দেখা",
    descriptionEn: "Customer list, block/unblock, view profiles",
    configurable: true,
  },
  {
    id: "affiliates",
    nameBn: "অ্যাফিলিয়েট সিস্টেম",
    nameEn: "Affiliate System",
    status: "live",
    descriptionBn: "আবেদন পর্যালোচনা, অনুমোদন, কমিশন ট্র্যাকিং",
    descriptionEn: "Application review, approval, commission tracking",
    configurable: true,
  },
  {
    id: "commission",
    nameBn: "কমিশন ইঞ্জিন",
    nameEn: "Commission Engine",
    status: "live",
    descriptionBn: "কমিশন রুল তৈরি, টায়ার্ড কমিশন, ক্যাম্পেইন রুল",
    descriptionEn: "Create commission rules, tiered commission, campaign rules",
    configurable: true,
  },
  {
    id: "coupons",
    nameBn: "কুপন ব্যবস্থাপনা",
    nameEn: "Coupon Management",
    status: "demo",
    descriptionBn: "ডিসকাউন্ট কুপন তৈরি, ব্যবহার সীমা, মেয়াদ",
    descriptionEn: "Create discount coupons, usage limits, expiry",
    configurable: true,
    productionNoteBn: "প্রোডাকশনে ডেটাবেজ ইন্টিগ্রেশন প্রয়োজন",
    productionNoteEn: "Requires database integration in production",
  },
  {
    id: "loyalty",
    nameBn: "লয়্যালটি প্রোগ্রাম",
    nameEn: "Loyalty Program",
    status: "demo",
    descriptionBn: "পয়েন্ট অর্জন ও রিডিম সেটিংস",
    descriptionEn: "Points earning and redemption settings",
    configurable: true,
    productionNoteBn: "প্রোডাকশনে চেকআউট ইন্টিগ্রেশন প্রয়োজন",
    productionNoteEn: "Requires checkout integration in production",
  },
  {
    id: "payouts",
    nameBn: "পেআউট সিস্টেম",
    nameEn: "Payout System",
    status: "coming_soon",
    descriptionBn: "অ্যাফিলিয়েট পেমেন্ট প্রসেসিং",
    descriptionEn: "Affiliate payment processing",
    configurable: false,
    productionNoteBn: "bKash/Nagad API ইন্টিগ্রেশন প্রয়োজন",
    productionNoteEn: "Requires bKash/Nagad API integration",
  },
  {
    id: "payment_gateway",
    nameBn: "পেমেন্ট গেটওয়ে",
    nameEn: "Payment Gateway",
    status: "coming_soon",
    descriptionBn: "অনলাইন পেমেন্ট গ্রহণ",
    descriptionEn: "Accept online payments",
    configurable: false,
    productionNoteBn: "SSL Commerz/bKash পেমেন্ট API প্রয়োজন",
    productionNoteEn: "Requires SSL Commerz/bKash payment API",
  },
  {
    id: "courier",
    nameBn: "কুরিয়ার ইন্টিগ্রেশন",
    nameEn: "Courier Integration",
    status: "coming_soon",
    descriptionBn: "স্বয়ংক্রিয় শিপিং লেবেল ও ট্র্যাকিং",
    descriptionEn: "Automatic shipping labels and tracking",
    configurable: false,
    productionNoteBn: "Pathao/Steadfast API ইন্টিগ্রেশন প্রয়োজন",
    productionNoteEn: "Requires Pathao/Steadfast API integration",
  },
];

export const SystemInfo = () => {
  const { language, t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<string[]>(["modules"]);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };
  
  const liveModules = PLATFORM_MODULES.filter(m => m.status === "live").length;
  const demoModules = PLATFORM_MODULES.filter(m => m.status === "demo").length;
  const comingSoonModules = PLATFORM_MODULES.filter(m => m.status === "coming_soon").length;
  
  return (
    <div className="space-y-6">
      {/* Platform Overview Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {language === "bn" ? "প্ল্যাটফর্ম ওভারভিউ" : "Platform Overview"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border bg-green-500/5 border-green-500/20 p-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{liveModules}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "সক্রিয় মডিউল" : "Live Modules"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-blue-500/5 border-blue-500/20 p-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{demoModules}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "ডেমো মডিউল" : "Demo Modules"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{comingSoonModules}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "শীঘ্রই আসছে" : "Coming Soon"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modules List */}
      <Collapsible 
        open={expandedSections.includes("modules")} 
        onOpenChange={() => toggleSection("modules")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {language === "bn" ? "মডিউল তালিকা" : "Module List"}
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections.includes("modules") ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {PLATFORM_MODULES.map((module) => (
                  <div 
                    key={module.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {language === "bn" ? module.nameBn : module.nameEn}
                        </span>
                        <FeatureStatusIndicator status={module.status} />
                        {module.configurable && (
                          <Badge variant="outline" className="text-xs">
                            {language === "bn" ? "কনফিগারযোগ্য" : "Configurable"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === "bn" ? module.descriptionBn : module.descriptionEn}
                      </p>
                      {(module.status === "coming_soon" || module.status === "demo") && module.productionNoteBn && (
                        <p className="mt-1 text-xs text-warning flex items-center gap-1">
                          <Rocket className="h-3 w-3" />
                          {language === "bn" ? module.productionNoteBn : module.productionNoteEn}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Security & Limits */}
      <Collapsible 
        open={expandedSections.includes("security")} 
        onOpenChange={() => toggleSection("security")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {language === "bn" ? "নিরাপত্তা ও সীমাবদ্ধতা" : "Security & Limits"}
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections.includes("security") ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-sm mb-1">
                    {language === "bn" ? "সর্বোচ্চ ডিসকাউন্ট" : "Max Discount"}
                  </p>
                  <p className="text-2xl font-bold text-primary">80%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "৫০% এর উপরে সতর্কতা দেখাবে" : "Warning shown above 50%"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-sm mb-1">
                    {language === "bn" ? "সর্বোচ্চ কমিশন" : "Max Commission"}
                  </p>
                  <p className="text-2xl font-bold text-primary">50%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "৩০% এর উপরে সতর্কতা দেখাবে" : "Warning shown above 30%"}
                  </p>
                </div>
              </div>
              
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>
                  {language === "bn" ? "রোল-বেসড অ্যাক্সেস" : "Role-Based Access"}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {language === "bn" 
                    ? "সুপার অ্যাডমিন, অপারেশনস অ্যাডমিন এবং মার্কেটিং অ্যাডমিন ভূমিকা সমর্থিত। প্রতিটি ভূমিকায় নির্দিষ্ট মডিউল অ্যাক্সেস রয়েছে।"
                    : "Super Admin, Operations Admin, and Marketing Admin roles are supported. Each role has specific module access."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Production Readiness */}
      <Collapsible 
        open={expandedSections.includes("production")} 
        onOpenChange={() => toggleSection("production")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  {language === "bn" ? "প্রোডাকশন রেডিনেস" : "Production Readiness"}
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections.includes("production") ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Alert className="border-warning/30 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">
                  {language === "bn" ? "প্রোডাকশনে যেতে প্রয়োজন" : "Required for Production"}
                </AlertTitle>
                <AlertDescription className="text-sm text-warning/90 space-y-1">
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{language === "bn" ? "পেমেন্ট গেটওয়ে ইন্টিগ্রেশন (bKash/SSL Commerz)" : "Payment gateway integration (bKash/SSL Commerz)"}</li>
                    <li>{language === "bn" ? "কুরিয়ার API সংযোগ (Pathao/Steadfast)" : "Courier API connection (Pathao/Steadfast)"}</li>
                    <li>{language === "bn" ? "SMS গেটওয়ে কনফিগারেশন" : "SMS gateway configuration"}</li>
                    <li>{language === "bn" ? "ইমেইল সার্ভিস সেটআপ" : "Email service setup"}</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {language === "bn" ? "ডেটাবেস স্ট্যাটাস" : "Database Status"}
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {language === "bn" ? "টেবিল সংখ্যা" : "Tables Count"}
                    </span>
                    <Badge variant="secondary">15+</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">RLS</span>
                    <Badge className="bg-green-500/10 text-green-600">
                      {language === "bn" ? "সক্রিয়" : "Enabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {language === "bn" ? "অথেনটিকেশন" : "Authentication"}
                    </span>
                    <Badge className="bg-green-500/10 text-green-600">
                      {language === "bn" ? "কনফিগার করা" : "Configured"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Handover Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {language === "bn" ? "হ্যান্ডওভার নোটস" : "Handover Notes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                {language === "bn" 
                  ? "✓ সমস্ত ফ্রন্টএন্ড কম্পোনেন্ট প্রোডাকশন-রেডি ডিজাইন প্যাটার্ন অনুসরণ করে"
                  : "✓ All frontend components follow production-ready design patterns"}
              </li>
              <li>
                {language === "bn"
                  ? "✓ ডেটাবেস স্কিমা RLS পলিসি সহ সুরক্ষিত"
                  : "✓ Database schema is secured with RLS policies"}
              </li>
              <li>
                {language === "bn"
                  ? "✓ বাংলা ও ইংরেজি উভয় ভাষায় সম্পূর্ণ সমর্থন"
                  : "✓ Full support for both Bangla and English"}
              </li>
              <li>
                {language === "bn"
                  ? "⚠ 'ডেমো' চিহ্নিত মডিউলগুলো প্রোডাকশনে ডেটাবেস সংযোগ প্রয়োজন"
                  : "⚠ Modules marked 'Demo' require database connection in production"}
              </li>
              <li>
                {language === "bn"
                  ? "⚠ 'শীঘ্রই আসছে' মডিউলগুলো বাহ্যিক API ইন্টিগ্রেশন প্রয়োজন"
                  : "⚠ 'Coming Soon' modules require external API integration"}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
