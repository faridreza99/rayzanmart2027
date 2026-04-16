import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Gift, Download, Loader2, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import AffiliateProductCard from "./AffiliateProductCard";
import { useMyAffiliate } from "@/hooks/useAffiliate";

export const ReportsPanel = () => {
    const { language, t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{language === "bn" ? "রিপোর্ট ও অ্যানালিটিক্স" : "Reports & Analytics"}</h2>
                    <p className="text-sm text-slate-500">{language === "bn" ? "আপনার পারফরম্যান্স রিপোর্ট দেখুন" : "View your detailed performance reports"}</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    {language === "bn" ? "রিপোর্ট ডাউনলোড" : "Download PDF"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {language === "bn" ? "মাসিক সারাংশ" : "Monthly Summary"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: { bn: "মোট ক্লিক", en: "Total Clicks" }, value: "1,250", trend: "+12%" },
                            { label: { bn: "কনভার্সন", en: "Conversions" }, value: "45", trend: "+5%" },
                            { label: { bn: "আয় (কমিশন)", en: "Total Earnings" }, value: "৳১২,৫০০", trend: "+18%" },
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{language === "bn" ? stat.label.bn : stat.label.en}</p>
                                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                                </div>
                                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">{stat.trend}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            {language === "bn" ? "সেরা পারফর্মিং প্রোডাক্ট" : "Top Products"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">{language === "bn" ? "প্রোডাক্ট ডাটা লোড হচ্ছে..." : "Loading product insights..."}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export const OffersPanel = () => {
    const { language, t } = useLanguage();
    const { data: affiliate } = useMyAffiliate();
    const { data: products, isLoading } = useProducts();

    // Filter products that have specific discounts or are trending
    const offers = products?.filter(p => p.discount || (p.affiliate_commission_value && p.affiliate_commission_value > 10)) || [];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{language === "bn" ? "বিশেষ অফারসমূহ" : "Special Offers"}</h2>
                    <p className="text-sm text-slate-500">{language === "bn" ? "অ্যাফিলিয়েটদের জন্য সেরা অফার ও ডিসকাউন্ট" : "High commission products and exclusive deals"}</p>
                </div>
                <Gift className="h-10 w-10 text-orange-500 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {offers.map((p) => (
                    <AffiliateProductCard
                        key={p.id}
                        product={p}
                        referralCode={affiliate?.referral_code || ""}
                        defaultCommissionRate={affiliate?.commission_rate || 10}
                    />
                ))}
            </div>

            {offers.length === 0 && (
                <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <Gift className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                    <p className="text-slate-400 font-medium">{language === "bn" ? "এই মুহূর্তে কোনো অফার নেই" : "No special offers available right now"}</p>
                </div>
            )}
        </div>
    );
};
