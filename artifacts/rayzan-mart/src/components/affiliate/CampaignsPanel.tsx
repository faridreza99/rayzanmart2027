import { useState } from "react";
import { Link as LinkIcon, Copy, TrendingUp, ShoppingBag, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateCampaign, useMyCampaigns } from "@/hooks/useAffiliate";
import { toast } from "sonner";

interface CampaignsPanelProps {
  affiliate: any;
}

export const CampaignsPanel = ({ affiliate }: CampaignsPanelProps) => {
  const { language, t } = useLanguage();
  const { data: campaigns, isLoading } = useMyCampaigns();
  const { mutate: createCampaign, isPending: creatingCampaign } = useCreateCampaign();

  const [productUrl, setProductUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const copyLink = (text?: string) => {
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
        }
      });
    } catch (error) {
      toast.error(t("invalidLink"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              {t("referralLink")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <code className="flex-1 text-sm bg-white border border-primary/20 px-3 py-2 rounded-lg break-all">
                {window.location.origin}/?ref={affiliate?.referral_code || ""}
              </code>
              <Button onClick={() => copyLink()} size="icon" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("shareLink")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("linkGenerator")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder={t("productLinkPlaceholder")}
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
              <Button onClick={handleGenerateLink} disabled={creatingCampaign}>
                {creatingCampaign ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("generateLink")}
              </Button>
            </div>

            {generatedLink && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-primary/20 shadow-sm">
                <p className="text-xs font-mono flex-1 break-all line-clamp-1">
                  {generatedLink}
                </p>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyLink(generatedLink)}>
                  <Copy className="h-4 w-4 text-primary" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {t("campaigns")}
            </span>
            <Badge variant="outline">{campaigns?.length || 0} Total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((camp) => (
                <div key={camp.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{language === "bn" ? camp.name_bn : camp.name_en}</p>
                    <p className="text-xs text-slate-500 font-medium break-all max-w-[400px]">{camp.url}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{camp.clicks} Clicks</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{camp.conversions} Conversions</span>
                      <span className="text-[11px] font-bold text-success uppercase tracking-wider">{t("currency")}{Number(camp.earnings || 0).toLocaleString()} {language === "bn" ? "আয়" : "Earnings"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={camp.status === "active" ? "default" : "secondary"}>
                      {t(camp.status as any)}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(camp.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-200" />
              <p className="text-slate-400 font-medium">{t("noCampaigns")}</p>
              <p className="text-xs text-slate-400 mt-1">{language === "bn" ? "একটি নতুন লিঙ্ক তৈরি করে শুরু করুন" : "Start by generating a new link above"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
