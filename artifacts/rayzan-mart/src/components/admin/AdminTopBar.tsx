import { useState, useRef } from "react";
import { Bell, Globe, User, LogOut, Settings, Loader2, Eye, EyeOff, Camera } from "lucide-react";
import { Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminRole, AdminLevel } from "@/contexts/AdminRoleContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getToken } from "@/lib/api-client";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const AdminTopBar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, refreshUser } = useAuth();
  const { adminLevel, setAdminLevel } = useAdminRole();

  const [profileOpen, setProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const adminLevelLabels: Record<AdminLevel, { bn: string; en: string }> = {
    super_admin: { bn: "সুপার অ্যাডমিন", en: "Super Admin" },
    operations_admin: { bn: "অপারেশন অ্যাডমিন", en: "Operations Admin" },
    marketing_admin: { bn: "মার্কেটিং অ্যাডমিন", en: "Marketing Admin" },
  };

  const openProfileDialog = () => {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setProfileOpen(true);
  };

  const apiFetch = async (method: string, path: string, body?: any) => {
    const token = getToken();
    const res = await fetch(`/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.message || "Request failed");
    return json;
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error(language === "bn" ? "নাম খালি রাখা যাবে না" : "Name cannot be empty");
      return;
    }
    const emailChanged = editEmail.trim().toLowerCase() !== user?.email?.toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim());
    if (editEmail.trim() && !emailValid) {
      toast.error(language === "bn" ? "সঠিক ইমেইল ঠিকানা দিন" : "Enter a valid email address");
      return;
    }
    setIsSavingProfile(true);
    try {
      await apiFetch("PUT", "/auth/update-profile", { name: editName.trim() });
      if (emailChanged && editEmail.trim()) {
        await apiFetch("PUT", "/auth/update-email", { email: editEmail.trim() });
      }
      await refreshUser();
      toast.success(language === "bn" ? "প্রোফাইল আপডেট হয়েছে" : "Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || (language === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Update failed"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw) {
      toast.error(language === "bn" ? "বর্তমান পাসওয়ার্ড দিন" : "Enter current password");
      return;
    }
    if (newPw.length < 6) {
      toast.error(language === "bn" ? "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" : "New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error(language === "bn" ? "পাসওয়ার্ড মিলছে না" : "Passwords do not match");
      return;
    }
    setIsSavingPw(true);
    try {
      await apiFetch("PUT", "/auth/change-password", { current_password: currentPw, new_password: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success(language === "bn" ? "পাসওয়ার্ড পরিবর্তন সফল হয়েছে" : "Password changed successfully");
    } catch (err: any) {
      toast.error(err.message || (language === "bn" ? "পাসওয়ার্ড পরিবর্তন ব্যর্থ" : "Password change failed"));
    } finally {
      setIsSavingPw(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error(language === "bn" ? "শুধুমাত্র ছবি আপলোড করুন" : "Only image files allowed");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const result = await uploadToCloudinary(file);
      await apiFetch("PUT", "/auth/update-profile", { avatar_url: result.secure_url || result.url });
      await refreshUser();
      toast.success(language === "bn" ? "ছবি আপলোড সফল" : "Avatar updated");
    } catch (err: any) {
      toast.error(err.message || (language === "bn" ? "আপলোড ব্যর্থ" : "Upload failed"));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = "";
    }
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-card px-4">
        {/* Left: Title */}
        <div>
          <h1 className="text-sm font-semibold">{t("executiveOverview")}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Admin Level Selector */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Select value={adminLevel} onValueChange={(v) => setAdminLevel(v as AdminLevel)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs border-dashed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">{adminLevelLabels.super_admin[language]}</SelectItem>
                    <SelectItem value="operations_admin">{adminLevelLabels.operations_admin[language]}</SelectItem>
                    <SelectItem value="marketing_admin">{adminLevelLabels.marketing_admin[language]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{t("adminLevel")} (Simulated)</p>
            </TooltipContent>
          </Tooltip>

          {/* Language Toggle */}
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "bn" ? "en" : "bn")} className="gap-1.5 text-xs">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "bn" ? "English" : "বাংলা"}</span>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Badge className="absolute -right-1 -top-1 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs pointer-events-none">
              3
            </Badge>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">{user?.name || t("admin")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user?.name || t("admin")}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openProfileDialog}>
                <Settings className="mr-2 h-4 w-4" />
                {language === "bn" ? "প্রোফাইল সম্পাদন" : "Edit Profile"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Admin Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {language === "bn" ? "অ্যাডমিন প্রোফাইল" : "Admin Profile"}
            </DialogTitle>
          </DialogHeader>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">
                {language === "bn" ? "প্রোফাইল" : "Profile"}
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1">
                {language === "bn" ? "পাসওয়ার্ড" : "Password"}
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={language === "bn" ? "আপনার নাম" : "Your name"}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "ইমেইল ঠিকানা" : "Email Address"}</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
                {editEmail && editEmail !== user?.email && (
                  <p className="text-xs text-amber-600">
                    {language === "bn"
                      ? "⚠️ ইমেইল পরিবর্তন করলে পরবর্তী লগইনে নতুন ইমেইল ব্যবহার করতে হবে"
                      : "⚠️ After changing email, use the new email for your next login"}
                  </p>
                )}
              </div>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full">
                {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "bn" ? "সংরক্ষণ করুন" : "Save Profile"}
              </Button>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "বর্তমান পাসওয়ার্ড" : "Current Password"}</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm New Password"}</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                />
                {confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-destructive">
                    {language === "bn" ? "পাসওয়ার্ড মিলছে না" : "Passwords do not match"}
                  </p>
                )}
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isSavingPw || (!!confirmPw && newPw !== confirmPw)}
                className="w-full"
              >
                {isSavingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "bn" ? "পাসওয়ার্ড পরিবর্তন করুন" : "Change Password"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
