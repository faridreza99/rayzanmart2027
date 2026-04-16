import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Profile {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  loyaltyPoints: number;
  isBlocked: boolean;
  dateOfBirth?: string | null;
  occupation?: string | null;
  nid?: string | null;
  paymentMethod?: string | null;
  paymentNumber?: string | null;
  createdAt: string;
}

interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  roles: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAffiliate: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("rayzan_token"));
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  const { data: meData, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (meData) {
      setUser(meData as AuthUser);
    }
  }, [meData]);

  function setAuth(newUser: AuthUser, newToken: string) {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("rayzan_token", newToken);
  }

  function logout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("rayzan_token");
        queryClient.clear();
        setLocation("/");
      },
    });
  }

  const isAdmin = user?.roles?.includes("admin") ?? false;
  const isAffiliate = user?.roles?.includes("affiliate") ?? false;

  return (
    <AuthContext.Provider value={{ user, token, isLoading: !!token && isLoading, isAdmin, isAffiliate, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
