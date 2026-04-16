import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
    } else {
      setIsValidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error(language === "bn" ? "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।" : "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error(language === "bn" ? "পাসওয়ার্ড মেলে নি।" : "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success(language === "bn" ? "পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!" : "Password updated successfully!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        setIsValidToken(false);
        toast.error(language === "bn" ? "রিসেট লিংকটি মেয়াদ শেষ বা অবৈধ। নতুন লিংকের জন্য আবেদন করুন।" : "Reset link has expired or is invalid. Please request a new one.");
      } else {
        toast.error(msg || (language === "bn" ? "কিছু ভুল হয়েছে" : "Something went wrong"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <MainLayout>
        <div className="container flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
            <p className="text-muted-foreground">
              {language === "bn" ? "লিংক যাচাই করা হচ্ছে..." : "Verifying link..."}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isValidToken) {
    return (
      <MainLayout>
        <div className="container flex min-h-[70vh] items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="rounded-xl bg-card p-8 shadow-lg border border-slate-100 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-slate-900">
                {language === "bn" ? "অবৈধ বা মেয়াদোত্তীর্ণ লিংক" : "Invalid or Expired Link"}
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                {language === "bn"
                  ? "এই রিসেট লিংকটি কাজ করছে না। অনুগ্রহ করে নতুন রিসেট লিংকের জন্য আবেদন করুন।"
                  : "This reset link is no longer valid. Please request a new password reset link."}
              </p>
              <Link to="/forgot-password">
                <Button className="w-full h-11">
                  {language === "bn" ? "নতুন লিংক অনুরোধ করুন" : "Request New Link"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-card p-8 shadow-lg border border-slate-100">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900">
                  {language === "bn" ? "পাসওয়ার্ড রিসেট সফল!" : "Password Reset Successful!"}
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  {language === "bn"
                    ? "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। কয়েক সেকেন্ডের মধ্যে লগইন পেজে নিয়ে যাওয়া হবে..."
                    : "Your password has been changed successfully. Redirecting to login page..."}
                </p>
                <Button className="w-full h-11" onClick={() => navigate("/login")}>
                  {language === "bn" ? "লগইন পেজে যান" : "Go to Login"}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-slate-900">
                    {language === "bn" ? "নতুন পাসওয়ার্ড সেট করুন" : "Set New Password"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {language === "bn"
                      ? "আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড ইনপুট দিন।"
                      : "Enter a strong new password for your account."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password">{language === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11 text-slate-400 hover:text-slate-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "bn" ? "কমপক্ষে ৮ অক্ষর প্রয়োজন" : "Minimum 8 characters required"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{language === "bn" ? "পুনরায় পাসওয়ার্ড দিন" : "Confirm Password"}</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">
                        {language === "bn" ? "পাসওয়ার্ড মিলছে না" : "Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium transition-all mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {language === "bn" ? "আপডেট হচ্ছে..." : "Updating..."}
                      </span>
                    ) : (
                      language === "bn" ? "পাসওয়ার্ড সেভ করুন" : "Save Password"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPasswordPage;
