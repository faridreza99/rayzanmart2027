import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";

// Critical pages — loaded eagerly for fast initial paint
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFound from "./pages/NotFound";

// Heavy pages — lazy loaded to reduce initial bundle
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const FooterInfoPage = lazy(() => import("./pages/FooterInfoPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard"));
const AffiliateDashboard = lazy(() => import("./pages/affiliate/AffiliateDashboard"));
const AffiliateProductsPage = lazy(() => import("./pages/affiliate/AffiliateProductsPage"));
const AffiliateLanding = lazy(() => import("./pages/affiliate/AffiliateLanding"));
const AffiliateSignup = lazy(() => import("./pages/affiliate/AffiliateSignup"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

import { useSiteSettings } from "@/hooks/useAdminSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReferralTracking } from "@/hooks/useReferralTracking";

const DynamicTitle = () => {
  const { data: settings } = useSiteSettings();
  const { language } = useLanguage();

  useEffect(() => {
    if (settings?.site_name) {
      const name = language === "bn" ? settings.site_name.bn : settings.site_name.en;
      if (name) document.title = name;
    }
    if (settings?.site_logo?.url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.site_logo.url;
    }
  }, [settings, language]);

  return null;
};

const ReferralTracker = () => {
  useReferralTracking();
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SiteSettingsProvider>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ReferralTracker />
              <DynamicTitle />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/wishlist"
                    element={
                      <ProtectedRoute>
                        <WishlistPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/about" element={<FooterInfoPage />} />
                  <Route path="/contact" element={<FooterInfoPage />} />
                  <Route path="/faq" element={<FooterInfoPage />} />
                  <Route path="/privacy" element={<FooterInfoPage />} />
                  <Route path="/terms" element={<FooterInfoPage />} />
                  <Route path="/refund" element={<FooterInfoPage />} />
                  <Route path="/shipping" element={<FooterInfoPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route
                    path="/dashboard/*"
                    element={
                      <ProtectedRoute>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/affiliate"
                    element={
                      <ProtectedRoute allowedRoles={["affiliate"]}>
                        <AffiliateDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/affiliate/products"
                    element={
                      <ProtectedRoute allowedRoles={["affiliate"]}>
                        <AffiliateProductsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/affiliate-landing" element={<AffiliateLanding />} />
                  <Route path="/affiliate/signup" element={<ProtectedRoute><AffiliateSignup /></ProtectedRoute>} />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
    </SiteSettingsProvider>
  </QueryClientProvider>
);

export default App;
