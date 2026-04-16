import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gift, Save, Info, Star, Rocket, CreditCard, Wallet, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useAdminSettings";

export const LoyaltySettings = () => {
  const { language, t } = useLanguage();
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [earnRatio, setEarnRatio] = useState(100);
  const [redeemRatio, setRedeemRatio] = useState(2);
  const [minRedeemPoints, setMinRedeemPoints] = useState(50);
  const [maxRedeemPercentage, setMaxRedeemPercentage] = useState(50);
  const [pointsValidityDays, setPointsValidityDays] = useState(365);

  useEffect(() => {
    if (settings?.loyalty_rules) {
      setLoyaltyEnabled(settings.loyalty_rules.enabled ?? true);
      setEarnRatio(settings.loyalty_rules.earn_ratio ?? 100);
      setRedeemRatio(settings.loyalty_rules.redeem_ratio ?? 2);
      setMinRedeemPoints(settings.loyalty_rules.min_redeem_points ?? 50);
      setMaxRedeemPercentage(settings.loyalty_rules.max_redeem_percentage ?? 50);
      setPointsValidityDays(settings.loyalty_rules.points_validity_days ?? 365);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "loyalty_rules",
        value: {
          enabled: loyaltyEnabled,
          earn_ratio: earnRatio,
          redeem_ratio: redeemRatio,
          min_redeem_points: minRedeemPoints,
          max_redeem_percentage: maxRedeemPercentage,
          points_validity_days: pointsValidityDays,
        },
      });
      toast.success(t("settingsSaved"));
    } catch (error) {
      console.error("Failed to save loyalty settings:", error);
      toast.error(language === "bn" ? "সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে" : "Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {t("loyaltyProgram")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{t("loyaltyProgram")}</p>
              <p className="text-sm text-muted-foreground">
                {language === "bn"
                  ? "লয়্যালটি পয়েন্ট সিস্টেম সক্রিয়/নিষ্ক্রিয় করুন"
                  : "Enable/disable loyalty points system"}
              </p>
            </div>
            <Switch 
              checked={loyaltyEnabled} 
              onCheckedChange={setLoyaltyEnabled} 
              disabled={updateSetting.isPending}
            />
          </div>

          {/* Earning Settings */}
          <div className={`${!loyaltyEnabled ? "opacity-50 pointer-events-none" : ""}`}>
            <h3 className="mb-4 font-medium">
              {language === "bn" ? "পয়েন্ট অর্জন সেটিংস" : "Points Earning Settings"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {language === "bn" ? "প্রতি ১ পয়েন্টের জন্য খরচ (টাকায়)" : "Spend per 1 Point (in Taka)"}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    value={earnRatio}
                    onChange={(e) => setEarnRatio(Number(e.target.value))}
                  />
                  <span className="text-muted-foreground">= 1 Point</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "bn"
                    ? "প্রতি ১০০ টাকা খরচে ১ পয়েন্ট অর্জিত হবে"
                    : `Customer earns 1 point for every ৳${earnRatio} spent`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  {language === "bn" ? "পয়েন্টের মেয়াদ (দিন)" : "Points Validity (Days)"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={pointsValidityDays}
                    onChange={(e) => setPointsValidityDays(Number(e.target.value))}
                  />
                  <span className="text-muted-foreground">{language === "bn" ? "দিন" : "Days"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "bn"
                    ? "পয়েন্ট অর্জনের এই সময়ের মধ্যে ব্যবহার করতে হবে"
                    : "Points will expire after this many days"}
                </p>
              </div>
            </div>
          </div>

          {/* Redemption Settings */}
          <div className={`${!loyaltyEnabled ? "opacity-50 pointer-events-none" : ""}`}>
            <h3 className="mb-4 font-medium">
              {language === "bn" ? "পয়েন্ট রিডিম সেটিংস" : "Points Redemption Settings"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  {language === "bn" ? "পয়েন্টের মূল্য (১ পয়েন্ট = ? টাকা)" : "Point Value (1 Pt = ? Taka)"}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">1 Pt =</span>
                  <span className="text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={redeemRatio}
                    onChange={(e) => setRedeemRatio(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {language === "bn" ? "ন্যূনতম রিডিম পয়েন্ট" : "Minimum Redeem Points"}
                </Label>
                <Input
                  type="number"
                  value={minRedeemPoints}
                  onChange={(e) => setMinRedeemPoints(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {language === "bn" ? "সর্বোচ্চ রিডিম সীমা (%)" : "Max Redemption Limit (%)"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    max="100"
                    value={maxRedeemPercentage}
                    onChange={(e) => setMaxRedeemPercentage(Number(e.target.value))}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "bn"
                    ? "অর্ডারের সর্বোচ্চ কত শতাংশ পয়েন্ট দিয়ে পরিশোধ করা যাবে"
                    : "Max % of order value that can be paid with points"}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className={`rounded-lg bg-muted/50 p-4 ${!loyaltyEnabled ? "opacity-50" : ""}`}>
            <h4 className="mb-2 font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              {language === "bn" ? "সারসংক্ষেপ" : "Summary"}
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                • {language === "bn" ? "প্রতি" : "Every"} ৳{earnRatio}{" "}
                {language === "bn" ? "খরচে" : "spent"}: 1{" "}
                {language === "bn" ? "পয়েন্ট" : "point"}
              </li>
              <li>
                • 1 {language === "bn" ? "পয়েন্ট" : "point"} = ৳{redeemRatio}{" "}
                {language === "bn" ? "ছাড়" : "discount"}
              </li>
              <li>
                • {language === "bn" ? "ন্যূনতম রিডিম" : "Min redeem"}: {minRedeemPoints}{" "}
                {language === "bn" ? "পয়েন্ট" : "points"} (৳{minRedeemPoints * redeemRatio})
              </li>
              <li>
                • {language === "bn" ? "অর্ডারের সর্বোচ্চ" : "Max"} {maxRedeemPercentage}%{" "}
                {language === "bn" ? "পর্যন্ত পয়েন্ট ব্যবহার করা যাবে" : "can be paid with points"}
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateSetting.isPending}
            className="w-full sm:w-auto"
          >
            {updateSetting.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Information Alert */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground text-lg">
            <Wallet className="h-5 w-5" />
            {language === "bn" ? "পেমেন্ট গেটওয়ে এবং পেআউট" : "Payment & Payout Systems"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-warning/30 bg-warning/5">
            <Rocket className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning font-semibold">
              {language === "bn" ? "সিস্টেম ইন্টিগ্রেশন" : "System Integration"}
            </AlertTitle>
            <AlertDescription className="text-sm text-warning/80">
              {language === "bn" 
                ? "অনলাইন পেমেন্ট (SSL Commerz/bKash) এবং অ্যাফিলিয়েট পেআউট সিস্টেম প্রোডাকশন এনভায়রনমেন্টে নির্দিষ্ট API কী এবং গেটওয়ে রেজিস্ট্রেশন সম্পন্ন করার পর সক্রিয় করা হবে।"
                : "Online payment (SSL Commerz/bKash) and Affiliate Payout systems will be activated after completing specific API key and gateway registration in the production environment."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};