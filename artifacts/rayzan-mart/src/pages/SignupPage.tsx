import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Turnstile } from '@marsidev/react-turnstile';

const turnstileSiteKey = import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY;

const SignupPage = () => {
  const { t, language } = useLanguage();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [traceStatus, setTraceStatus] = useState("");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (msg: string) => {
    console.log(`[DEBUG] ${msg}`);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testConnection = async () => {
    addDebugLog("Testing API connection...");
    try {
      const res = await fetch("/api/db/profiles?_limit=1");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addDebugLog("API connection: OK");
      toast.success("Connection test successful!");
    } catch (err: any) {
      addDebugLog(`Connection failed: ${err.message}`);
      toast.error("Connection failed. Check your internet.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDebugLog("Form submitted (v4.4-EdgeFunction)");

    if (formData.password !== formData.confirmPassword) {
      addDebugLog("Passwords do not match.");
      toast.error(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    addDebugLog("Initiating signup via Edge Function...");

    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: "affiliate",
      });

      if (result.success) {
        addDebugLog("Affiliate application submitted — pending approval.");
        toast.success(language === "bn"
          ? "আপনার অ্যাফিলিয়েট আবেদন জমা হয়েছে! অ্যাডমিন অনুমোদনের পর আপনাকে ইমেইলে জানানো হবে।"
          : "Your affiliate application has been submitted! You will receive an email once the admin approves your account.", { duration: 8000 });
        navigate("/login");
      } else {
        addDebugLog(`Signup failed: ${result.error}`);
        toast.error(result.error || "Signup failed. Please try again.");
      }
    } catch (err: any) {
      addDebugLog(`Context Exception: ${err.message}`);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-card p-8 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
                {language === 'bn' ? 'অ্যাফিলিয়েট সাইন আপ' : 'Affiliate Sign Up'}
              </h1>
            </div>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {language === 'bn' ? 'অ্যাফিলিয়েট অ্যাকাউন্ট তৈরি করুন' : 'Create your affiliate account'}
            </p>

            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                {language === 'bn'
                  ? "আবেদন জমা দেওয়ার পর অ্যাডমিন অনুমোদন করলে আপনাকে ইমেইলে জানানো হবে।"
                  : "After submitting, you will be notified by email once the admin approves your application."}
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("nameHelper")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">{t("email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">{t("phone")} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">{t("password")} *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t("confirmPassword")} *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              {turnstileSiteKey && (
                <div className="flex justify-center py-2">
                  <Turnstile 
                    siteKey={turnstileSiteKey} 
                    onSuccess={(token) => {
                      addDebugLog("Captcha verified.");
                      setTurnstileToken(token);
                    }}
                    options={{ theme: "light" }}
                  />
                </div>
              )}

              <Button type="submit" className="w-full btn-bounce" disabled={loading}>
                {loading ? t("signingUp") : t("signup")}
              </Button>

              {/* Debug Panel */}
              <div className="mt-8 p-4 border rounded-lg bg-slate-50 text-[11px] font-mono">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold uppercase">Debug Info</span>
                  <Button type="button" variant="outline" size="sm" onClick={testConnection}>Test Connection</Button>
                </div>
                <div className="space-y-1">
                  {debugLogs.length === 0 && <p className="text-muted-foreground italic">No logs yet...</p>}
                  {debugLogs.map((log, i) => (
                    <p key={i} className={log.includes('Failed') || log.includes('Error') ? 'text-destructive' : 'text-slate-600'}>
                      {log}
                    </p>
                  ))}
                </div>
                {loading && <p className="mt-2 animate-pulse text-primary font-bold">Awaiting response from server...</p>}
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {language === 'bn'
                ? "সাধারণ ক্রেতা অ্যাকাউন্ট চেকআউটের সময় স্বয়ংক্রিয়ভাবে তৈরি হয়।"
                : "Buyer accounts are created automatically at checkout."}
            </p>
            <p className="mt-3 text-center text-sm">
              {t("alreadyHaveAccount")}{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t("login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SignupPage;