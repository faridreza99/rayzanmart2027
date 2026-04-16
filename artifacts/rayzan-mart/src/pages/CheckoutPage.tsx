import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, CreditCard, Truck, AlertCircle, Info, Tag, X, Phone, Gift, Mail, Lock, Eye, EyeOff, Star } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { useSiteSettings } from "@/hooks/useAdminSettings";
import { BD_DISTRICTS } from "@/lib/districts";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { getActiveReferralCode, useReferralTracking } from "@/hooks/useReferralTracking";

const normalizeDistrict = (value: string) => {
  const byEnglish = BD_DISTRICTS.find((d) => d.en === value);
  if (byEnglish) return byEnglish.en;
  const byBangla = BD_DISTRICTS.find((d) => d.bn === value);
  return byBangla?.en || value;
};

const CheckoutPage = () => {
  const { language, t } = useLanguage();
  const { items, getTotal, clearCart } = useCart();
  const { user, isAuthenticated, isLoading, signup } = useAuth();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  // Affiliate tracking
  const { activeRef } = useReferralTracking();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"inside" | "outside">("inside");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    address: "",
    district: "",
    transactionId: "",
    note: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [activeAffiliateRef, setActiveAffiliateRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const { data: settings } = useSiteSettings();

  const insideCityCharge = settings?.delivery_charges?.inside_city ?? 60;
  const outsideCityCharge = settings?.delivery_charges?.outside_city ?? 120;
  const deliveryCharge = deliveryType === "inside" ? insideCityCharge : outsideCityCharge;
  const subtotal = getTotal();
  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? Math.round(subtotal * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;
  const total = subtotal - couponDiscount;

  // Loyalty points logic — 1 point = 1 taka, max 50% of subtotal
  const loyaltyRules = settings?.loyalty_rules;
  const userPoints = user?.loyalty_points || 0;
  const loyaltyEnabled = loyaltyRules?.enabled !== false;

  // Max usable = 50% of user's earned points (1 point = 1 taka)
  const halfPoints = Math.floor(userPoints * 0.5);
  // Also can't exceed the order subtotal
  const actualMaxUsable = Math.min(halfPoints, Math.floor(total));

  const rawInput = parseInt(pointsInput) || 0;
  const pointsOverLimit = rawInput > actualMaxUsable && rawInput > 0;
  const usedPoints = pointsOverLimit ? 0 : Math.min(Math.max(0, rawInput), actualMaxUsable);
  const loyaltyDiscount = usedPoints; // 1 point = 1 taka

  const finalTotal = total + deliveryCharge - loyaltyDiscount;

  useEffect(() => {
    if (activeRef) {
      setActiveAffiliateRef(activeRef);
    }
  }, [activeRef]);

  useEffect(() => {
    if (!isLoading && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
      }));
    }
  }, [user, isLoading]);

  useEffect(() => {
    const savedDistrict = localStorage.getItem("preferred_delivery_district");
    if (savedDistrict) {
      const normalized = normalizeDistrict(savedDistrict);
      setFormData((prev) => ({ ...prev, district: normalized } as any));
      setDeliveryType(normalized === "Chattogram" ? "inside" : "outside");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.name.trim()) {
      toast.error(language === "bn" ? "নাম প্রদান করুন" : "Name is required");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(language === "bn" ? "ফোন নম্বর প্রয়োজন" : "Phone number is required");
      return;
    }
    if (!formData.address.trim()) {
      toast.error(language === "bn" ? "ঠিকানা প্রদান করুন" : "Address is required");
      return;
    }
    if (!formData.district.trim()) {
      toast.error(language === "bn" ? "জেলা নির্বাচন করুন" : "Please select a district");
      return;
    }
    if (!formData.transactionId.trim()) {
      toast.error(language === "bn" ? "বিকাশ ট্রানজেকশন আইডি প্রদান করুন" : "bKash Transaction ID is required");
      return;
    }

    setIsSubmitting(true);

    let currentUserId = user?.id || null;

    // Handle mandatory signup for guests
    if (!isAuthenticated) {
      if (!formData.password || formData.password.length < 6) {
        toast.error(language === "bn" ? "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters");
        setIsSubmitting(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error(language === "bn" ? "পাসওয়ার্ড মিলছে না" : "Passwords do not match");
        setIsSubmitting(false);
        return;
      }

      try {
        const signupResult = await signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: "user",
        });

        if (signupResult.success) {
          currentUserId = signupResult.user.id;
          toast.success(language === "bn" ? "অ্যাকাউন্ট তৈরি হয়েছে এবং আপনি লগ ইন করেছেন" : "Account created and you are logged in");
        } else {
          toast.error(signupResult.error || "Signup failed");
          setIsSubmitting(false);
          return;
        }
      } catch (err: any) {
        console.error("Signup error during checkout:", err);
        toast.error(err.message || "Signup failed");
        setIsSubmitting(false);
        return;
      }
    }

    let affiliateRef = getActiveReferralCode();
    let resolvedAffiliateId = null;

    if (affiliateRef) {
      try {
        const { data: affiliateData, error: affErr } = await apiClient
          .from("affiliates")
          .select("id, status")
          .ilike("referral_code", affiliateRef)
          .maybeSingle();

        if (affErr) {
          console.error("Affiliate lookup failed:", affErr);
        } else if (affiliateData) {
          const affStatus = (affiliateData as any).status;
          // Only attach affiliate_id if the affiliate is active or approved
          if (affStatus === "active" || affStatus === "approved") {
            resolvedAffiliateId = (affiliateData as any).id;
          }
        }
      } catch (err) {
        console.error("Affiliate resolution error:", err);
      }
    }

    try {
      const order = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || null,
        shipping_address: formData.address,
        city: formData.district || "Default",
        district: formData.district,
        subtotal: subtotal,
        delivery_charge: deliveryCharge,
        discount_amount: couponDiscount,
        total: finalTotal,
        status: "pending" as const,
        payment_method: paymentMethod,
        delivery_type: deliveryType === "inside" ? "inside_city" as const : "outside_city" as const,
        courier: "pathao",
        notes: formData.note || null,
        delivery_fee_transaction_id: formData.transactionId,
        affiliate_id: resolvedAffiliateId,
        affiliate_referral_code: affiliateRef,
        coupon_code: appliedCoupon?.code || null,
        points_redeemed: usedPoints,
        points_discount_amount: usedPoints,
        tracking_number: null,
        user_id: currentUserId, 
      };

      const orderItems = items.map((item) => {
        const price = item.variant?.price || item.product.price;
        return {
          product_id: item.product.id,
          variant_id: item.variant?.id || null,
          variant_attributes: item.variant ? item.variant.attributes : null,
          product_name_bn: item.product.name.bn + (item.variant ? ` (${Object.values(item.variant.attributes).join(" - ")})` : ""),
          product_name_en: item.product.name.en + (item.variant ? ` (${Object.values(item.variant.attributes).join(" - ")})` : ""),
          quantity: item.quantity,
          unit_price: price,
          total_price: price * item.quantity,
        };
      });

      await createOrder.mutateAsync({ order, items: orderItems });
      setOrderPlaced(true);
      clearCart();
    } catch (error: any) {
      console.error("Order submit failed:", error);
      toast.error(error.message || t("orderError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{language === "bn" ? "অপেক্ষা করুন..." : "Loading..."}</p>
        </div>
      </MainLayout>
    );
  }

  if (orderPlaced) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <div className="mx-auto max-w-xl rounded-2xl bg-card p-8 shadow-sm border">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-success/10 p-4">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-success">
              {language === "bn" ? "অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!" : "Order Received Successfully!"}
            </h1>
            <div className="bg-primary/5 rounded-lg p-6 mb-8 border border-primary/20">
              <p className="text-lg font-medium text-primary mb-2">
                {language === "bn" 
                  ? "আপনার অ্যাকাউন্ট তৈরি করা হয়েছে। আপনি আপনার ইমেল এবং পাসওয়ার্ড ব্যবহার করে যেকোনো সময় লগইন করতে পারেন।" 
                  : "Your account has been created. You can login anytime using your email and password."}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "bn"
                  ? "অর্ডার ট্র্যাকিং এবং লয়ালটি পয়েন্টের জন্য আপনার অ্যাকাউন্ট ব্যবহার করুন।"
                  : "Use your account for order tracking and loyalty points."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/" className="w-full sm:w-auto">
                <Button className="w-full">{t("continueShopping")}</Button>
              </Link>
              <Link to="/dashboard/orders" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">{t("trackOrder")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("checkout")}</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl bg-card p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Truck className="h-5 w-5 text-primary" />
                  {t("shippingAddress")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">{t("name")} *</Label>
                    <Input
                      id="name"
                      placeholder={language === "bn" ? "আপনার নাম লিখুন" : "Enter your name"}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t("phone")} *</Label>
                    <Input
                      id="phone"
                      placeholder="017XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">{language === "bn" ? "ইমেইল" : "Email"} *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  {!isAuthenticated && (
                    <>
                      <div className="sm:col-span-2 mt-4 pt-4 border-t border-dashed">
                        <h3 className="mb-4 text-md font-semibold flex items-center gap-2 text-primary">
                          <Lock className="h-4 w-4" />
                          {language === "bn" ? "অ্যাকাউন্ট সেটআপ (ট্র্যাকিং এর জন্য)" : "Account Setup (for tracking)"}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="relative">
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
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {language === "bn"
                            ? "* ভবিষ্যতে অর্ডার ট্র্যাক করতে এই পাসওয়ার্ডটি মনে রাখুন।"
                            : "* Remember this password to track your orders in the future."}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2 mt-4 border-t pt-4">
                    <Label htmlFor="address">{t("address")} *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="district">{t("district")} *</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => {
                        const normalized = normalizeDistrict(value);
                        setFormData({ ...formData, district: normalized });
                        localStorage.setItem("preferred_delivery_district", normalized);
                        const isChittagong = normalized === "Chattogram";
                        setDeliveryType(isChittagong ? "inside" : "outside");
                      }}
                    >
                      <SelectTrigger id="district">
                        <SelectValue placeholder={t("selectDistrict")} />
                      </SelectTrigger>
                      <SelectContent>
                        {BD_DISTRICTS.map((d) => (
                          <SelectItem key={d.en} value={d.en}>
                            {language === "bn" ? d.bn : d.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <Label htmlFor="transactionId" className="text-primary font-bold">
                      {language === "bn" ? "বিকাশ ট্রানজেকশন আইডি (ডেলিভারি চার্জের জন্য)" : "bKash Transaction ID (for Delivery Charge)"} *
                    </Label>
                    <Input
                      id="transactionId"
                      placeholder="8NX7XXXXXX"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      className="mt-1 border-primary/30"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-card p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {t("paymentMethod")}
                </h2>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cod" | "online")} className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <span className="font-medium">{t("cashOnDelivery")}</span>
                      <p className="text-sm text-muted-foreground">{t("payOnReceive")}</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div>
              <div className="sticky top-24 rounded-xl bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">{t("orderSummary")}</h2>
                <div className="space-y-3">
                  {items.map((item) => {
                    const price = item.variant?.price || item.product.price;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <img src={item.product.image} alt={item.product.name[language]} className="h-12 w-12 rounded object-cover" />
                        <div className="flex-1">
                          <p className="text-sm line-clamp-1">{item.product.name[language]}</p>
                          <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <span className="font-medium mt-1">{t("currency")}{(price * item.quantity).toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("subtotal")}</span>
                    <span>{t("currency")}{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("deliveryCharge")}</span>
                    <span>{t("currency")}{deliveryCharge}</span>
                  </div>
                  {usedPoints > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>{language === "bn" ? "পয়েন্ট ডিসকাউন্ট:" : "Points Discount:"}</span>
                      <span>-{t("currency")}{loyaltyDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>{t("cartTotal")}</span>
                    <span className="text-primary">{t("currency")}{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Loyalty Points Input — only for authenticated users with points */}
                {isAuthenticated && loyaltyEnabled && userPoints > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-4 space-y-3">
                      {/* Header row */}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-amber-800">
                          {language === "bn" ? "লয়ালটি পয়েন্ট ব্যবহার করুন" : "Use Loyalty Points"}
                        </span>
                      </div>

                      {/* Info rows */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded bg-white border p-2 text-center">
                          <p className="text-muted-foreground">
                            {language === "bn" ? "আপনার পয়েন্ট" : "Your Points"}
                          </p>
                          <p className="font-bold text-base text-amber-700">{userPoints.toLocaleString()}</p>
                        </div>
                        <div className="rounded bg-white border p-2 text-center">
                          <p className="text-muted-foreground">
                            {language === "bn" ? "সর্বোচ্চ ব্যবহারযোগ্য" : "Max Usable"}
                          </p>
                          <p className="font-bold text-base text-green-700">{actualMaxUsable.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {language === "bn" ? "(পয়েন্টের ৫০%)" : "(50% of points)"}
                          </p>
                        </div>
                      </div>

                      {/* Input field */}
                      <div className="space-y-1">
                        <Label htmlFor="points-input" className="text-xs font-medium text-amber-800">
                          {language === "bn"
                            ? `কত পয়েন্ট ব্যবহার করবেন? (১ পয়েন্ট = ১ টাকা)`
                            : `How many points to use? (1 point = ৳1)`}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="points-input"
                            type="number"
                            min={0}
                            value={pointsInput}
                            onChange={(e) => setPointsInput(e.target.value)}
                            placeholder="0"
                            className={`bg-white ${pointsOverLimit ? "border-red-500 focus:border-red-500 text-red-600" : "border-amber-300 focus:border-amber-500"}`}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
                            onClick={() => setPointsInput(String(actualMaxUsable))}
                          >
                            {language === "bn" ? "সর্বোচ্চ" : "Max"}
                          </Button>
                        </div>

                        {/* Error message when over limit */}
                        {pointsOverLimit && (
                          <div className="flex items-start gap-1.5 rounded bg-red-50 border border-red-200 p-2 mt-1">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-600">
                              {language === "bn"
                                ? `সর্বোচ্চ ${actualMaxUsable.toLocaleString()} পয়েন্ট ব্যবহার করা যাবে (আপনার মোট পয়েন্টের ৫০%)। অনুগ্রহ করে ${actualMaxUsable.toLocaleString()} বা তার কম লিখুন।`
                                : `You can use max ${actualMaxUsable.toLocaleString()} points (50% of your total). Please enter ${actualMaxUsable.toLocaleString()} or less.`}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Real-time savings preview */}
                      {usedPoints > 0 && !pointsOverLimit && (
                        <div className="rounded bg-green-50 border border-green-200 p-2 text-center">
                          <p className="text-xs text-green-700">
                            {language === "bn"
                              ? `✓ ${usedPoints.toLocaleString()} পয়েন্ট ব্যবহারে ৳${loyaltyDiscount.toLocaleString()} ছাড় পাবেন`
                              : `✓ Using ${usedPoints.toLocaleString()} points saves you ৳${loyaltyDiscount.toLocaleString()}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {language === "bn"
                              ? `বাকি পয়েন্ট: ${(userPoints - usedPoints).toLocaleString()}`
                              : `Remaining: ${(userPoints - usedPoints).toLocaleString()} pts`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button type="submit" className="mt-6 w-full btn-bounce py-6 text-lg font-bold" size="lg" disabled={isSubmitting || createOrder.isPending || pointsOverLimit}>
                  {isSubmitting || createOrder.isPending ? t("processing") : (language === "bn" ? "অর্ডার সম্পন্ন করুন" : "Finish My Order")}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CheckoutPage;
