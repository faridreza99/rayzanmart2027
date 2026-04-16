import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMyAffiliate, useCreateAffiliate } from "@/hooks/useAffiliate";
import { toast } from "sonner";

export const AffiliateApplicationSection = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: affiliate, isLoading } = useMyAffiliate();
  const createAffiliate = useCreateAffiliate();

  const [showForm, setShowForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [marketingPlan, setMarketingPlan] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedTerms) {
      toast.error(language === "bn" ? "শর্তাবলী মেনে নিন" : "Please agree to terms");
      return;
    }

    try {
      await createAffiliate.mutateAsync({
        paymentMethod,
        paymentDetails,
        phone,
        websiteUrl,
        marketingPlan,
      });
      toast.success(language === "bn" ? "অ্যাফিলিয়েট আবেদন জমা হয়েছে" : "Affiliate application submitted");
      setShowForm(false);
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const copyReferralLink = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${affiliate.referral_code}`);
    toast.success(t("copied"));
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  // Status: Not Applied
  if (!affiliate) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {language === "bn" ? "অ্যাফিলিয়েট হিসেবে যোগ দিন" : "Become an Affiliate"}
            </CardTitle>
          </div>
          <CardDescription>
            {language === "bn"
              ? "রেফার করে আয় করুন। প্রতিটি সফল বিক্রয়ে কমিশন পান।"
              : "Earn by referring. Get commission on every successful sale."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  <span>{language === "bn" ? "ইউনিক রেফারেল লিংক পান" : "Get a unique referral link"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  <span>{language === "bn" ? "প্রতিটি বিক্রয়ে কমিশন আয় করুন" : "Earn commission on every sale"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  <span>{language === "bn" ? "রিয়েল-টাইম পারফরম্যান্স ট্র্যাকিং" : "Real-time performance tracking"}</span>
                </div>
              </div>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                {language === "bn" ? "এখনই আবেদন করুন" : "Apply Now"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert className="border-info bg-info/10">
                <Info className="h-4 w-4 text-info" />
                <AlertDescription className="text-sm text-info">
                  {language === "bn"
                    ? "আপনার আবেদন পর্যালোচনা করা হবে এবং অনুমোদনের পর আপনি অ্যাফিলিয়েট সুবিধা পাবেন।"
                    : "Your application will be reviewed and you'll get affiliate privileges upon approval."}
                </AlertDescription>
              </Alert>

              <div>
                <Label>{t("name")}</Label>
                <Input value={user?.name || ""} disabled className="bg-muted" />
              </div>

              <div>
                <Label>{t("email")}</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>

              <div>
                <Label>{t("phone")}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>

              <div>
                <Label className="mb-2 block">
                  {language === "bn" ? "পছন্দের পেমেন্ট পদ্ধতি" : "Preferred Payment Method"}
                </Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bkash" id="bkash" />
                    <Label htmlFor="bkash">bKash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nagad" id="nagad" />
                    <Label htmlFor="nagad">Nagad</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank">{language === "bn" ? "ব্যাংক" : "Bank"}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>
                  {paymentMethod === "bank"
                    ? (language === "bn" ? "ব্যাংক অ্যাকাউন্ট বিবরণ" : "Bank Account Details")
                    : t("mobileNumber")}
                </Label>
                <Input
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder={
                    paymentMethod === "bank"
                      ? "Bank Name - Account No - Branch"
                      : "01XXXXXXXXX"
                  }
                  required
                />
              </div>

              <div>
                <Label>
                  {language === "bn" ? "সোশ্যাল মিডিয়া / ওয়েবসাইট লিংক" : "Social Media / Website Link"}
                </Label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://facebook.com/your-profile"
                  required
                />
              </div>

              <div>
                <Label>
                  {language === "bn" ? "আপনার প্রচার পরিকল্পনা" : "Your Promotion Plan"}
                </Label>
                <Input
                  className="min-h-[80px]"
                  value={marketingPlan}
                  onChange={(e) => setMarketingPlan(e.target.value)}
                  placeholder={language === "bn" ? "আপনি কিভাবে আমাদের পণ্য প্রচার করবেন?" : "How do you plan to promote our products?"}
                  required
                />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedTerms}
                  onCheckedChange={(checked) => setAgreedTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  {language === "bn"
                    ? "আমি অ্যাফিলিয়েট প্রোগ্রামের শর্তাবলী মেনে নিচ্ছি এবং সততার সাথে প্রচার করতে সম্মত।"
                    : "I agree to the affiliate program terms and conditions and commit to ethical promotion."}
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createAffiliate.isPending || !agreedTerms}
                >
                  {createAffiliate.isPending
                    ? t("processing")
                    : (language === "bn" ? "আবেদন জমা দিন" : "Submit Application")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  // Status: Pending
  if (affiliate.status === "pending") {
    return (
      <Card className="border-warning/30 bg-warning/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <CardTitle className="text-lg">
                {language === "bn" ? "অ্যাফিলিয়েট আবেদনের স্ট্যাটাস" : "Affiliate Application Status"}
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-warning text-warning">
              {language === "bn" ? "অনুমোদনের অপেক্ষায়" : "Pending Approval"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-warning/30 bg-warning/10">
            <Clock className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              {language === "bn"
                ? "আপনার অ্যাফিলিয়েট আবেদন পর্যালোচনাধীন। অনুমোদন হলে আপনাকে জানানো হবে।"
                : "Your affiliate application is under review. You'll be notified once approved."}
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>{language === "bn" ? "আবেদনের তারিখ" : "Application Date"}:</strong>{" "}
              {new Date(affiliate.created_at).toLocaleDateString(
                language === "bn" ? "bn-BD" : "en-US"
              )}
            </p>
            <p>
              <strong>{t("paymentMethod")}:</strong>{" "}
              {affiliate.payment_method.toUpperCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Status: Active (Approved)
  if (affiliate.status === "active") {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <CardTitle className="text-lg">
                {language === "bn" ? "অ্যাফিলিয়েট অনুমোদিত" : "Affiliate Approved"}
              </CardTitle>
            </div>
            <Badge className="bg-success text-success-foreground">
              {t("active")}
            </Badge>
          </div>
          <CardDescription>
            {language === "bn"
              ? "আপনি এখন একজন অনুমোদিত অ্যাফিলিয়েট। আপনার রেফারেল লিংক শেয়ার করে আয় করুন।"
              : "You are now an approved affiliate. Share your referral link to start earning."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Link */}
          <div className="rounded-lg bg-muted p-3">
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {language === "bn" ? "আপনার রেফারেল লিংক" : "Your Referral Link"}
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-background px-2 py-1 text-sm">
                {window.location.origin}/?ref={affiliate.referral_code}
              </code>
              <Button size="sm" variant="outline" onClick={copyReferralLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-2xl font-bold text-primary">{affiliate.total_clicks || 0}</p>
              <p className="text-xs text-muted-foreground">{language === "bn" ? "ক্লিক" : "Clicks"}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-2xl font-bold text-success">
                ৳{Number(affiliate.total_commission || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট আয়" : "Total Earnings"}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-2xl font-bold">{affiliate.commission_rate}%</p>
              <p className="text-xs text-muted-foreground">{t("commissionRate")}</p>
            </div>
          </div>

          <Button onClick={() => navigate("/affiliate")} className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            {language === "bn" ? "অ্যাফিলিয়েট ড্যাশবোর্ডে যান" : "Go to Affiliate Dashboard"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Status: Inactive (Suspended)
  if (affiliate.status === "inactive") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">
                {language === "bn" ? "অ্যাফিলিয়েট স্থগিত" : "Affiliate Suspended"}
              </CardTitle>
            </div>
            <Badge variant="destructive">{language === "bn" ? "স্থগিত" : "Suspended"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "bn"
                ? "আপনার অ্যাফিলিয়েট অ্যাকাউন্ট স্থগিত করা হয়েছে। রেফারেল সুবিধা সাময়িকভাবে বন্ধ।"
                : "Your affiliate account has been suspended. Referral benefits are temporarily disabled."}
            </AlertDescription>
          </Alert>
          <p className="mt-4 text-sm text-muted-foreground">
            {language === "bn"
              ? "সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।"
              : "Contact us for assistance."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};