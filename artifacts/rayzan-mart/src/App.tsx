import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart-context";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminLayout from "@/components/AdminLayout";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ProductsPage from "@/pages/products";
import ProductDetailPage from "@/pages/product-detail";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import OrdersPage from "@/pages/orders";
import OrderDetailPage from "@/pages/order-detail";
import ProfilePage from "@/pages/profile";
import WishlistPage from "@/pages/wishlist";
import LoyaltyPage from "@/pages/loyalty";

import AffiliateLandingPage from "@/pages/affiliate/landing";
import AffiliateApplyPage from "@/pages/affiliate/apply";
import AffiliateDashboardPage from "@/pages/affiliate/dashboard";
import AffiliateWithdrawalsPage from "@/pages/affiliate/withdrawals";
import AffiliateCommissionsPage from "@/pages/affiliate/commissions";
import AffiliateCampaignsPage from "@/pages/affiliate/campaigns";

import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminOrdersPage from "@/pages/admin/orders";
import AdminProductsPage from "@/pages/admin/products";
import AdminCategoriesPage from "@/pages/admin/categories";
import AdminBrandsPage from "@/pages/admin/brands";
import AdminUsersPage from "@/pages/admin/users";
import AdminAffiliatesPage from "@/pages/admin/affiliates";
import AdminWithdrawalsPage from "@/pages/admin/withdrawals";
import AdminCouponsPage from "@/pages/admin/coupons";
import AdminBannersPage from "@/pages/admin/banners";
import AdminProfitLossPage from "@/pages/admin/profit-loss";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Store routes */}
      <Route path="/" component={() => <StoreLayout><HomePage /></StoreLayout>} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/products" component={() => <StoreLayout><ProductsPage /></StoreLayout>} />
      <Route path="/product/:id" component={() => <StoreLayout><ProductDetailPage /></StoreLayout>} />
      <Route path="/cart" component={() => <StoreLayout><CartPage /></StoreLayout>} />
      <Route path="/checkout" component={() => <StoreLayout><CheckoutPage /></StoreLayout>} />
      <Route path="/orders" component={() => <StoreLayout><OrdersPage /></StoreLayout>} />
      <Route path="/order/:id" component={() => <StoreLayout><OrderDetailPage /></StoreLayout>} />
      <Route path="/profile" component={() => <StoreLayout><ProfilePage /></StoreLayout>} />
      <Route path="/wishlist" component={() => <StoreLayout><WishlistPage /></StoreLayout>} />
      <Route path="/loyalty" component={() => <StoreLayout><LoyaltyPage /></StoreLayout>} />

      {/* Affiliate routes */}
      <Route path="/affiliate" component={() => <StoreLayout><AffiliateLandingPage /></StoreLayout>} />
      <Route path="/affiliate/apply" component={() => <StoreLayout><AffiliateApplyPage /></StoreLayout>} />
      <Route path="/affiliate/dashboard" component={() => <StoreLayout><AffiliateDashboardPage /></StoreLayout>} />
      <Route path="/affiliate/withdrawals" component={() => <StoreLayout><AffiliateWithdrawalsPage /></StoreLayout>} />
      <Route path="/affiliate/commissions" component={() => <StoreLayout><AffiliateCommissionsPage /></StoreLayout>} />
      <Route path="/affiliate/campaigns" component={() => <StoreLayout><AffiliateCampaignsPage /></StoreLayout>} />

      {/* Admin routes */}
      <Route path="/admin" component={() => <AdminLayout><AdminDashboardPage /></AdminLayout>} />
      <Route path="/admin/orders" component={() => <AdminLayout><AdminOrdersPage /></AdminLayout>} />
      <Route path="/admin/products" component={() => <AdminLayout><AdminProductsPage /></AdminLayout>} />
      <Route path="/admin/categories" component={() => <AdminLayout><AdminCategoriesPage /></AdminLayout>} />
      <Route path="/admin/brands" component={() => <AdminLayout><AdminBrandsPage /></AdminLayout>} />
      <Route path="/admin/users" component={() => <AdminLayout><AdminUsersPage /></AdminLayout>} />
      <Route path="/admin/affiliates" component={() => <AdminLayout><AdminAffiliatesPage /></AdminLayout>} />
      <Route path="/admin/withdrawals" component={() => <AdminLayout><AdminWithdrawalsPage /></AdminLayout>} />
      <Route path="/admin/coupons" component={() => <AdminLayout><AdminCouponsPage /></AdminLayout>} />
      <Route path="/admin/banners" component={() => <AdminLayout><AdminBannersPage /></AdminLayout>} />
      <Route path="/admin/profit-loss" component={() => <AdminLayout><AdminProfitLossPage /></AdminLayout>} />

      <Route component={() => <StoreLayout><NotFound /></StoreLayout>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <CartProvider>
              <Router />
              <Toaster richColors position="top-right" />
            </CartProvider>
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
