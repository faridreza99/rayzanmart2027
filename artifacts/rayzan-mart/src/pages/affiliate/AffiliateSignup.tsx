import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateAffiliate, useMyAffiliate } from "@/hooks/useAffiliate";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

const AffiliateSignup = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, refreshUser, hasRole } = useAuth();
  const navigate = useNavigate();
  const { data: existingAffiliate, isLoading: affiliateLoading, refetch } = useMyAffiliate();
  const createAffiliate = useCreateAffiliate();

  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [checkingApproval, setCheckingApproval] = useState(false);

  const handleCheckApproval = async () => {
    setCheckingApproval(true);
    try {
      await refreshUser();
      await refetch();
      if (hasRole("affiliate")) {
        toast.success("অভিনন্দন! আপনার Affiliate অনুমোদন হয়েছে। Dashboard-এ যাচ্ছেন...");
        navigate("/affiliate");
      } else {
        toast.info("আপনার আবেদনটি এখনো পর্যালোচনাধীন রয়েছে।", { duration: 4000 });
      }
    } catch {
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setCheckingApproval(false);
    }
  };

  // If already active affiliate → redirect to dashboard
  if (existingAffiliate?.status === "active") {
    navigate("/affiliate");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error(t("loginFirst"));
      navigate("/login");
      return;
    }

    try {
      await createAffiliate.mutateAsync({
        paymentMethod,
        paymentDetails,
      });
      toast.success(
        "আবেদন সফলভাবে জমা হয়েছে! Admin অনুমোদনের পর আপনাকে ইমেইলে জানানো হবে।",
        { duration: 6000 }
      );
      navigate("/dashboard");
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  // Show pending/rejected status if already applied
  if (existingAffiliate && existingAffiliate.status !== "active") {
    const isPending = existingAffiliate.status === "pending";
    const isRejected = existingAffiliate.status === "inactive" || existingAffiliate.status === "rejected";

    return (
      <MainLayout>
        <div className="container py-12">
          <div className="mx-auto max-w-md">
            <div className="rounded-xl bg-card p-8 shadow-lg text-center">
              {isPending && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                    <Clock className="h-8 w-8 text-warning" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold">আপনার আবেদন পর্যালোচনাধীন</h2>
                  <p className="mb-4 text-muted-foreground">
                    আপনার Affiliate আবেদন Admin-এর কাছে পাঠানো হয়েছে। অনুমোদনের পর আপনি ইমেইল পাবেন এবং Affiliate Dashboard-এ প্রবেশ করতে পারবেন।
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    আপনার Referral Code: <span className="font-mono font-semibold text-primary">{existingAffiliate.referral_code}</span>
                  </p>
                  <Button
                    variant="default"
                    onClick={handleCheckApproval}
                    disabled={checkingApproval}
                    className="w-full mb-2"
                  >
                    {checkingApproval ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> চেক করা হচ্ছে...</>
                    ) : (
                      <><RefreshCw className="mr-2 h-4 w-4" /> অনুমোদন চেক করুন</>
                    )}
                  </Button>
                </>
              )}
              {isRejected && (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold">আবেদন প্রত্যাখ্যান করা হয়েছে</h2>
                  <p className="mb-4 text-muted-foreground">
                    দুঃখিত, আপনার Affiliate আবেদনটি এই মুহূর্তে অনুমোদন করা সম্ভব হয়নি। আরো তথ্যের জন্য Admin-এর সাথে যোগাযোগ করুন।
                  </p>
                </>
              )}
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="mt-4">
                Dashboard-এ ফিরে যান
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl bg-card p-8 shadow-lg">
            <h1 className="mb-2 text-center text-2xl font-bold">{t("becomeAffiliate")}</h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {t("affiliateInfo")}
            </p>

            <Alert className="mb-6 border-warning bg-warning/10">
              <Info className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning-foreground">
                আবেদন জমা দেওয়ার পর Admin অনুমোদন করলে তবেই Affiliate Dashboard-এ প্রবেশ করা যাবে।
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t("name")}</Label>
                <Input value={user?.name || ""} disabled />
              </div>
              <div>
                <Label>{t("email")}</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div>
                <Label className="mb-2 block">{t("paymentInfo")}</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex gap-4">
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
                    <Label htmlFor="bank">Bank</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>
                  {paymentMethod === "bank"
                    ? t("bankAccount")
                    : t("mobileNumber")}
                </Label>
                <Input
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder={paymentMethod === "bank" ? "Bank Name - Account No" : "01XXXXXXXXX"}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={createAffiliate.isPending || affiliateLoading}>
                {createAffiliate.isPending ? t("processing") : "আবেদন জমা দিন"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AffiliateSignup;
