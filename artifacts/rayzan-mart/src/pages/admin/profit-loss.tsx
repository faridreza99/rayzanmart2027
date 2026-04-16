import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetProfitLoss } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function AdminProfitLossPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));

  const { data: rows, refetch } = useGetProfitLoss({ params: { startDate, endDate } }, { query: {} });

  const data = rows as any[] ?? [];
  const totals = data.reduce((acc, r) => ({
    sales: acc.sales + r.totalSales,
    cost: acc.cost + r.totalProductCost,
    delivery: acc.delivery + r.totalDeliveryCost,
    commissions: acc.commissions + r.totalCommissions,
    profit: acc.profit + r.netProfit,
  }), { sales: 0, cost: 0, delivery: 0, commissions: 0, profit: 0 });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Profit & Loss Report</h1>

      <div className="flex gap-4 items-end mb-6 flex-wrap">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-40" />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-40" />
        </div>
        <Button className="bg-secondary hover:bg-green-700 text-white" onClick={() => refetch()}>Generate Report</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Sales", value: totals.sales, color: "text-secondary" },
          { label: "Product Cost", value: totals.cost, color: "text-orange-600" },
          { label: "Delivery Cost", value: totals.delivery, color: "text-blue-600" },
          { label: "Commissions", value: totals.commissions, color: "text-purple-600" },
          { label: "Net Profit", value: totals.profit, color: totals.profit >= 0 ? "text-secondary" : "text-destructive" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <div className="flex items-center gap-1">
              {s.label === "Net Profit" && (totals.profit >= 0 ? <TrendingUp className="w-4 h-4 text-secondary" /> : <TrendingDown className="w-4 h-4 text-destructive" />)}
              <p className={`text-xl font-bold ${s.color}`}>৳{Number(s.value).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orders</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sales</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cost</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Profit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any, i: number) => (
              <tr key={i} className="border-t border-border hover:bg-muted/50">
                <td className="px-4 py-3">{new Date(r.orderDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.categoryName}</td>
                <td className="px-4 py-3">{r.orderCount}</td>
                <td className="px-4 py-3 text-secondary font-medium">৳{Number(r.totalSales).toLocaleString()}</td>
                <td className="px-4 py-3">৳{Number(r.totalProductCost + r.totalDeliveryCost + r.totalCommissions).toLocaleString()}</td>
                <td className={`px-4 py-3 font-bold ${r.netProfit >= 0 ? 'text-secondary' : 'text-destructive'}`}>৳{Number(r.netProfit).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && <p className="text-center py-8 text-muted-foreground">No data for selected period</p>}
      </div>
    </div>
  );
}
