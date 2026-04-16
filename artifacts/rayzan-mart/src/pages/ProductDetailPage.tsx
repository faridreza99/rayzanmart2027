import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Star,
  Minus, Plus, Loader2, CreditCard, Headphones, Copy, Check,
  AlertTriangle, Flame, Package, ZoomIn,
  MessageCircle
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useAddToWishlist, useIsInWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useSiteSettings } from "@/hooks/useAdminSettings";
import { ProductReviews } from "@/components/product/ProductReviews";
import { BD_DISTRICTS } from "@/lib/districts";
import { toast } from "sonner";
import { getOptimizedUrl } from "@/lib/cloudinary";

// --- Recently Viewed Helper ---
const RECENTLY_VIEWED_KEY = "recently_viewed_products";
const MAX_RECENTLY_VIEWED = 10;

const addToRecentlyViewed = (productId: string) => {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]") as string[];
    const updated = [productId, ...stored.filter(id => id !== productId)].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
};

const getRecentlyViewed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
  } catch { return []; }
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const { data: product, isLoading } = useProduct(id || "");
  const { data: allProducts } = useProducts();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: settings } = useSiteSettings();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const isInWishlist = useIsInWishlist(id || "");

  // Resolve category name from ID
  const categoryName = product?.category && categories
    ? categories.find(c => c.id === product.category)
    : null;
  const brandInfo = product?.brand && brands ? brands.find((b) => b.id === product.brand) : null;
  const brandName = product?.brand
    ? (brandInfo ? (language === "bn" ? brandInfo.name_bn : brandInfo.name_en) : product.brand)
    : null;

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedDistrict, setSelectedDistrict] = useState("Chattogram");
  const [showDistrictSelector, setShowDistrictSelector] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (id) addToRecentlyViewed(id);
  }, [id]);

  useEffect(() => {
    const savedDistrict = localStorage.getItem("preferred_delivery_district");
    if (savedDistrict) {
      setSelectedDistrict(savedDistrict);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("preferred_delivery_district", selectedDistrict);
  }, [selectedDistrict]);

  // Auto-select first variant on load
  useEffect(() => {
    if (product?.hasVariants && product.variants && product.variants.length > 0) {
      const firstAvailable = product.variants.find(v => v.stock > 0) || product.variants[0];
      if (firstAvailable && Object.keys(selectedOptions).length === 0) {
        setSelectedOptions(firstAvailable.attributes);
      }
    }
  }, [product]);

  const currentVariant = product?.hasVariants
    ? product?.variants?.find(v => {
      return Object.keys(v.attributes).every(k => v.attributes[k] === selectedOptions[k]);
    })
    : null;

  const displayPrice = currentVariant?.price || product?.price || 0;
  const displayStock = product?.hasVariants ? (currentVariant?.stock || 0) : (product?.stock || 0);
  const displaySku = currentVariant?.sku || product?.sku;
  const insideCityCharge = settings?.delivery_charges?.inside_city ?? 60;
  const outsideCityCharge = settings?.delivery_charges?.outside_city ?? 120;
  const isInsideCityDelivery = selectedDistrict === "Chattogram";
  const deliveryCharge = isInsideCityDelivery ? insideCityCharge : outsideCityCharge;
  const productSubtotal = displayPrice * quantity;
  const totalWithDelivery = productSubtotal + deliveryCharge;
  const savingsPerUnit =
    product?.originalPrice && product.originalPrice > displayPrice
      ? product.originalPrice - displayPrice
      : 0;
  const totalSavings = savingsPerUnit * quantity;
  const selectedDistrictLabel = BD_DISTRICTS.find((d) => d.en === selectedDistrict)?.[language] || selectedDistrict;

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  // --- Image Zoom ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  // --- Social Share ---
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = product ? `${product.name[language]} - ${t("currency")}${product.price}` : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success(language === "bn" ? "লিংক কপি হয়েছে" : "Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  // --- Recently Viewed Products ---
  const recentlyViewedIds = getRecentlyViewed().filter(rvId => rvId !== id);
  const recentlyViewedProducts = (allProducts || []).filter(p => recentlyViewedIds.includes(p.id)).slice(0, 4);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold">
            {language === "bn" ? "পণ্য পাওয়া যায়নি" : "Product not found"}
          </h1>
          <Link to="/products">
            <Button className="mt-4">{t("continueShopping")}</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Combine primary image + gallery images
  const allImages = [
    product.image,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean);

  const relatedProducts = (allProducts || [])
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (product.hasVariants && !currentVariant) {
      toast.error(language === "bn" ? "দয়া করে আগে অপশন নির্বাচন করুন" : "Please select options first");
      return;
    }

    // Pass the selected variant as the 3rd argument
    (addToCart as any)(product, quantity, currentVariant);
    toast.success(t("itemAdded"));
  };

  const handleBuyNow = () => {
    if (product?.hasVariants && !currentVariant) {
      toast.error(language === "bn" ? "দয়া করে আগে অপশন নির্বাচন করুন" : "Please select options first");
      return;
    }

    localStorage.setItem("preferred_delivery_district", selectedDistrict);
    (addToCart as any)(product, quantity, currentVariant);
    navigate("/checkout");
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error(language === "bn" ? "উইশলিস্টে যোগ করতে লগইন করুন" : "Please login to use wishlist");
      return;
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist.mutateAsync(product.id);
        toast.success(language === "bn" ? "উইশলিস্ট থেকে সরানো হয়েছে" : "Removed from wishlist");
      } else {
        await addToWishlist.mutateAsync(product.id);
        toast.success(language === "bn" ? "উইশলিস্টে যোগ হয়েছে" : "Added to wishlist");
      }
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const currentImage = allImages[selectedImageIndex] || product.image;

  // Simulated sold count based on product id hash
  const soldCount = Math.abs(product.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 200) + 50;

  return (
    <MainLayout>
      <div className="container py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">{t("home")}</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-primary">{t("products")}</Link>
          {categoryName && (
            <>
              <span className="mx-2">/</span>
              <Link to={`/products?category=${product.category}`} className="hover:text-primary">
                {language === "bn" ? categoryName.name_bn : categoryName.name_en}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span>{product.name[language]}</span>
        </nav>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
          {/* Images with Zoom */}
          <div>
            <div className="rounded-xl border bg-card p-3">
              <div className="grid gap-3 lg:grid-cols-[96px_minmax(0,1fr)]">
                {/* Thumbnail rail */}
                <div className="order-2 lg:order-1">
                  {allImages.length > 1 ? (
                    <div className="flex gap-2 overflow-x-auto lg:max-h-[560px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden pr-1">
                      {allImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                            selectedImageIndex === index
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-transparent hover:border-muted-foreground/30"
                          }`}
                        >
                          <img
                            src={getOptimizedUrl(img, 150, 150)}
                            alt={`${product.name[language]} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="hidden lg:block h-20 w-20 rounded-lg border bg-muted/40" />
                  )}
                </div>

                {/* Main image stage */}
                <div
                  ref={imageRef}
                  className="order-1 relative aspect-square overflow-hidden rounded-xl bg-muted cursor-crosshair group"
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                >
                  <img
                    src={getOptimizedUrl(currentImage, 1000, 1000)}
                    alt={product.name[language]}
                    className="h-full w-full object-contain"
                  />
                  {product.discount && (
                    <Badge className="absolute left-4 top-4 bg-destructive text-lg z-10">
                      -{product.discount}%
                    </Badge>
                  )}
                  <div
                    className={`absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white transition-opacity z-10 ${
                      isZooming ? "opacity-0" : "opacity-60"
                    }`}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div>
            {isZooming && (
              <div className="mb-4 hidden lg:block">
                <div className="rounded-xl border bg-card p-2">
                  <div
                    className="aspect-square rounded-lg bg-no-repeat bg-[length:200%_200%]"
                    style={{
                      backgroundImage: `url(${getOptimizedUrl(currentImage, 1200, 1200)})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <h1 className="mb-2 text-2xl font-bold lg:text-3xl">
              {product.name[language]}
            </h1>

            {/* Category / Brand / SKU */}
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {categoryName && (
                <p>
                  {language === "bn" ? "ক্যাটাগরি:" : "Category:"}{" "}
                  <Link to={`/products?category=${product.category}`} className="text-primary font-medium hover:underline">
                    {language === "bn" ? categoryName.name_bn : categoryName.name_en}
                  </Link>
                </p>
              )}
              {brandName && (
                <p>
                  {language === "bn" ? "ব্র্যান্ড:" : "Brand:"}{" "}
                  <span className="text-primary font-medium">{brandName}</span>
                </p>
              )}
              {displaySku && (
                <p>
                  {language === "bn" ? "কোড:" : "SKU:"}{" "}
                  <span className="font-mono text-xs">{displaySku}</span>
                </p>
              )}
            </div>

            {/* Rating + Sold Count */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating)
                      ? "fill-warning text-warning"
                      : "text-muted"
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviews} {language === "bn" ? "রিভিউ" : "reviews"})
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {soldCount} {language === "bn" ? "বিক্রি হয়েছে" : "sold"}
              </span>
            </div>

            {/* Variant Options */}
            {product.hasVariants && product.variantOptions && (
              <div className="mb-6 space-y-4">
                {product.variantOptions.map((opt: any) => (
                  <div key={opt.name}>
                    <h3 className="mb-2 text-sm font-medium">{opt.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val: string) => {
                        const isSelected = selectedOptions[opt.name] === val;
                        return (
                          <Button
                            key={val}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleOptionSelect(opt.name, val)}
                          >
                            {val}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {product.hasVariants && !currentVariant && Object.keys(selectedOptions).length > 0 && (
                  <p className="text-sm text-destructive">This combination is unavailable.</p>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  {t("currency")}{productSubtotal.toLocaleString()}
                </span>
                {quantity > 1 && (
                  <span className="text-sm text-muted-foreground mt-1">
                    ({t("currency")}{displayPrice.toLocaleString()} x {quantity})
                  </span>
                )}
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {t("currency")}{(product.originalPrice * quantity).toLocaleString()}
                  </span>
                )}
              </div>
              {totalSavings > 0 && (
                <p className="mt-1 text-sm text-success">
                  {language === "bn"
                    ? `আপনি বাঁচাচ্ছেন ৳${totalSavings.toLocaleString()}`
                    : `You save ৳${totalSavings.toLocaleString()}`}
                </p>
              )}
            </div>

            {/* Stock + Urgency Alert */}
            <div className="mb-6 flex items-center gap-3">
              {displayStock > 0 ? (
                <>
                  <Badge variant="outline" className="border-success text-success">
                    {t("inStock")} ({displayStock})
                  </Badge>
                  {displayStock <= 5 && (
                    <span className="flex items-center gap-1 text-sm text-orange-600 font-medium animate-pulse">
                      <AlertTriangle className="h-4 w-4" />
                      {language === "bn"
                        ? `মাত্র ${displayStock}টি বাকি!`
                        : `Only ${displayStock} left!`}
                    </span>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="border-destructive text-destructive">
                  {t("outOfStock")}
                </Badge>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">{t("quantity")}</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                  disabled={quantity >= displayStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="flex-1 btn-bounce"
                onClick={handleAddToCart}
                disabled={displayStock === 0 || (product.hasVariants && !currentVariant)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t("addToCart")}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleBuyNow}
                disabled={displayStock === 0 || (product.hasVariants && !currentVariant)}
              >
                {t("buyNow")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlistToggle}
                disabled={addToWishlist.isPending || removeFromWishlist.isPending}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current text-destructive" : ""}`} />
              </Button>
              {/* Share button with dropdown */}
              <div className="relative">
                <Button variant="outline" size="icon" onClick={() => setShowShareMenu(!showShareMenu)}>
                  <Share2 className="h-5 w-5" />
                </Button>
                {showShareMenu && (
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border bg-card p-2 shadow-lg animate-in fade-in-0 zoom-in-95">
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="text-green-500 font-bold text-lg">W</span>
                      WhatsApp
                    </button>
                    <button
                      onClick={handleShareFacebook}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="text-blue-600 font-bold text-lg">f</span>
                      Facebook
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      {linkCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      {linkCopied ? (language === "bn" ? "কপি হয়েছে!" : "Copied!") : (language === "bn" ? "লিংক কপি" : "Copy Link")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="grid gap-3 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {language === "bn"
                    ? "চট্টগ্রামে ২-৩ দিন, চট্টগ্রামের বাইরে ৩-৫ দিন"
                    : "2-3 days in Chittagong, 3-5 days outside"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {language === "bn" ? "১০০% অথেন্টিক পণ্য" : "100% Authentic Product"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {language === "bn" ? "ক্যাশ অন ডেলিভারি সুবিধা" : "Cash on Delivery Available"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {language === "bn" ? "২৪/৭ কাস্টমার সাপোর্ট" : "24/7 Customer Support"}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === "bn" ? "পেমেন্ট পার্টনার" : "Payment Partners"}
              </p>
              <div className="flex flex-wrap gap-2 opacity-70 grayscale hover:grayscale-0 transition-all">
                <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold">bKash</span>
                <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold">Nagad</span>
                <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold">VISA</span>
                <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold">Mastercard</span>
              </div>
            </div>
          </div>

          {/* Delivery Sidebar */}
          <div className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-xl border bg-card">
              <div className="border-b p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {language === "bn" ? "ডেলিভারি অপশন" : "Delivery Options"}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-primary"
                    onClick={() => setShowDistrictSelector((prev) => !prev)}
                  >
                    {showDistrictSelector
                      ? (language === "bn" ? "বন্ধ করুন" : "Close")
                      : (language === "bn" ? "পরিবর্তন" : "Change")}
                  </Button>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Truck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p>
                    {language === "bn" ? "ডেলিভারি জেলা:" : "Delivery District:"}{" "}
                    <span className="font-medium">{selectedDistrictLabel}</span>
                  </p>
                </div>
                {showDistrictSelector && (
                  <div className="mt-3">
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BD_DISTRICTS.map((district) => (
                          <SelectItem key={district.en} value={district.en}>
                            {language === "bn" ? district.bn : district.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {language === "bn" ? "স্ট্যান্ডার্ড ডেলিভারি" : "Standard Delivery"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isInsideCityDelivery
                          ? (language === "bn" ? "ডেলিভারি: ২-৩ দিন" : "Estimated delivery: 2-3 days")
                          : (language === "bn" ? "ডেলিভারি: ৩-৫ দিন" : "Estimated delivery: 3-5 days")}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold">{t("currency")}{deliveryCharge.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{language === "bn" ? "ক্যাশ অন ডেলিভারি উপলব্ধ" : "Cash on Delivery Available"}</span>
                </div>
              </div>

              <div className="border-t p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "bn" ? "পণ্যের মূল্য" : "Product Price"}</span>
                    <span>{t("currency")}{productSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "bn" ? "ডেলিভারি চার্জ" : "Delivery Fee"}</span>
                    <span>{t("currency")}{deliveryCharge.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-bold">
                    <span>{language === "bn" ? "মোট পরিশোধযোগ্য" : "Total Payable"}</span>
                    <span className="text-primary">{t("currency")}{totalWithDelivery.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description + Specifications + Reviews */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">{t("description")}</TabsTrigger>
              <TabsTrigger value="specifications">
                {language === "bn" ? "স্পেসিফিকেশন" : "Specifications"}
              </TabsTrigger>
              <TabsTrigger value="reviews">{t("reviews")}</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <div className="rounded-xl bg-card p-6">
                <p className="text-muted-foreground whitespace-pre-line">{product.description[language]}</p>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="mt-4">
              <div className="rounded-xl bg-card p-6">
                <table className="w-full text-sm">
                  <tbody>
                    {categoryName && (
                      <tr className="border-b">
                        <td className="py-3 font-medium w-1/3 text-muted-foreground">
                          {language === "bn" ? "ক্যাটাগরি" : "Category"}
                        </td>
                        <td className="py-3">{language === "bn" ? categoryName.name_bn : categoryName.name_en}</td>
                      </tr>
                    )}
                    {brandName && (
                      <tr className="border-b">
                        <td className="py-3 font-medium w-1/3 text-muted-foreground">
                          {language === "bn" ? "ব্র্যান্ড" : "Brand"}
                        </td>
                        <td className="py-3">{brandName}</td>
                      </tr>
                    )}
                    {displaySku && (
                      <tr className="border-b">
                        <td className="py-3 font-medium w-1/3 text-muted-foreground">
                          {language === "bn" ? "প্রোডাক্ট কোড" : "SKU / Product Code"}
                        </td>
                        <td className="py-3 font-mono text-xs">{displaySku}</td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="py-3 font-medium w-1/3 text-muted-foreground">
                        {language === "bn" ? "স্টক" : "Stock"}
                      </td>
                      <td className="py-3">{displayStock > 0 ? `${displayStock} ${language === "bn" ? "টি" : "units"}` : (language === "bn" ? "স্টক শেষ" : "Out of Stock")}</td>
                    </tr>
                    {product.hasVariants && currentVariant && (
                      <tr className="border-b">
                        <td className="py-3 font-medium w-1/3 text-muted-foreground">
                          {language === "bn" ? "নির্বাচিত অপশন" : "Selected Options"}
                        </td>
                        <td className="py-3">
                          {Object.entries(currentVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(" / ")}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="py-3 font-medium w-1/3 text-muted-foreground">
                        {language === "bn" ? "রেটিং" : "Rating"}
                      </td>
                      <td className="py-3">{product.rating}/5 ({product.reviews} {language === "bn" ? "রিভিউ" : "reviews"})</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-medium w-1/3 text-muted-foreground">
                        {language === "bn" ? "ওয়ারেন্টি" : "Warranty"}
                      </td>
                      <td className="py-3">{language === "bn" ? "প্রযোজ্য হলে প্রস্তুতকারকের ওয়ারেন্টি" : "Manufacturer warranty if applicable"}</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium w-1/3 text-muted-foreground">
                        {language === "bn" ? "রিটার্ন পলিসি" : "Return Policy"}
                      </td>
                      <td className="py-3">{language === "bn" ? "৭ দিনের সহজ রিটার্ন" : "7-day easy return"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-4">
              <div className="rounded-xl bg-card p-6">
                <ProductReviews
                  productId={product.id}
                  productRating={product.rating}
                  reviewCount={product.reviews}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">{t("relatedProducts")}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">
              {language === "bn" ? "সম্প্রতি দেখা পণ্য" : "Recently Viewed"}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recentlyViewedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductDetailPage;
