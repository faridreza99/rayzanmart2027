import { supabase } from "@/integrations/supabase/client";
import { type AuthUser } from "@/lib/api-client";

export type AppRole = "customer" | "affiliate" | "admin";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  is_blocked: boolean | null;
  loyalty_points?: number;
  date_of_birth?: string | null;
  occupation?: string | null;
  nid?: string | null;
  payment_method?: string | null;
  payment_number?: string | null;
}

export interface UserWithRoles {
  user: AuthUser;
  profile: UserProfile | null;
  roles: AppRole[];
}

export const getUserRoles = async (userId: string): Promise<AppRole[]> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user roles:", error);
    return ["customer"];
  }

  return data?.map((r) => r.role as AppRole) || ["customer"];
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as UserProfile | null;
};

export const getProfileByPhone = async (phone: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile by phone:", error);
    return null;
  }

  return data as UserProfile | null;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> => {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId);

  return !error;
};

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.includes("admin");
};

export const checkIsAffiliate = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("affiliates")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
};

export const generateReferralCode = (name: string): string => {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${randomNum}`.toUpperCase();
};

export const trackAffiliateClick = async (referralCode: string, referrerUrl?: string) => {
  if (!referralCode) return;
  const normalizedCode = referralCode.trim().toUpperCase();

  console.log("Tracking Affiliate Click:", normalizedCode);

  // 1. Store IMMEDIATELY in session and local storage for order attribution
  // This ensures that even if the RPC call below is slow or fails, the 
  // checkout page can still find the referral code.
  sessionStorage.setItem("affiliate_ref", normalizedCode);
  localStorage.setItem("affiliate_ref", normalizedCode);

  // Set a cookie as well for better persistence (lasts 30 days)
  const date = new Date();
  date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
  document.cookie = `affiliate_ref=${normalizedCode}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;

  // 2. Call the secure RPC function to record the click in the database
  try {
    await supabase.rpc('record_affiliate_click', {
      p_referral_code: normalizedCode,
      p_referrer_url: referrerUrl || window.location.href,
      p_user_agent: navigator.userAgent
    });
  } catch (err) {
    console.error("Error recording affiliate click in DB:", err);
    // We don't throw here because local tracking is already set up and we want the user session to continue
  }
};

export const calculateCommission = (
  orderTotal: number,
  commissionRate: number,
  tier: string
): { amount: number; type: string } => {
  // Tiered commission logic (demo)
  let rate = commissionRate;

  switch (tier) {
    case "platinum":
      rate = 12;
      break;
    case "gold":
      rate = 10;
      break;
    case "silver":
      rate = 7;
      break;
    default:
      rate = 5;
  }

  // Fixed bonus for orders over 5000
  const fixedBonus = orderTotal >= 5000 ? 100 : 0;
  const percentageAmount = (orderTotal * rate) / 100;

  return {
    amount: percentageAmount + fixedBonus,
    type: fixedBonus > 0 ? "tiered" : "percentage",
  };
};