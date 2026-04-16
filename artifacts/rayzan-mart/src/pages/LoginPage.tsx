import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useAdminSettings";
import { toast } from "sonner";

const LoginPage = () => {
  const { t, language } = useLanguage();
  const { login, resendConfirmation, user } = useAuth() as any;
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const siteName =
    (language === "bn"
      ? settings?.site_name?.bn
      : settings?.site_name?.en) || "রায়জান মার্ট";
  const siteLogoUrl = settings?.site_logo?.url;

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "success") {
      setSuccessMsg(
        language === "bn"
          ? "ইমেইল সফলভাবে ভেরিফাই হয়েছে! এখন লগ ইন করুন।"
          : "Email verified successfully! You can now log in."
      );
    } else if (verified === "error") {
      setError("EMAIL_NOT_VERIFIED");
    }
  }, [searchParams, language]);

  // MFA deferred
  const [showMfaInput] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info(language === "bn" ? "2FA শীঘ্রই আসছে।" : "2FA coming soon.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login(email, password);
    if (result.success) {
      toast.success(t("loginSuccess"));
    } else {
      if (result.error === "EMAIL_NOT_VERIFIED" || result.error?.includes("Email not confirmed") || result.error?.includes("email_not_confirmed")) {
        setError("EMAIL_NOT_VERIFIED");
      } else if (result.error === "AFFILIATE_PENDING") {
        setError("AFFILIATE_PENDING");
      } else if (result.error === "AFFILIATE_REJECTED") {
        setError("AFFILIATE_REJECTED");
      } else if (result.error?.includes("invalid_credentials") || result.error?.includes("Invalid credentials")) {
        setError(t("invalidCredentials"));
      } else {
        setError(result.error || t("somethingWentWrong"));
      }
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error(language === "bn" ? "আপনার ইমেইল ঠিকানা দিন" : "Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const result = await resendConfirmation(email);
      if (result?.success) {
        toast.success(language === "bn" ? "ভেরিফিকেশন ইমেইল পাঠানো হয়েছে!" : "Verification email sent!");
        setError("");
      } else {
        toast.error(result?.error || t("somethingWentWrong"));
      }
    } catch (err: any) {
      toast.error(err.message || t("somethingWentWrong"));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.role) {
      if (user.roles?.includes("admin")) {
        navigate("/admin");
      } else if (user.roles?.includes("affiliate")) {
        navigate("/affiliate");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  return (
    <MainLayout>
      <div className="container flex min-h-[80vh] items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-card p-8 shadow-lg border border-border/50">

            {/* Logo */}
            <div className="mb-6 flex flex-col items-center gap-2">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={siteName} className="h-14 w-auto object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-2xl font-bold shadow">
                  {siteName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-lg font-bold tracking-tight text-foreground">{siteName}</span>
            </div>

            <h1 className="mb-1 text-center text-2xl font-bold">{t("login")}</h1>
            <p className="mb-5 text-center text-sm text-muted-foreground">
              {t("loginToAccount")}
            </p>

            {successMsg && (
              <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-400 font-medium">
                  {successMsg}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <div className="space-y-3 mb-4">
                <Alert
                  variant={error === "AFFILIATE_PENDING" ? "default" : "destructive"}
                  className={error === "AFFILIATE_PENDING" ? "border-amber-400 bg-amber-50" : "border-destructive bg-destructive/10"}
                >
                  <AlertCircle className={`h-4 w-4 ${error === "AFFILIATE_PENDING" ? "text-amber-600" : "text-destructive"}`} />
                  <AlertDescription className={`font-medium ${error === "AFFILIATE_PENDING" ? "text-amber-800" : "text-destructive"}`}>
                    {error === "EMAIL_NOT_VERIFIED"
                      ? (language === "bn"
                          ? "আপনার ইমেইল ভেরিফাই করা হয়নি। আপনার ইনবক্স (এবং Spam ফোল্ডার) চেক করুন।"
                          : "Your email is not verified. Please check your inbox (and Spam folder).")
                      : error === "AFFILIATE_PENDING"
                        ? (language === "bn"
                            ? "আপনার অ্যাফিলিয়েট আবেদন পর্যালোচনাধীন। অনুমোদনের পর ইমেইলে জানানো হবে।"
                            : "Your affiliate application is under review. You'll be notified by email once approved.")
                        : error === "AFFILIATE_REJECTED"
                          ? (language === "bn"
                              ? "আপনার অ্যাফিলিয়েট আবেদন প্রত্যাখ্যান করা হয়েছে। সাপোর্টে যোগাযোগ করুন।"
                              : "Your affiliate application has been rejected. Please contact support.")
                          : error}
                  </AlertDescription>
                </Alert>
                {error === "EMAIL_NOT_VERIFIED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                  >
                    {language === "bn" ? "ভেরিফিকেশন ইমেইল পুনরায় পাঠান" : "Resend verification email"}
                  </Button>
                )}
              </div>
            )}

            {showMfaInput ? (
              <form onSubmit={handleMfaVerify} className="space-y-4">
                <Alert className="mb-4 bg-slate-50 border-slate-200">
                  <Shield className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    {language === "bn"
                      ? "আপনার অ্যাকাউন্টে টু-ফ্যাক্টর অথেনটিকেশন চালু আছে।"
                      : "Two-Factor Authentication is enabled on your account."}
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="mfa">{language === "bn" ? "2FA কোড" : "2FA Code"}</Label>
                  <Input
                    id="mfa"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="font-mono tracking-widest text-lg mt-1"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || mfaCode.length !== 6}>
                  {loading ? t("loggingIn") : (language === "bn" ? "যাচাই করুন" : "Verify")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="mt-1"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                      {language === "bn" ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot Password?"}
                    </Link>
                  </div>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full btn-bounce h-10 text-base font-semibold" disabled={loading}>
                  {loading ? t("loggingIn") : t("login")}
                </Button>
              </form>
            )}

            {!showMfaInput && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {t("noAccount")}{" "}
                <Link to="/signup" className="font-semibold text-primary hover:underline">
                  {t("signup")}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
