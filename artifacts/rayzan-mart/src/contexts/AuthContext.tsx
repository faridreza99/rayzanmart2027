import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useLanguage } from "./LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { type AuthUser } from "@/lib/api-client";
import { getUserRoles, getUserProfile, type AppRole } from "@/lib/supabase-helpers";

export type UserRole = AppRole;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roles: UserRole[];
  avatar?: string;
  is_blocked?: boolean;
  loyalty_points?: number;
  address?: string | null;
  date_of_birth?: string | null;
  occupation?: string | null;
  nid?: string | null;
  payment_method?: string | null;
  payment_number?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; user?: any; error?: string; message?: string }>;
  signup: (data: Partial<User> & { password: string }) => Promise<{ success: boolean; user?: any; error?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isAffiliate: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Listener for ongoing auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!isMounted) return;

      if (session?.user) {
        void loadUserData(session.user);
      } else {
        setUser(null);
      }
    });

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const { language } = useLanguage();

  const loadUserData = async (authUser: AuthUser) => {
    try {
      const [roles, profile] = await Promise.all([
        getUserRoles(authUser.id),
        getUserProfile(authUser.id),
      ]);

      if (profile?.is_blocked) {
        toast.error(
          language === "bn"
            ? "আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে। দয়া করে আমাদের সাপোর্টের সাথে যোগাযোগ করুন।"
            : "Your account has been blocked. Please contact our support."
        );
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      // Check if user is an affiliate
      console.log(`[AuthContext] Checking affiliate record for user: ${authUser.id}`);
      const { data: affiliateData, error: affFetchError } = await supabase
        .from("affiliates")
        .select("id, status")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (affFetchError) {
        console.error("[AuthContext] Error fetching affiliate data:", affFetchError);
      }

      if (affiliateData?.status === "pending") {
        toast.info(
          language === "bn"
            ? "আপনার অ্যাফিলিয়েট আবেদনটি অ্যাডমিন অনুমোদনের জন্য অপেক্ষমাণ রয়েছে।"
            : "Your affiliate account is pending admin approval.",
          { duration: 5000, id: "pending-affiliate-toast" }
        );
      }

      const userRoles = [...roles];

      setUser({
        id: authUser.id,
        name: profile?.name || authUser.email?.split("@")[0] || "User",
        email: authUser.email || "",
        phone: profile?.phone || "",
        role: userRoles.includes("admin")
          ? "admin"
          : userRoles.includes("affiliate")
            ? "affiliate"
            : "customer",
        roles: userRoles,
        avatar: profile?.avatar_url || undefined,
        is_blocked: profile?.is_blocked || false,
        loyalty_points: profile?.loyalty_points || 0,
        address: profile?.address || null,
        date_of_birth: profile?.date_of_birth || null,
        occupation: profile?.occupation || null,
        nid: profile?.nid || null,
        payment_method: profile?.payment_method || null,
        payment_number: profile?.payment_number || null,
      });
    } catch (err) {
      console.error("loadUserData error:", err);
      // Fallback: treat as basic authenticated user to avoid blocking login UI
      setUser({
        id: authUser.id,
        name: authUser.email?.split("@")[0] || "User",
        email: authUser.email || "",
        phone: "",
        role: "customer",
        roles: ["customer"],
      });
    }
  };

  const login = async (email: string, password: string, _role?: UserRole): Promise<{ success: boolean; user?: any; error?: string; message?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Login error:", error);
      if (error.message?.includes("Email not confirmed")) {
        return {
          success: false,
          error: "EMAIL_NOT_VERIFIED",
          message: "Please verify your email address before logging in. Check your inbox for a verification link.",
        };
      }
      if (error.message === "AFFILIATE_PENDING") {
        return {
          success: false,
          error: "AFFILIATE_PENDING",
          message: language === "bn"
            ? "আপনার অ্যাফিলিয়েট আবেদন এখনও অনুমোদিত হয়নি। অ্যাডমিন অনুমোদনের পর আপনি লগইন করতে পারবেন।"
            : "Your affiliate application is still pending admin approval. You will be able to login once approved.",
        };
      }
      if (error.message === "AFFILIATE_REJECTED") {
        return {
          success: false,
          error: "AFFILIATE_REJECTED",
          message: language === "bn"
            ? "আপনার অ্যাফিলিয়েট আবেদন প্রত্যাখ্যান করা হয়েছে। আরও তথ্যের জন্য সাপোর্টে যোগাযোগ করুন।"
            : "Your affiliate application has been rejected. Please contact support for more information.",
        };
      }
      return { success: false, error: error.message };
    }

    const sessionUser = data?.session?.user;
    if (!sessionUser) {
      return { success: false, error: "Login failed — no session returned." };
    }

    return { success: true, user: sessionUser };
  };

  const signup = async (data: Partial<User> & { password: string; role?: string }): Promise<{ success: boolean; user?: any; error?: string; affiliate_pending?: boolean }> => {
    console.log("[AuthContext] Starting signup via API backend...");

    const { data: result, error } = await supabase.auth.signUp({
      email: data.email!,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          role: data.role,
        },
      },
    });

    if (error) {
      console.error("[AuthContext] Signup error:", error);
      return { success: false, error: error.message };
    }

    // Affiliate pending — do not auto-login, just return status
    if ((result as any)?.affiliate_pending) {
      return { success: true, affiliate_pending: true, user: (result as any)?.user };
    }

    // Normal registration — backend returns session, auto-login immediately
    const session = (result as any)?.session;
    if (session?.access_token && session?.user) {
      localStorage.setItem("rm_auth_token", session.access_token);
      await loadUserData(session.user);
    }

    return { success: true, user: (result as any)?.user };
  };

  const resendConfirmation = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      console.error("Resend confirmation error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error("Reset password error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Update password error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const loginWithPhoneOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      console.error("Phone OTP login error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const verifyPhoneOtp = async (phone: string, token: string): Promise<{ success: boolean; user?: any; error?: string }> => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });

    if (error) {
      console.error("Verify OTP error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, user: (data as any)?.user };
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserData(session.user);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      setUser({ ...user, role });
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        resendConfirmation,
        resetPasswordForEmail,
        updatePassword,
        loginWithPhoneOtp,
        verifyPhoneOtp,
        logout,
        switchRole,
        hasRole,
        isAdmin: user?.roles.includes("admin") || false,
        isAffiliate: user?.roles.includes("affiliate") || false,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
