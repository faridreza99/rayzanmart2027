import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, User, Heart, Loader2, Info, ShoppingBag, Gift, Star, History, UserPlus, Camera, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { updateUserProfile } from "@/lib/supabase-helpers";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef } from "react";
import { uploadToCloudinary, getOptimizedUrl } from "@/lib/cloudinary";
import { useWishlist } from "@/hooks/useWishlist";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/ProductCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AffiliateApplicationSection } from "@/components/customer/AffiliateApplicationSection";
import { OrderDetailDialog } from "@/components/customer/OrderDetailDialog";
import { Order } from "@/hooks/useOrders";

import { useLoyaltyTransactions } from "@/hooks/useLoyalty";
import { useSiteSettings } from "@/hooks/useAdminSettings";
import { ChangePassword } from "@/components/customer/ChangePassword";
import { TwoFactorSettings } from "@/components/customer/TwoFactorSettings";

const CustomerDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const { data: orders, isLoading: ordersLoading } = useMyOrders();
  const { data: wishlist, isLoading: wishlistLoading } = useWishlist();
  const { data: loyaltyHistory, isLoading: loyaltyLoading } = useLoyaltyTransactions();
  const { data: settings } = useSiteSettings();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editNid, setEditNid] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentNumber, setEditPaymentNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { refreshUser } = useAuth();

  const isAffiliate = user?.roles?.includes("affiliate");

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
      setEditAddress(user.address || "");
      setEditDob(user.date_of_birth || "");
      setEditOccupation(user.occupation || "");
      setEditNid(user.nid || "");
      setEditPaymentMethod(user.payment_method || "");
      setEditPaymentNumber(user.payment_number || "");
    }
  }, [user, isEditing]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (isAffiliate && (!editPaymentMethod || !editPaymentNumber)) {
      toast.error(language === "bn"
        ? "অ্যাফিলিয়েটদের জন্য পেমেন্ট তথ্য আবশ্যক"
        : "Payment information is required for affiliates");
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateUserProfile(user.id, {
        name: editName,
        phone: editPhone,
        address: editAddress || null,
        date_of_birth: editDob || null,
        occupation: editOccupation || null,
        nid: editNid || null,
        payment_method: editPaymentMethod || null,
        payment_number: editPaymentNumber || null,
      });

      if (success) {
        await refreshUser();
        setIsEditing(false);
        toast.success(language === "bn" ? "প্রোফাইল আপডেট হয়েছে" : "Profile updated successfully");
      } else {
        toast.error(t("updateError"));
      }
    } catch (error) {
      toast.error(t("updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error(language === "bn" ? "শুধুমাত্র ছবি আপলোড করুন" : "Please upload images only");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      const success = await updateUserProfile(user.id, {
        avatar_url: result.secure_url
      });

      if (success) {
        await refreshUser();
        toast.success(t("uploadSuccess"));
      } else {
        toast.error(t("updateError"));
      }
    } catch (error) {
      toast.error(t("updateError"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning",
    processing: "bg-info",
    shipped: "bg-primary",
    delivered: "bg-success",
    returned: "bg-muted",
    cancelled: "bg-destructive",
  };

  const navItems = [
    { path: "/dashboard", icon: Package, label: t("orders") },
    { path: "/dashboard/wishlist", icon: Heart, label: t("wishlist") },
    { path: "/dashboard/loyalty", icon: Gift, label: t("loyaltyPoints") },
    { path: "/dashboard/affiliate", icon: UserPlus, label: language === "bn" ? "অ্যাফিলিয়েট" : "Affiliate" },
    { path: "/dashboard/profile", icon: User, label: t("profile") },
  ];

  const isOrdersTab = location.pathname === "/dashboard" || location.pathname === "/dashboard/orders";
  const isWishlistTab = location.pathname === "/dashboard/wishlist";
  const isLoyaltyTab = location.pathname === "/dashboard/loyalty";
  const isAffiliateTab = location.pathname === "/dashboard/affiliate";
  const isProfileTab = location.pathname === "/dashboard/profile";

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("dashboard")}</h1>

        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <div className="mb-4 text-center">
                <div className="relative mx-auto mb-2 group w-20 h-20">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 overflow-hidden border-2 border-primary/20">
                    {user?.avatar ? (
                      <img
                        src={getOptimizedUrl(user.avatar, 160, 160)}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-primary" />
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 cursor-pointer"
                    title={t("changePhoto")}
                  >
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="rounded-xl bg-card p-6 shadow-sm">
              {isOrdersTab && (
                <>
                  <h2 className="mb-4 text-lg font-semibold">{t("orders")}</h2>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between border-b pb-4"
                        >
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.order_items?.length || 0} {t("items")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {t("currency")}
                              {Number(order.total).toLocaleString()}
                            </p>
                            <Badge className={statusColors[order.status]}>
                              {t(order.status as any)}
                            </Badge>
                            <Button
                              variant="link"
                              size="sm"
                              className="block h-auto p-0 text-xs text-primary hover:underline mt-1"
                              onClick={() => {
                                setSelectedOrder(order);
                                setOrderDialogOpen(true);
                              }}
                            >
                              {language === "bn" ? "বিস্তারিত দেখুন" : "View Details"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                      <p className="font-medium text-muted-foreground">{t("noOrders")}</p>
                      <p className="mt-1 text-sm text-muted-foreground/70">{t("emptyStateOrderHelper")}</p>
                      <Link to="/products">
                        <Button variant="outline" className="mt-4">{t("shopNow")}</Button>
                      </Link>
                    </div>
                  )}
                </>
              )}

              {isWishlistTab && (
                <>
                  <h2 className="mb-4 text-lg font-semibold">{t("wishlist")}</h2>
                  {wishlistLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : wishlist && wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {wishlist.map((item) => (
                        <ProductCard key={item.id} product={item.product} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Heart className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                      <p className="font-medium text-muted-foreground">{t("noWishlist")}</p>
                      <p className="mt-1 text-sm text-muted-foreground/70">{t("emptyStateWishlistHelper")}</p>
                      <Link to="/products">
                        <Button variant="outline" className="mt-4">{t("shopNow")}</Button>
                      </Link>
                    </div>
                  )}
                </>
              )}

              {isLoyaltyTab && (
                <>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Gift className="h-5 w-5 text-primary" />
                    {t("loyaltyPoints")}
                  </h2>

                  {/* Points Overview */}
                  <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center">
                      <Star className="mx-auto mb-2 h-8 w-8 fill-primary text-primary" />
                      <div className="text-3xl font-bold text-primary">{user?.loyalty_points || 0}</div>
                      <p className="text-sm text-muted-foreground">{t("pointsBalance")}</p>
                    </div>
                    <div className="rounded-xl bg-success/5 p-4 text-center">
                      <div className="text-2xl font-bold text-success">
                        +{loyaltyHistory?.filter(t => t.type === 'earn' || t.type === 'refund').reduce((sum, t) => sum + t.points, 0) || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">{t("earnedPoints")}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-4 text-center">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {Math.abs(loyaltyHistory?.filter(t => t.type === 'redeem').reduce((sum, t) => sum + t.points, 0) || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">{t("redeemedPoints")}</p>
                    </div>
                  </div>

                  {/* Redeem Progress */}
                  {settings?.loyalty_rules && (
                    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{t("redeemPoints")}</span>
                        <span className="text-sm text-muted-foreground">
                          {user?.loyalty_points || 0} / {settings.loyalty_rules.min_redeem_points} {t("loyaltyPoints")}
                        </span>
                      </div>
                      <Progress 
                        value={((user?.loyalty_points || 0) / settings.loyalty_rules.min_redeem_points) * 100} 
                        className="h-2" 
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {(user?.loyalty_points || 0) >= settings.loyalty_rules.min_redeem_points ? (
                          language === "bn" 
                            ? "আপনি এখন পয়েন্ট ব্যবহার করতে পারবেন!" 
                            : "You have enough points to redeem!"
                        ) : (
                          language === "bn"
                            ? `আরো ${settings.loyalty_rules.min_redeem_points - (user?.loyalty_points || 0)} পয়েন্ট অর্জন করলে ছাড় পাবেন`
                            : `Earn ${settings.loyalty_rules.min_redeem_points - (user?.loyalty_points || 0)} more points to get a discount`
                        )}
                      </p>
                    </div>
                  )}

                  {/* Points History */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-medium">
                      <History className="h-4 w-4" />
                      {t("pointsHistory")}
                    </h3>
                    <div className="space-y-2">
                      {loyaltyLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : loyaltyHistory && loyaltyHistory.length > 0 ? (
                        loyaltyHistory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border bg-card p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`font-bold ${
                                item.type === "earn" ? "text-success" : 
                                item.type === "refund" ? "text-success" :
                                "text-muted-foreground"
                              }`}
                            >
                              {item.points > 0 ? "+" : ""}{item.points}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground italic">
                          {language === "bn" ? "কোনো ইতিহাস পাওয়া যায়নি" : "No history found"}
                        </p>
                      )}
                    </div>
                  </div>

                </>
              )}

              {isAffiliateTab && (
                <>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <UserPlus className="h-5 w-5 text-primary" />
                    {t("affiliateProgram")}
                  </h2>
                  <AffiliateApplicationSection />
                </>
              )}

              {isProfileTab && (
                <div className="space-y-6">
                  {/* ─── Header ─── */}
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <User className="h-5 w-5 text-primary" />
                      {language === "bn" ? "প্রোফাইল" : "Profile"}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={isSaving}
                    >
                      {isEditing
                        ? (language === "bn" ? "বাতিল" : "Cancel")
                        : (language === "bn" ? "প্রোফাইল সম্পাদন" : "Edit Profile")}
                    </Button>
                  </div>

                  {/* ─── Personal Information ─── */}
                  <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <User className="h-4 w-4" />
                      {language === "bn" ? "ব্যক্তিগত তথ্য" : "Personal Information"}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{language === "bn" ? "পূর্ণ নাম" : "Full Name"}</Label>
                        {isEditing ? (
                          <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder={language === "bn" ? "আপনার নাম" : "Your name"} />
                        ) : (
                          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">{user?.name || <span className="text-muted-foreground italic">-</span>}</div>
                        )}
                      </div>
                      {/* Email (read-only) */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{language === "bn" ? "ইমেইল" : "Email"}</Label>
                        <div className="rounded-lg border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed">{user?.email || "-"}</div>
                      </div>
                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{language === "bn" ? "ফোন নম্বর" : "Phone"}</Label>
                        {isEditing ? (
                          <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                        ) : (
                          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">{user?.phone || <span className="text-muted-foreground italic">-</span>}</div>
                        )}
                      </div>
                      {/* Date of Birth */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{language === "bn" ? "জন্ম তারিখ" : "Date of Birth"}</Label>
                        {isEditing ? (
                          <Input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} />
                        ) : (
                          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
                            {user?.date_of_birth
                              ? new Date(user.date_of_birth).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB")
                              : <span className="text-muted-foreground italic">-</span>}
                          </div>
                        )}
                      </div>
                      {/* Occupation */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{language === "bn" ? "পেশা" : "Occupation"}</Label>
                        {isEditing ? (
                          <Input value={editOccupation} onChange={e => setEditOccupation(e.target.value)} placeholder={language === "bn" ? "আপনার পেশা" : "Your occupation"} />
                        ) : (
                          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">{user?.occupation || <span className="text-muted-foreground italic">-</span>}</div>
                        )}
                      </div>
                      {/* NID */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "bn" ? "জাতীয় পরিচয়পত্র (NID)" : "National ID (NID)"}
                        </Label>
                        {isEditing ? (
                          <Input value={editNid} onChange={e => setEditNid(e.target.value)} placeholder={language === "bn" ? "NID নম্বর" : "NID number"} />
                        ) : (
                          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">{user?.nid || <span className="text-muted-foreground italic">-</span>}</div>
                        )}
                      </div>
                      {/* Membership (read-only) */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{language === "bn" ? "সদস্যপদ" : "Membership"}</Label>
                        <div className="rounded-lg border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                          {user?.roles?.includes("affiliate")
                            ? (language === "bn" ? "অ্যাফিলিয়েট সদস্য" : "Affiliate Member")
                            : (language === "bn" ? "নিয়মিত সদস্য" : "Regular Member")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─── Address ─── */}
                  <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <MapPin className="h-4 w-4" />
                      {language === "bn" ? "ঠিকানা" : "Address"}
                    </h3>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{language === "bn" ? "পূর্ণ ঠিকানা" : "Full Address"}</Label>
                      {isEditing ? (
                        <textarea
                          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          value={editAddress}
                          onChange={e => setEditAddress(e.target.value)}
                          placeholder={language === "bn" ? "বাড়ি নম্বর, রাস্তা, এলাকা, জেলা..." : "House no, road, area, district..."}
                        />
                      ) : (
                        <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm min-h-[60px]">
                          {user?.address || <span className="text-muted-foreground italic">{language === "bn" ? "কোনো ঠিকানা যোগ করা হয়নি" : "No address added yet"}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ─── Payment Information ─── */}
                  <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <CreditCard className="h-4 w-4" />
                      {language === "bn" ? "পেমেন্ট তথ্য" : "Payment Information"}
                      {isAffiliate && (
                        <span className="ml-1 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 uppercase">
                          {language === "bn" ? "বাধ্যতামূলক" : "Required"}
                        </span>
                      )}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Payment Method */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          {language === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                          {isAffiliate && <span className="ml-1 text-destructive">*</span>}
                        </Label>
                        {isEditing ? (
                          <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue placeholder={language === "bn" ? "পদ্ধতি বেছে নিন" : "Select method"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bkash">bKash</SelectItem>
                              <SelectItem value="nagad">Nagad</SelectItem>
                              <SelectItem value="bank">{language === "bn" ? "ব্যাংক ট্রান্সফার" : "Bank Transfer"}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm capitalize">
                            {user?.payment_method
                              ? user.payment_method === "bank"
                                ? (language === "bn" ? "ব্যাংক ট্রান্সফার" : "Bank Transfer")
                                : user.payment_method
                              : <span className="text-muted-foreground italic">-</span>}
                          </div>
                        )}
                      </div>
                      {/* Payment Number */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          {language === "bn" ? "একাউন্ট নম্বর" : "Account Number"}
                          {isAffiliate && <span className="ml-1 text-destructive">*</span>}
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editPaymentNumber}
                            onChange={e => setEditPaymentNumber(e.target.value)}
                            placeholder={language === "bn" ? "01XXXXXXXXX বা একাউন্ট নম্বর" : "01XXXXXXXXX or account number"}
                          />
                        ) : (
                          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">{user?.payment_number || <span className="text-muted-foreground italic">-</span>}</div>
                        )}
                      </div>
                    </div>
                    {isAffiliate && !isEditing && (!user?.payment_method || !user?.payment_number) && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <Info className="h-4 w-4 text-orange-500" />
                        <AlertDescription className="text-orange-700 text-sm">
                          {language === "bn"
                            ? "উইথড্রয়াল অনুরোধ করতে পেমেন্ট তথ্য যোগ করুন।"
                            : "Please add your payment info to submit withdrawal requests."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* ─── Save Button ─── */}
                  {isEditing && (
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        {language === "bn" ? "বাতিল" : "Cancel"}
                      </Button>
                      <Button onClick={handleUpdateProfile} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {language === "bn" ? "সংরক্ষণ করুন" : "Save Changes"}
                      </Button>
                    </div>
                  )}

                  {/* ─── Change Password ─── */}
                  <ChangePassword />

                  {/* ─── 2FA ─── */}
                  <TwoFactorSettings />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrderDetailDialog
        order={selectedOrder}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
      />
    </MainLayout>
  );
};

export default CustomerDashboard;