import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/api-client";
import { toast } from "sonner";

export const ChangePassword = () => {
  const { language } = useLanguage();
  const { user, updatePassword } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.email) {
      toast.error(language === "bn" ? "ব্যবহারকারীর তথ্য পাওয়া যায়নি।" : "User information not found.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(language === "bn" ? "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(language === "bn" ? "নতুন পাসওয়ার্ড মেলে নি।" : "New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Validate current password by attempting to sign in
      const { error: signInError } = await auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error(language === "bn" ? "বর্তমান পাসওয়ার্ড ভুল।" : "Current password is incorrect.");
        setLoading(false);
        return;
      }

      // 2. Update to new password
      const result = await updatePassword(newPassword);

      if (result.success) {
        toast.success(language === "bn" ? "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" : "Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || (language === "bn" ? "কিছু ভুল হয়েছে" : "Something went wrong"));
      }
    } catch (err) {
      toast.error(language === "bn" ? "কিছু ভুল হয়েছে" : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm mt-8">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Lock className="h-5 w-5 text-primary" />
        {language === "bn" ? "পাসওয়ার্ড পরিবর্তন করুন" : "Change Password"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{language === "bn" ? "বর্তমান পাসওয়ার্ড" : "Current Password"}</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 text-slate-400 hover:text-slate-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">{language === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}</Label>
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{language === "bn" ? "পুনরায় নতুন পাসওয়ার্ড" : "Confirm New Password"}</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <Button type="submit" disabled={loading} className="mt-2">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {language === "bn" ? "পাসওয়ার্ড আপডেট করুন" : "Update Password"}
        </Button>
      </form>
    </div>
  );
};
