import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAllOrders, useUpdateOrderStatus, OrderStatus } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useProfitLoss } from "@/hooks/useProfitLoss";
import { useAllAffiliates, useUpdateAffiliateStatus } from "@/hooks/useAffiliate";
import { toast } from "sonner";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { EnterpriseConfirmDialog } from "@/components/admin/EnterpriseConfirmDialog";
import { EnterpriseEmptyState } from "@/components/admin/EnterpriseEmptyState";
import { ItemStateIndicator, ItemState } from "@/components/admin/ItemStateIndicator";
import { Users } from "lucide-react";
import { CommissionEngine } from "@/components/admin/CommissionEngine";
import { CommissionsManagement } from "@/components/admin/CommissionsManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { ReportsPanel } from "@/components/admin/ReportsPanel";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { OrdersAdvanced } from "@/components/admin/OrdersAdvanced";
import { CouponManagement } from "@/components/admin/CouponManagement";
import { LoyaltySettings } from "@/components/admin/LoyaltySettings";
import { ExecutiveKPICards } from "@/components/admin/dashboard/ExecutiveKPICards";
import { BusinessPerformanceCharts } from "@/components/admin/dashboard/BusinessPerformanceCharts";
import { OrderPipelineWidget } from "@/components/admin/dashboard/OrderPipelineWidget";
import { AffiliateMarketingSnapshot } from "@/components/admin/dashboard/AffiliateMarketingSnapshot";
import { SystemHealthPanel } from "@/components/admin/dashboard/SystemHealthPanel";
import { QuickActionsPanel } from "@/components/admin/dashboard/QuickActionsPanel";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { BrandManagement } from "@/components/admin/BrandManagement";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { AffiliateApplicationsPanel } from "@/components/admin/AffiliateApplicationsPanel";
import { SystemInfo } from "@/components/admin/SystemInfo";
import { HeroBannerManagement } from "@/components/admin/HeroBannerManagement";
import { ProductReviewsPanel } from "@/components/admin/ProductReviewsPanel";
import { MarketingExpenseManagement } from "@/components/admin/MarketingExpenseManagement";
import { WithdrawalManagement } from "@/components/admin/WithdrawalManagement";
import { FAQManagement } from "@/components/admin/FAQManagement";
import { TestimonialManagement } from "@/components/admin/TestimonialManagement";
import { VideoCampaignManagement } from "@/components/admin/VideoCampaignManagement";
import { AffiliatePageContentManagement } from "@/components/admin/AffiliatePageContentManagement";
import { UserReport } from "@/components/admin/UserReport";

