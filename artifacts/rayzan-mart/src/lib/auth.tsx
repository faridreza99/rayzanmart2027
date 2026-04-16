import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserWithProfile } from "@workspace/api-client-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserWithProfile | null;
  isLoading: boolean;
  login: (user: UserWithProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  
  const { data, isLoading } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const logoutMutation = useLogout();

  const login = (newUser: UserWithProfile) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUser(null);
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
