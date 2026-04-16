import { Copy, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product } from "@/data/products";
import { useState } from "react";
import { toast } from "sonner";
import { useCommissionRules } from "@/hooks/useAdminSettings";
import { resolveCommission } from "@/lib/commission-resolution";

interface AffiliateProductCardProps {
    product: Product;
    referralCode: string;
    defaultCommissionRate: number;
}

const AffiliateProductCard = ({ product, referralCode, defaultCommissionRate }: AffiliateProductCardProps) => {
    const { language, t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const { data: commissionRules } = useCommissionRules();

    // Commission calculation using centralized logic
    const { rate: commissionRate, type: commissionType, amount: commissionAmount, ruleType } = resolveCommission(
        product,
        commissionRules || [],
        defaultCommissionRate
    );
    const isFixed = commissionType === 'fixed';

    const referralLink = `${window.location.origin}/product/${product.id}?ref=${referralCode}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success(language === "bn" ? "লিঙ্ক কপি হয়েছে!" : "Link Copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow h-full border-slate-200 group">
            <Link to={`/product/${product.id}`} className="flex flex-col flex-1 gap-2">
                {/* Product Image */}
                <div className="aspect-[4/5] overflow-hidden rounded-sm bg-slate-50 relative">
                    <img
                        src={product.image}
                        alt={product.name[language]}
                        className="h-full w-full object-contain p-2 mix-blend-multiply transition-transform duration-300 group-hover:scale-110"
                    />
                </div>

                {/* Product Info */}
                <div className="flex flex-1 flex-col text-center space-y-2 mt-2">
                    <h3 className="line-clamp-2 text-sm font-bold text-[#333] min-h-[40px] leading-snug hover:text-primary transition-colors">
                        {product.name[language]}
                    </h3>

                    {product.brand && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{product.brand}</p>
                    )}

                    {/* Pricing */}
                    <div className="flex items-center justify-center gap-2 mt-auto">
                        <span className="text-sm font-bold text-[#333]">৳{product.price.toLocaleString()}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through decoration-slate-400">৳{product.originalPrice.toLocaleString()}</span>
                        )}
                    </div>

                    {/* Commission - Redesigned to match Rokomari */}
                    <div className="text-[11px] font-bold text-[#00a651] bg-[#eefaf3] py-1.5 px-3 rounded-sm inline-block mx-auto border border-[#00a651]/10">
                        {language === "bn"
                            ? `Commission ${commissionRate}${isFixed ? '৳' : '%'} (৳${Math.round(commissionAmount)})`
                            : `Commission ${commissionRate}${isFixed ? '৳' : '%'} (৳${Math.round(commissionAmount)})`
                        }
                    </div>
                </div>
            </Link>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
                <Button
                    size="sm"
                    className={cn(
                        "flex-1 text-[11px] h-9 gap-1.5 font-bold transition-all",
                        copied ? "bg-success hover:bg-success/90" : "bg-[#0070bb] hover:bg-[#005ea1]"
                    )}
                    onClick={handleCopyLink}
                >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {language === "bn" ? "Copy Link" : "Copy Link"}
                </Button>
            </div>
        </div>
    );
};

// Add cn utility if not present or import it
import { cn } from "@/lib/utils";

export default AffiliateProductCard;
