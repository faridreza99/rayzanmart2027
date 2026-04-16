import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPasswordPage = () => {
  const { language } = useLanguage();
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    // Listen for the recovery event or session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        if (mounted) setIsValidToken(true);
      }
    });

    const checkSession = async () => {
      // Small delay to allow Supabase to process hash fragments
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!mounted) return;

      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Check standard hash fragments in case it's a raw recovery URL
      // Use window.location.hash instead of location.hash to prevent reactivity loops
      const hashStr = window.location.hash;
      const isRecovery = hashStr.includes("type=recovery") || hashStr.includes("access_token=");

      if (session || isRecovery) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        toast.error(
          language === "bn" 
            ? "অবৈধ বা মেয়াদোত্তীর্ণ রিসেট লিংক!" 
            : "Invalid or expired reset link!"
        );
        setTimeout(() => mounted && navigate('/forgot-password'), 3000);
      }
    };

    void checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(language === "bn" ? "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error(language === "bn" ? "পাসওয়ার্ড মেলে নি।" : "Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    
    if (result.success) {
      setIsSuccess(true);
      toast.success(
        language === "bn" 
          ? "পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!" 
          : "Password updated successfully!"
      );
      
      // Auto redirect to dashboard after 3 seconds
      setTimeout(() => navigate('/dashboard'), 3000);
    } else {
      toast.error(result.error || (language === "bn" ? "কিছু ভুল হয়েছে" : "Something went wrong"));
    }
    
    setLoading(false);
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
                    ? "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। আপনাকে ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে..." 
                    : "Your password has been changed successfully. Redirecting you to the dashboard..."}
                </p>
                <Button 
                  className="w-full h-11"
                  onClick={() => navigate('/dashboard')}
                >
                  {language === "bn" ? "ড্যাশবোর্ডে যান" : "Go to Dashboard"}
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
                      ? "আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড ইনপুট দিন।" 
                      : "Enter a strong new password for your account."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password">{language === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{language === "bn" ? "পুনরায় পাসওয়ার্ড দিন" : "Confirm Password"}</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="h-11"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 text-base font-medium transition-all mt-4" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {language === "bn" ? "আপডেট হচ্ছে..." : "Updating..."}
                      </span>
                    ) : (language === "bn" ? "পাসওয়ার্ড সেভ করুন" : "Save Password")}
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
