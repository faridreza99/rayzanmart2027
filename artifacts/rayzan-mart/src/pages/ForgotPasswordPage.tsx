import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Turnstile } from '@marsidev/react-turnstile';

const turnstileSiteKey = import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY;

const ForgotPasswordPage = () => {
  const { language } = useLanguage();
  const { resetPasswordForEmail } = useAuth();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (turnstileSiteKey && !turnstileToken) {
      toast.error(language === "bn" ? "দয়া করে ক্যাপচা পূরণ করুন।" : "Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);
    const result = await resetPasswordForEmail(email);
    
    if (result.success) {
      setSubmitted(true);
      toast.success(
        language === "bn" 
          ? "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!" 
          : "Password reset link sent to your email!"
      );
    } else {
      toast.error(result.error || (language === "bn" ? "কিছু ভুল হয়েছে" : "Something went wrong"));
    }
    
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-card p-8 shadow-lg border border-slate-100">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "bn" ? "লগইন এ ফিরে যান" : "Back to login"}
            </Link>

            {!submitted ? (
              <>
                <div className="mb-8 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-slate-900">
                    {language === "bn" ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot Password?"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {language === "bn" 
                      ? "আপনার ইমেইল ঠিকানা দিন, আমরা আপনাকে একটি পাসওয়ার্ড রিসেট লিংক পাঠাবো।" 
                      : "Enter your email address and we'll send you a link to reset your password."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">{language === "bn" ? "ইমেইল এড্রেস" : "Email Address"}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="h-11"
                    />
                  </div>

                  {turnstileSiteKey && (
                    <div className="flex justify-center py-2">
                      <Turnstile 
                        siteKey={turnstileSiteKey} 
                        onSuccess={(token) => setTurnstileToken(token)}
                        options={{ theme: "light" }}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 text-base font-medium transition-all" disabled={loading || (!!turnstileSiteKey && !turnstileToken)}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {language === "bn" ? "রিসেট লিংক পাঠান" : "Send Reset Link"}
                      </span>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900">
                  {language === "bn" ? "আপনার ইমেইল চেক করুন" : "Check your email"}
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  {language === "bn" 
                    ? `আমরা ${email} এ একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। দয়া করে আপনার ইনবক্স চেক করুন।` 
                    : `We've sent a password reset link to ${email}. Please check your inbox.`}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full h-11"
                  onClick={() => setSubmitted(false)}
                >
                  {language === "bn" ? "আবার চেষ্টা করুন" : "Try another email"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ForgotPasswordPage;
