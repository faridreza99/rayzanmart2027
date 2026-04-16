import { Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const TwoFactorSettings = () => {
  const { language } = useLanguage();

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Shield className="h-5 w-5 text-primary" />
          {language === "bn" ? "টু-ফ্যাক্টর অথেনটিকেশন (2FA)" : "Two-Factor Authentication (2FA)"}
        </h3>
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
          {language === "bn" ? "শীঘ্রই আসছে" : "Coming Soon"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {language === "bn"
          ? "টু-ফ্যাক্টর অথেনটিকেশন শীঘ্রই উপলব্ধ হবে। এই ফিচারটি আপনার অ্যাকাউন্টের নিরাপত্তা বৃদ্ধি করবে।"
          : "Two-factor authentication will be available soon. This feature will add an extra layer of security to your account."}
      </p>
    </div>
  );
};
