import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Copy, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAddToWishlist, useIsInWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useMyAffiliate } from "@/hooks/useAffiliate";
import { Product } from "@/data/products";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCommissionRules } from "@/hooks/useAdminSettings";
import { resolveCommission } from "@/lib/commission-resolution";

interface ProductCardProps {
  product: Product;
  showCampaignLabel?: boolean;
}

export const ProductCard = ({ product, showCampaignLabel = true }: ProductCardProps) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useMyAffiliate();
  const { data: commissionRules } = useCommissionRules();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const isInWishlist = useIsInWishlist(product.id);
  const [copied, setCopied] = useState(false);

  // Faster role-based check as a hint, but database status is the source of truth
  const isAffiliate = (!!affiliate && affiliate.status === "active") || user?.role === 'affiliate' || user?.role === 'admin';
  const showAffiliateTools = isAffiliate;

  // --- Dynamic Commission Calculation Logic ---
  const { rate: commissionRate, type: commissionType, amount: commissionAmount, ruleType: effectiveRuleType } = useMemo(() => {
    return resolveCommission(
      product,
      commissionRules || [],
      affiliate?.commission_rate || 5
    );
  }, [commissionRules, product, affiliate]);

  const isFixed = commissionType === 'fixed';

  // Referral link with fallback to a default if affiliate record is missing
  const referralCode = affiliate?.referral_code || user?.id?.substring(0, 8).toUpperCase() || "REF";
  const referralLink = `${window.location.origin}/product/${product.id}?ref=${referralCode}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!affiliate) return;

    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(language === "bn" ? "লিঙ্ক কপি হয়েছে!" : "Link Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Placeholder for content functionality
  };

  // Demo campaign labels based on product attributes
  const getCampaignLabel = () => {
    if (!showCampaignLabel) return null;
    if (product.discount && product.discount >= 25) {
      return { text: t("flashSaleLabel"), variant: "destructive" as const };
    }
    if (product.reviews > 150) {
      return { text: t("bestSellerLabel"), variant: "default" as const };
    }
    if (product.featured) {
      return { text: t("newArrivalLabel"), variant: "secondary" as const };
    }
    return null;
  };

  const campaignLabel = getCampaignLabel();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(t("itemAdded"));
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-sm transition-all card-hover border border-slate-200">
      <Link
        to={`/product/${product.id}`}
        className="flex flex-col h-full"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-white">
          <img
            src={product.image}
            alt={product.name[language]}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
          {campaignLabel && (
            <Badge className={`absolute left-2 top-2 ${campaignLabel.variant === "destructive" ? "bg-destructive" : campaignLabel.variant === "secondary" ? "bg-secondary text-secondary-foreground" : "bg-primary"}`}>
              {campaignLabel.text}
            </Badge>
          )}
          {product.discount && !campaignLabel && (
            <Badge className="absolute left-2 top-2 bg-destructive text-white font-bold">
              -{product.discount}%
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary" className="text-sm font-bold">
                {t("outOfStock")}
              </Badge>
            </div>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 shadow-sm border border-slate-100"
            onClick={handleWishlistToggle}
            disabled={addToWishlist.isPending || removeFromWishlist.isPending}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current text-destructive" : ""}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-1 line-clamp-2 text-sm font-bold text-[#333] group-hover:text-[#0070bb] transition-colors h-10 leading-snug">
            {product.name[language]}
          </h3>

          {product.brand && (
            <p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{product.brand}</p>
          )}

          {/* Rating */}
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="text-[11px] font-semibold text-muted-foreground">
              {product.rating} ({product.reviews})
            </span>
          </div>

          {/* Price */}
          <div className="mt-auto mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#333]">
                {t("currency")}{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-slate-400 line-through decoration-slate-400">
                  {t("currency")}{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Affiliate Commission Label */}
          {isAffiliate && (
            <div
              className="mb-3 text-[11px] font-bold text-[#00a651] bg-[#eefaf3] py-1.5 px-3 rounded-sm inline-block mr-auto border border-[#00a651]/10"
              data-rule-type={effectiveRuleType}
              data-commission-value={commissionRate}
            >
              {language === "bn"
                ? `Commission ${commissionRate}${isFixed ? '৳' : '%'} (৳${Math.round(commissionAmount)}) [${effectiveRuleType}]`
                : `Commission ${commissionRate}${isFixed ? '৳' : '%'} (৳${Math.round(commissionAmount)}) [${effectiveRuleType}]`
              }
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            {affiliateLoading && isAuthenticated ? (
              <div className="w-full h-9 bg-slate-100 animate-pulse rounded-md mt-1" />
            ) : !isAffiliate ? (
              <Button
                size="sm"
                className="w-full h-9 font-bold bg-[#f37021] hover:bg-[#e66110] transition-colors"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t("addToCart")}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  size="sm"
                  className={cn(
                    "w-full h-9 gap-1.5 text-[11px] font-bold transition-all",
                    copied ? "bg-success hover:bg-success/90" : "bg-[#0070bb] hover:bg-[#005ea1]"
                  )}
                  onClick={handleCopyLink}
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {language === "bn" ? "Copy Link" : "Copy Link"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 gap-1.5 text-[11px] font-bold text-[#0070bb] border-[#0070bb] hover:bg-[#0070bb]/5"
                  onClick={handleContentClick}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {language === "bn" ? "Content" : "Content"}
                </Button>
              </div>
            )}

            {/* Show Add to Cart even for affiliates but styled differently/smaller? 
                Actually, Rokomari allows both. Let's add a smaller add to cart below for affiliates. */}
            {isAffiliate && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full h-8 mt-1 text-[11px] font-bold text-slate-500 hover:text-primary hover:bg-primary/5"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                {t("addToCart")}
              </Button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
