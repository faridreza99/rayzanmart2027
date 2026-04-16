import { Link, useLocation } from "wouter";
import { Package, Users, DollarSign, ShoppingBag, Clock, BarChart2 } from "lucide-react";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) { return <div className="p-8 text-center text-muted-foreground">Access denied</div>; }

  const { data: stats, isLoading } = useGetAdminDashboard({ query: {} });

  if (isLoading) return <div className="p-16 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div></div>;

  const s = stats as any;

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    shipped: "bg-orange-100 text-orange-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `৳${Number(s?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-secondary", sub: `Today: ৳${Number(s?.todayRevenue ?? 0).toLocaleString()}` },
          { label: "Total Orders", value: s?.totalOrders ?? 0, icon: ShoppingBag, color: "text-primary", sub: `Today: ${s?.todayOrders ?? 0}` },
          { label: "Total Users", value: s?.totalUsers ?? 0, icon: Users, color: "text-blue-600", sub: `Affiliates: ${s?.totalAffiliates ?? 0}` },
          { label: "Total Products", value: s?.totalProducts ?? 0, icon: Package, color: "text-purple-600", sub: "" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            {stat.sub && <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {(s?.pendingOrders > 0 || s?.pendingWithdrawals > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {s?.pendingOrders > 0 && (
            <Link href="/admin/orders">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900">{s.pendingOrders} Pending Orders</p>
                  <p className="text-sm text-yellow-700">Needs attention</p>
                </div>
              </div>
            </Link>
          )}
          {s?.pendingWithdrawals > 0 && (
            <Link href="/admin/withdrawals">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer">
                <DollarSign className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="font-bold text-orange-900">{s.pendingWithdrawals} Pending Withdrawals</p>
                  <p className="text-sm text-orange-700">Review and approve</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Recent Orders */}
      {s?.recentOrders?.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-secondary hover:underline">View all</Link>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {s.recentOrders.map((o: any) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/50 transition">
                    <td className="px-4 py-3 font-medium">#{o.orderNumber}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 font-bold text-primary">৳{Number(o.total).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
