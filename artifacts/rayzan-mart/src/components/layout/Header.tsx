import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useSiteSettings } from "@/hooks/useAdminSettings";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useWishlist } from "@/hooks/useWishlist";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount, addToCart } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const { data: settings, error, isLoading } = useSiteSettings();
  const { data: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems?.length || 0;

  const siteName = language === "bn"
    ? settings?.site_name?.bn || t("appName")
    : settings?.site_name?.en || t("appName");

  // Filter to top-level active categories
  const topCategories = categories?.filter((c: any) => !c.parent_id && c.is_active) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setDesktopSearchOpen(false);
      setMobileSearchOpen(false);
    }
  };

  const isAffiliatePage = window.location.pathname.startsWith("/affiliate");

  const suggestedProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return (products || [])
      .filter((p) => {
        // If on affiliate page, only show products with commission
        if (isAffiliatePage) {
          if (!p.affiliate_commission_value || p.affiliate_commission_value <= 0) return false;
        }

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
  }, [products, searchQuery, isAffiliatePage]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(target)
      ) {
        setDesktopSearchOpen(false);
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleQuickAdd = (event: React.MouseEvent, product: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (product.stock <= 0) {
      toast.error(t("outOfStock"));
      return;
    }

    if (product.hasVariants) {
      navigate(`/product/${product.id}`);
      setDesktopSearchOpen(false);
      setMobileSearchOpen(false);
      return;
    }

    addToCart(product);
    toast.success(t("itemAdded"));
  };

  const renderSearchResults = () => {
    if (!(searchQuery.trim() && (desktopSearchOpen || mobileSearchOpen))) return null;

    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-xl border bg-background shadow-xl">
        {suggestedProducts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {t("noProducts")}
          </div>
        ) : (
          suggestedProducts.map((product) => {
            const content = (
              <>
                <img
                  src={product.image}
                  alt={product.name[language]}
                  className="h-14 w-14 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{product.name[language]}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {product.brand || product.sku || "\u00A0"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-sm text-muted-foreground line-through">
                        {t("currency")}{product.originalPrice.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xl font-semibold">
                      {t("currency")}{product.price.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 rounded-full bg-blue-500 px-3 text-base font-semibold text-white hover:bg-blue-600"
                    onClick={(e) => handleQuickAdd(e, product)}
                  >
                    +Add
                  </Button>
                </div>
              </>
            );

            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="flex items-center gap-3 border-b px-3 py-3 last:border-b-0 hover:bg-muted/40"
                onClick={() => {
                  setDesktopSearchOpen(false);
                  setMobileSearchOpen(false);
                }}
              >
                {content}
              </Link>
            );
          })
        )}
      </div>
    );
  };



  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-8 items-center justify-between text-sm">
          {/* Logo + site name — left side of top bar */}
          <Link to="/" className="flex items-center gap-2">
            {settings?.site_logo?.url ? (
              <img
                src={settings.site_logo.url}
                alt={siteName}
                className="h-5 w-auto object-contain"
              />
            ) : null}
            <span className="font-bold text-primary-foreground">{siteName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/affiliate-landing" className="hover:underline">
              {t("affiliateProgram")}
            </Link>
            <button
              onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
              className="flex items-center gap-1 hover:underline"
            >
              <Globe className="h-4 w-4" />
              {language === "bn" ? "English" : "বাংলা"}
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container py-3">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex h-14 items-center border-b px-4">
                <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  {settings?.site_logo?.url ? (
                    <img src={settings.site_logo.url} alt={siteName} className="h-8 w-auto object-contain" />
                  ) : (
                    siteName
                  )}
                </Link>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  {topCategories.map((cat: any) => (
                    <li key={cat.id}>
                      <Link
                        to={`/products?category=${cat.id}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <DynamicIcon name={cat.icon} className="h-4 w-4 shrink-0" fallback="📦" />
                        <span>{language === "bn" ? cat.name_bn : cat.name_en}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            {settings?.site_logo?.url ? (
              <img src={settings.site_logo.url} alt={siteName} className="h-10 w-auto object-contain" />
            ) : null}
            <span className={settings?.site_logo?.url ? "hidden md:inline-block" : ""}>{siteName}</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden flex-1 md:flex">
            <div ref={desktopSearchRef} className="relative w-full max-w-xl">
              <Input
                type="search"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setDesktopSearchOpen(true);
                  setMobileSearchOpen(false);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDesktopSearchOpen(Boolean(e.target.value.trim()));
                  setMobileSearchOpen(false);
                }}
                className="h-12 rounded-full border-[#2196f3] pr-12 text-base focus-visible:ring-[#2196f3]"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-[#2196f3] hover:bg-blue-50"
              >
                <Search className="h-4 w-4" />
              </Button>
              {desktopSearchOpen && renderSearchResults()}
            </div>
          </form>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            <Link to="/wishlist" className="relative hidden sm:block">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Heart className="h-5 w-5" />
              </Button>
              {wishlistCount > 0 && (
                <Badge className="absolute -right-1 -top-1 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs pointer-events-none">
                  {wishlistCount}
                </Badge>
              )}
            </Link>

            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {getItemCount() > 0 && (
                <Badge className="absolute -right-1 -top-1 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs pointer-events-none">
                  {getItemCount()}
                </Badge>
              )}
            </Link>

            <NotificationCenter />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">{user?.name}</div>
                  <DropdownMenuSeparator />
                  {user?.roles?.includes("admin") && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">{t("adminDashboard")}</Link>
                    </DropdownMenuItem>
                  )}
                  {user?.roles?.includes("affiliate") && (
                    <DropdownMenuItem asChild>
                      <Link to="/affiliate">{t("affiliateDashboard")}</Link>
                    </DropdownMenuItem>
                  )}
                  {!user?.roles?.includes("admin") && !user?.roles?.includes("affiliate") && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">{t("dashboard")}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/orders">{t("orders")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile">{t("profile")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm">
                  {t("login")}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="mt-3 md:hidden">
          <div ref={mobileSearchRef} className="relative">
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim()) setMobileSearchOpen(true);
                setDesktopSearchOpen(false);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setMobileSearchOpen(Boolean(e.target.value.trim()));
                setDesktopSearchOpen(false);
              }}
              className="h-12 rounded-full border-[#2196f3] pr-12 text-base focus-visible:ring-[#2196f3]"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-[#2196f3] hover:bg-blue-50"
            >
              <Search className="h-4 w-4" />
            </Button>
            {mobileSearchOpen && renderSearchResults()}
          </div>
        </form>
      </div>

      {/* Categories bar - desktop */}
      <div className="hidden border-t bg-muted/30 lg:block">
        <div className="container">
          <nav className="flex items-center gap-1 overflow-x-auto py-2">
            {topCategories.map((cat: any) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <DynamicIcon name={cat.icon} className="h-4 w-4 shrink-0" fallback="📦" />
                <span>{language === "bn" ? cat.name_bn : cat.name_en}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