const AdminDashboard = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [affiliateConfirm, setAffiliateConfirm] = useState<{
    open: boolean;
    affiliate: any;
    newStatus: "pending" | "active" | "inactive";
  }>({ open: false, affiliate: null, newStatus: "active" });

  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: affiliates, isLoading: affiliatesLoading } = useAllAffiliates();
  const { data: plData, isLoading: plLoading } = useProfitLoss();
  const updateOrderStatus = useUpdateOrderStatus();
  const updateAffiliateStatus = useUpdateAffiliateStatus();

  // Calculate KPI data
  const kpiData = useMemo(() => {
    const totalRevenue = plData?.reduce((sum, d) => sum + Number(d.total_sales), 0) || 0;
    const totalProfit = plData?.reduce((sum, d) => sum + Number(d.net_profit), 0) || 0;
    const totalOrders = plData?.reduce((sum, d) => sum + Number(d.order_count), 0) || 0;
    const activeCustomers = orders ? new Set(orders.map(o => o.user_id).filter(Boolean)).size : 0;
    const activeAffiliates = affiliates?.filter((a: any) => a.status === 'active').length || 0;

    // Calculate changes (simple last 30 days vs previous 30 days logic for demo, 
    // in real app you would fetch two periods)
    return {
      totalRevenue,
      totalOrders,
      activeCustomers,
      activeAffiliates,
      totalProfit,
      revenueChange: 12.5,
      ordersChange: 8.3,
      customersChange: 5.2,
      affiliatesChange: -2.1,
      profitChange: 15.4,
    };
  }, [orders, affiliates, plData]);

  // Calculate order pipeline data
  const pipelineData = useMemo(() => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'];
    const total = orders?.length || 0;

    return statuses.map(status => {
      const count = orders?.filter(o => o.status === status).length || 0;
      return {
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  }, [orders]);

  // Generate chart data (simulated daily data)
  const chartData = useMemo(() => {
    if (!plData) return [];
    
    // Aggregate by date
    const dateMap = new Map();
    plData.forEach(d => {
      const dateStr = new Date(d.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0, profit: 0 });
      }
      const entry = dateMap.get(dateStr);
      entry.revenue += Number(d.total_sales);
      entry.orders += Number(d.order_count);
      entry.profit += Number(d.net_profit);
    });

    return Array.from(dateMap.values()).reverse().slice(-30);
  }, [plData]);

  // Top affiliates data
  const topAffiliates = useMemo(() => {
    if (!affiliates) return [];

    return [...affiliates]
      .sort((a: any, b: any) => Number(b.total_sales || 0) - Number(a.total_sales || 0))
      .slice(0, 5)
      .map((aff: any) => ({
        name: aff.profiles?.name || aff.referral_code,
        sales: Number(aff.total_sales || 0),
        commission: Number(aff.total_commission || 0),
      }));
  }, [affiliates]);

  // Calculate commission liability
  const totalCommissionLiability = useMemo(() => {
    return affiliates?.reduce((sum: number, a: any) => sum + Number(a.pending_commission || 0), 0) || 0;
  }, [affiliates]);

  // Recent activity (simulated)
  const recentActivity = useMemo(() => {
    return [
      { action: 'order_update', description: t("statusUpdated"), time: new Date(Date.now() - 1000 * 60 * 5) },
      { action: 'product_add', description: t("addNewProduct"), time: new Date(Date.now() - 1000 * 60 * 30) },
      { action: 'affiliate_approve', description: t("affiliateManagement"), time: new Date(Date.now() - 1000 * 60 * 60) },
    ];
  }, [t]);

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
      toast.success(t("statusUpdated"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleAffiliateStatusChange = async (affiliateId: string, status: "pending" | "active" | "inactive") => {
    // Find the affiliate
    const affiliate = affiliates?.find((a: any) => a.id === affiliateId);
    if (!affiliate) return;

    // For inactive status, show confirmation
    if (status === "inactive") {
      setAffiliateConfirm({ open: true, affiliate, newStatus: status });
      return;
    }

    // For other status changes, proceed directly
    try {
      await updateAffiliateStatus.mutateAsync({ affiliateId, status });
      toast.success(t("statusUpdated"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const confirmAffiliateStatusChange = async () => {
    if (!affiliateConfirm.affiliate) return;

    try {
      await updateAffiliateStatus.mutateAsync({
        affiliateId: affiliateConfirm.affiliate.id,
        status: affiliateConfirm.newStatus,
      });
      toast.success(
        language === "bn"
          ? "অ্যাফিলিয়েট স্ট্যাটাস আপডেট হয়েছে। পূর্বের কমিশনে কোনো প্রভাব নেই।"
          : "Affiliate status updated. Past commissions are unaffected."
      );
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const getAffiliateState = (status: string): ItemState => {
    if (status === "active") return "active";
    if (status === "inactive") return "paused";
    return "draft";
  };

  const isLoading = ordersLoading || productsLoading || affiliatesLoading || plLoading;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Overview Dashboard */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <ExecutiveKPICards data={kpiData} isLoading={isLoading} />

          <QuickActionsPanel
            onAddProduct={() => setActiveTab("products")}
            onCreateCampaign={() => setActiveTab("coupons")}
            onChangeCommission={() => setActiveTab("commission")}
            onViewReports={() => setActiveTab("reports")}
            onManageMarketing={() => setActiveTab("marketing")}
          />

          <BusinessPerformanceCharts data={chartData} isLoading={isLoading} />

          <div className="grid gap-4 lg:grid-cols-3">
            <OrderPipelineWidget
              data={pipelineData}
              isLoading={isLoading}
              onStatusClick={() => setActiveTab("orders")}
            />
            <AffiliateMarketingSnapshot
              topAffiliates={topAffiliates}
              conversionRate={3.2}
              activeCampaigns={affiliates?.length || 0}
              totalCommissionLiability={totalCommissionLiability}
              isLoading={isLoading}
            />
            <SystemHealthPanel auditLog={recentActivity} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Orders */}
      {activeTab === "orders" && <OrdersAdvanced />}

      {/* Products - Enterprise */}
      {activeTab === "products" && <ProductManagement />}

      {/* Categories - Enterprise */}
      {activeTab === "categories" && <CategoryManagement />}

      {/* Brands - Enterprise */}
      {activeTab === "brands" && <BrandManagement />}

      {/* Affiliates */}
      {activeTab === "affiliates" && <AffiliateApplicationsPanel />}

      {/* Commissions Management */}
      {activeTab === "commissions-mgmt" && <CommissionsManagement />}

      {/* Withdrawals */}
      {activeTab === "withdrawals" && <WithdrawalManagement />}

      {/* Users */}
      {activeTab === "users" && <UserManagement />}

      {/* Commission */}
      {activeTab === "commission" && <CommissionEngine />}

      {/* Coupons */}
      {activeTab === "coupons" && <CouponManagement />}

      {/* Loyalty */}
      {activeTab === "loyalty" && <LoyaltySettings />}

      {/* Reviews */}
      {activeTab === "reviews" && <ProductReviewsPanel />}
      
      {/* Marketing */}
      {activeTab === "marketing" && <MarketingExpenseManagement />}

      {/* Reports */}
      {activeTab === "reports" && <ReportsPanel />}

      {/* Settings */}
      {activeTab === "settings" && <SystemSettings />}

      {/* Audit Log */}
      {activeTab === "audit" && <AuditLogPanel />}

      {/* System Info (Admin Only) */}
      {activeTab === "system-info" && <SystemInfo />}

      {/* Hero Banners */}
      {activeTab === "hero-banners" && <HeroBannerManagement />}

      {/* Affiliate FAQs */}
      {activeTab === "affiliate-faqs" && <FAQManagement />}

      {/* Affiliate Testimonials */}
      {activeTab === "affiliate-testimonials" && <TestimonialManagement />}

      {/* Affiliate Videos */}
      {activeTab === "affiliate-videos" && <VideoCampaignManagement />}

      {/* Affiliate Page Content */}
      {activeTab === "affiliate-page-content" && <AffiliatePageContentManagement />}
      {activeTab === "user-report" && <UserReport />}
    </AdminLayout>
  );
};

export default AdminDashboard;
