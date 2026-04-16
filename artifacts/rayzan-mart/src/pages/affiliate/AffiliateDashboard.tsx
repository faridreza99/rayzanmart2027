import { Copy, TrendingUp, DollarSign, MousePointer, ShoppingBag, Loader2, AlertCircle, Link as LinkIcon, Search } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCampaign, useMyAffiliate, useMyCampaigns, useMyCommissions } from "@/hooks/useAffiliate";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { affiliateTiers } from "@/data/affiliates";
import { toast } from "sonner";
import AffiliateSidebar from "@/components/affiliate/AffiliateSidebar";
import AffiliateProductCard from "@/components/affiliate/AffiliateProductCard";
import { WalletSection } from "@/components/affiliate/WalletSection";
import { useMyWalletBalance } from "@/hooks/useWithdrawals";
import { Wallet } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { CampaignsPanel } from "@/components/affiliate/CampaignsPanel";
import { LeaderboardPanel } from "@/components/affiliate/LeaderboardPanel";
import { TargetPanel } from "@/components/affiliate/TargetPanel";
import { ReportsPanel, OffersPanel } from "@/components/affiliate/ReportsPanel";
import { VideoCampaignsPanel } from "@/components/affiliate/VideoCampaignsPanel";

const AffiliateDashboard = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const currentTab = searchParams.get("tab") || "home";

  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLFormElement | null>(null);

  const { data: affiliate, isLoading: affiliateLoading } = useMyAffiliate();
  const { data: campaigns, isLoading: campaignsLoading } = useMyCampaigns();
  const { data: commissions, isLoading: commissionsLoading } = useMyCommissions();
  const { data: balance } = useMyWalletBalance();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const { mutate: createCampaign, isPending: creatingCampaign } = useCreateCampaign();

  const [productUrl, setProductUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const selectedCategoryIds = useMemo(() => {
    if (!categoryId || !categories) return null;

    const ids = new Set<string>([categoryId]);
    const queue = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = categories.filter((cat: any) => cat.parent_id === currentId);
      children.forEach((child: any) => {
        if (!ids.has(child.id)) {
          ids.add(child.id);
          queue.push(child.id);
        }
      });
    }

    return ids;
  }, [categoryId, categories]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const suggestedProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query || !products) return [];

    return products
      .filter((p) => {
        // Only affiliate products
        if (!(p.affiliate_commission_value && p.affiliate_commission_value > 0)) return false;

        const nameBn = p.name.bn?.toLowerCase() || "";
        const nameEn = p.name.en?.toLowerCase() || "";
        const brand = p.brand?.toLowerCase() || "";
        const sku = p.sku?.toLowerCase() || "";
        return (
          nameBn.includes(query) ||
          nameEn.includes(query) ||
          brand.includes(query) ||
          sku.includes(query)
        );
      })
      .slice(0, 8);
  }, [products, searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    // Filter by affiliate commission first
    let result = products.filter(p => p.affiliate_commission_value && p.affiliate_commission_value > 0);

    if (categoryId && selectedCategoryIds) {
      result = result.filter(p => selectedCategoryIds.has(p.category));
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        (p.name?.en?.toLowerCase() || "").includes(lowerTerm) ||
        (p.name?.bn?.toLowerCase() || "").includes(lowerTerm) ||
        (p.brand?.toLowerCase() || "").includes(lowerTerm) ||
        (p.sku?.toLowerCase() || "").includes(lowerTerm)
      );
    }

    return result;
  }, [products, searchTerm, categoryId, selectedCategoryIds]);

  const copyLink = (text?: string) => {
    if (!affiliate && !text) return;
    const targetText = text || `${window.location.origin}/?ref=${affiliate?.referral_code}`;
    navigator.clipboard.writeText(targetText);
    toast.success(t("copied"));
  };

  const handleGenerateLink = () => {
    if (!productUrl) return;

    try {
      let url: URL;
      if (productUrl.startsWith("http")) {
        url = new URL(productUrl);
        if (url.origin !== window.location.origin) {
          toast.error(t("invalidLink"));
          return;
        }
      } else {
        url = new URL(productUrl, window.location.origin);
      }

      url.searchParams.set("ref", affiliate?.referral_code || "");

      const finalUrl = url.toString();
      const utmSource = "link_generator";
      const nameBn = `Product Link: ${url.pathname.split("/").pop() || "Custom"}`;
      const nameEn = `Product Link: ${url.pathname.split("/").pop() || "Custom"}`;

      createCampaign({
        nameBn,
        nameEn,
        utmSource,
        productUrl: finalUrl
      }, {
        onSuccess: () => {
          setGeneratedLink(finalUrl);
          toast.success(language === "bn" ? "লিংক তৈরি হয়েছে" : "Link generated successfully");
        },
        onError: () => {
          toast.error(language === "bn" ? "একটি সমস্যা হয়েছে" : "An error occurred");
        }
      });

    } catch (error) {
      toast.error(t("invalidLink"));
    }
  };

  if (affiliateLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!affiliate) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">{t("becomeAffiliate")}</h1>
          <p className="mb-6 text-muted-foreground">
            {t("notAffiliate")}
          </p>
          <Button onClick={() => navigate("/affiliate/signup")}>{t("signup")}</Button>
        </div>
      </MainLayout>
    );
  }

  if (affiliate.status !== "active" && affiliate.status !== "approved") {
    return (
      <MainLayout>
        <div className="container py-12 flex flex-col items-center text-center">
          <div className="mb-6 p-4 rounded-full bg-warning/10 text-warning">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h1 className="mb-4 text-2xl font-bold">
            {affiliate.status === "pending" ? t("applicationPending") : t("accountDisabled")}
          </h1>
          <p className="mb-8 text-muted-foreground max-w-md">
            {affiliate.status === "pending" ? t("applicationPendingMsg") : t("accountDisabledMsg")}
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>{t("home")}</Button>
            <Button onClick={() => navigate("/dashboard")}>{t("dashboard")}</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const tierInfo = affiliateTiers[affiliate.tier as keyof typeof affiliateTiers] || affiliateTiers.bronze;

  const stats = [
    { label: language === "bn" ? "বর্তমান ব্যালেন্স" : "Available Balance", value: `${t("currency")}${Number(balance?.available_balance || 0).toLocaleString()}`, icon: Wallet, color: "text-success", action: () => navigate("/affiliate?tab=payment") },
    { label: t("totalSales"), value: `${t("currency")}${Number(affiliate.total_sales || 0).toLocaleString()}`, icon: ShoppingBag, color: "text-info" },
    { label: t("commission"), value: `${t("currency")}${Number(affiliate.total_commission || 0).toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: t("totalClicks"), value: affiliate.total_clicks || 0, icon: MousePointer, color: "text-warning" },
  ];

  const handleQuickAdd = (event: React.MouseEvent, product: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (product.stock <= 0) {
      toast.error(t("outOfStock"));
      return;
    }

    if (product.hasVariants) {
      navigate(`/product/${product.id}`);
      setIsSearchOpen(false);
      return;
    }

    addToCart(product);
    toast.success(t("itemAdded"));
  };

  const renderSearchResults = () => {
    if (!(searchTerm.trim() && isSearchOpen)) return null;

    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-xl border bg-background shadow-xl">
        {productsLoading ? (
           <div className="flex justify-center py-6">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
           </div>
        ) : suggestedProducts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {language === "bn" ? "কোন পণ্য পাওয়া যায়নি" : "No products found"}
          </div>
        ) : (
          suggestedProducts.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="flex items-start gap-3 border-b px-3 py-3 last:border-b-0 hover:bg-muted/40"
              onClick={() => {
                setIsSearchOpen(false);
              }}
            >
              <img
                src={product.image}
                alt={product.name[language]}
                className="h-14 w-14 shrink-0 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug break-words">{product.name[language]}</p>
                {(product.brand || product.sku) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {product.brand || product.sku}
                  </p>
                )}
                <p className="mt-1 text-base font-semibold">
                  {t("currency")}{product.price.toLocaleString()}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="ml-2 text-sm text-muted-foreground line-through">
                      {t("currency")}{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="shrink-0 h-9 rounded-full bg-blue-500 px-3 text-base font-semibold text-white hover:bg-blue-600"
                onClick={(e) => handleQuickAdd(e, product)}
              >
                +Add
              </Button>
            </Link>
          ))
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (currentTab === "payment") {
      return <WalletSection />;
    }

    if (currentTab === "campaigns") {
      return <CampaignsPanel affiliate={affiliate} />;
    }

    if (currentTab === "leaderboard") {
      return <LeaderboardPanel />;
    }

    if (currentTab === "videos") {
      return <VideoCampaignsPanel />;
    }

    if (currentTab === "report") {
      return <ReportsPanel />;
    }

    if (currentTab === "target") {
      return <TargetPanel />;
    }

    if (currentTab === "offers") {
      return <OffersPanel />;
    }

    if (currentTab === "home" || currentTab === "products") {
      const currentCategoryObj = categories?.find(c => c.id === categoryId);
      const categoryName = currentCategoryObj ? (language === "bn" ? currentCategoryObj.name_bn : currentCategoryObj.name_en) : null;

      const activeTabLabel = categoryName || (language === "bn" ? "সকল পণ্য" : "All Products");

      return (
        <div className="space-y-10 pb-12">
          {/* Main Content Sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#333] flex items-center gap-2">
                  {activeTabLabel}
                </h2>
                <div className="flex items-center gap-4">
                  <form 
                    onSubmit={(e) => e.preventDefault()} 
                    className="relative w-full max-w-xl flex-1" 
                    ref={searchRef}
                  >
                    <Input
                      placeholder={language === "bn" ? "খুঁজুন..." : "Search..."}
                      className="h-12 rounded-full border-2 border-[#2196f3] pr-12 text-base focus-visible:ring-[#2196f3]"
                      value={searchTerm}
                      onFocus={() => setIsSearchOpen(true)}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsSearchOpen(Boolean(e.target.value.trim()));
                      }}
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-[#2196f3] hover:bg-blue-50"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <div className="relative z-[9999]">
                      {renderSearchResults()}
                    </div>
                  </form>
                  <Button 
                    onClick={() => navigate("/affiliate/products")}
                    variant="ghost" 
                    className="text-sm font-bold text-[#00a651] hover:text-[#00a651] hover:bg-[#eefaf3] flex items-center gap-1 cursor-pointer"
                  >
                    {language === "bn" ? "সব দেখুন" : "See All"}
                    <TrendingUp className="h-4 w-4 rotate-45" />
                  </Button>
                </div>
              </div>

              {productsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0070bb]" />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredProducts.map((p) => (
                    <AffiliateProductCard
                      key={p.id}
                      product={p}
                      referralCode={affiliate.referral_code}
                      defaultCommissionRate={affiliate.commission_rate}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium">{language === "bn" ? "কোন পণ্য পাওয়া যায়নি" : "No products found"}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    // Default Overview Tab
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 p-4 h-full">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">{t("referralLink")}</p>
                <code className="text-sm bg-muted px-2 py-1 rounded break-all whitespace-normal">
                  {window.location.origin}/?ref={affiliate.referral_code}
                </code>
                <p className="mt-2 text-xs text-muted-foreground">{t("shareLink")}</p>
              </div>
              <Button onClick={() => copyLink()}><Copy className="h-4 w-4 mr-2" />{t("copy")}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-primary" />
                {t("linkGenerator")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder={t("productLinkPlaceholder")}
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="h-9"
                />
                <Button size="sm" onClick={handleGenerateLink} disabled={creatingCampaign} className="whitespace-nowrap">
                  {creatingCampaign ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t("generateLink")}
                </Button>
              </div>

              {generatedLink && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded border border-primary/20">
                  <p className="text-xs font-mono flex-1 break-all line-clamp-1">
                    {generatedLink}
                  </p>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(generatedLink)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className={stat.action ? "cursor-pointer hover:border-primary/50 transition-colors" : ""} onClick={stat.action}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Campaigns */}
          <Card>
            <CardHeader><CardTitle>{t("campaigns")}</CardTitle></CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : campaigns && campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{language === "bn" ? camp.name_bn : camp.name_en}</p>
                        <p className="text-sm text-muted-foreground">{camp.clicks} {t("totalClicks").toLowerCase()}, {camp.conversions} {t("totalSales").toLowerCase()}</p>
                      </div>
                      <Badge variant={camp.status === "active" ? "default" : "secondary"}>{t(camp.status as any)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <BarChart3 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-muted-foreground">{t("noCampaigns")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission History */}
          <Card>
            <CardHeader><CardTitle>{t("commissionHistory")}</CardTitle></CardHeader>
            <CardContent>
              {commissionsLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : commissions && commissions.length > 0 ? (
                <div className="space-y-3">
                  {commissions.map((comm) => (
                    <div key={comm.id} className="border-b pb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {comm.orders?.order_number ? `#${comm.orders.order_number}` : comm.commission_type}
                          </p>
                          <p className="text-sm text-muted-foreground">{new Date(comm.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{t("currency")}{Number(comm.amount).toLocaleString()}</p>
                          <Badge
                            variant={
                              comm.status === "paid" ? "default" :
                                comm.status === "approved" ? "success" :
                                  comm.status === "rejected" ? "destructive" :
                                    "secondary"
                            }
                          >
                            {t(comm.status as any)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <DollarSign className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-muted-foreground">{t("noCommissions")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-64px)] bg-slate-50/50">
        <AffiliateSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold">{t("affiliate")} {t("dashboard")}</h1>
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? `আফলিয়েট টিয়ার: ${tierInfo.name.bn}` : `Affiliate Tier: ${tierInfo.name.en}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={affiliate.status === "active" ? "bg-success" : "bg-warning"}>
                {tierInfo.name[language]} - {affiliate.commission_rate}%
              </Badge>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{user?.name?.slice(0, 1) || "A"}</span>
              </div>
            </div>
          </div>

          {renderContent()}
        </main>
      </div>
    </MainLayout>
  );
};

export default AffiliateDashboard;

