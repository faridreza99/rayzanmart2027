import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.some((role) => user.roles.includes(role))) {
    // Redirect to appropriate dashboard based on user's role
    if (user.roles.includes("admin")) {
      return <Navigate to="/admin" replace />;
    }
    if (user.roles.includes("affiliate")) {
      return <Navigate to="/affiliate" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};