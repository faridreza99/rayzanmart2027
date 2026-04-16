import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, TrendingUp, Package, Users, DollarSign,
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
  ShoppingCart, Percent, Truck, Megaphone, Trophy, RefreshCw,
  CalendarDays, BarChart2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, startOfToday, endOfToday } from "date-fns";
import { useReportSummary, useReportDaily, useReportAffiliates, useReportProducts } from "@/hooks/useReports";
import { useMarketingExpenses } from "@/hooks/useMarketingExpenses";
import { Separator } from "@/components/ui/separator";

const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))"];

const STATUS_COLORS: Record<string, string> = {
  delivered:  "#10b981",
  pending:    "#f59e0b",
  processing: "#3b82f6",
  shipped:    "#8b5cf6",
  cancelled:  "#ef4444",
  returned:   "#6b7280",
};

function StatCard({
  title, value, sub, icon: Icon, borderColor, valueColor, trend,
}: {
  title: string; value: string; sub?: string;
  icon: any; borderColor: string; valueColor?: string; trend?: { value: number };
}) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 rounded-full bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor || ""}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export const ReportsPanel = () => {
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { start, end } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return {
          start: format(startOfToday(), "yyyy-MM-dd"),
          end:   format(endOfToday(),   "yyyy-MM-dd"),
        };
      case "this_month":
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end:   format(endOfMonth(now),   "yyyy-MM-dd"),
        };
      case "last_month": {
        const lm = subMonths(now, 1);
        return {
          start: format(startOfMonth(lm), "yyyy-MM-dd"),
          end:   format(endOfMonth(lm),   "yyyy-MM-dd"),
        };
      }
      case "custom":
        return { start: customStart, end: customEnd };
      default:
        return { start: undefined, end: undefined };
    }
  }, [period, customStart, customEnd]);

  const { data: summary, isLoading: sumLoading, refetch: refetchAll } = useReportSummary(start, end);
  const { data: daily,   isLoading: dailyLoading }   = useReportDaily(start, end);
  const { data: affiliates, isLoading: affLoading }  = useReportAffiliates(start, end);
  const { data: products,   isLoading: prodLoading } = useReportProducts(start, end);
  const { data: marketingExpenses } = useMarketingExpenses();

  const totalMarketing = useMemo(() => {
    if (!marketingExpenses) return 0;
    return marketingExpenses
      .filter(e => {
        if (!start && !end) return true;
        return (!start || e.date >= start) && (!end || e.date <= end);
      })
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [marketingExpenses, start, end]);

  const netProfit = summary
    ? summary.total_sales - summary.total_cost - summary.total_delivery - summary.total_commissions - totalMarketing
    : 0;

  const chartData = useMemo(() => {
    if (!daily) return [];
    return daily.map(d => ({
      date:     format(new Date(d.date), "dd MMM"),
      revenue:  d.revenue,
      profit:   d.revenue - d.cost - d.delivery - d.commissions,
      orders:   d.orders,
      commission: d.commissions,
    }));
  }, [daily]);

  const incomeSourceData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: language === "bn" ? "ডাইরেক্ট" : "Direct", value: summary.direct_sales,    fill: COLORS[0] },
      { name: language === "bn" ? "অ্যাফিলিয়েট" : "Affiliate", value: summary.affiliate_sales, fill: COLORS[2] },
    ].filter(d => d.value > 0);
  }, [summary, language]);

  const orderStatusData = useMemo(() => {
    if (!summary?.order_status) return [];
    return summary.order_status.map(s => ({
      name:  s.status.charAt(0).toUpperCase() + s.status.slice(1),
      value: s.count,
      total: s.total,
      fill:  STATUS_COLORS[s.status] || "#6b7280",
    }));
  }, [summary]);

  const expenseData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: language === "bn" ? "পণ্য খরচ" : "Cost of Goods", value: summary.total_cost,     fill: COLORS[0] },
      { name: language === "bn" ? "ডেলিভারি" : "Delivery",        value: summary.total_delivery, fill: COLORS[1] },
      { name: language === "bn" ? "কমিশন" : "Commission",          value: summary.total_commissions, fill: COLORS[2] },
      { name: language === "bn" ? "মার্কেটিং" : "Marketing",       value: totalMarketing,         fill: COLORS[4] },
    ].filter(e => e.value > 0);
  }, [summary, totalMarketing, language]);

  const isLoading = sumLoading || dailyLoading;

  const bn = (b: string, e: string) => language === "bn" ? b : e;

  return (
    <div className="space-y-6">
      {/* ─── Header & Filters ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{bn("আর্থিক প্রতিবেদন", "Financial Report")}</h2>
          <p className="text-muted-foreground text-sm">{bn("বিক্রয়, মুনাফা ও অ্যাফিলিয়েট পারফরম্যান্স", "Sales, profit & affiliate performance overview")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs mb-1 block">{bn("সময়কাল", "Period")}</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{bn("আজকে", "Today")}</SelectItem>
                <SelectItem value="this_month">{bn("এই মাস", "This Month")}</SelectItem>
                <SelectItem value="last_month">{bn("গত মাস", "Last Month")}</SelectItem>
                <SelectItem value="all_time">{bn("সর্বদা", "All Time")}</SelectItem>
                <SelectItem value="custom">{bn("কাস্টম", "Custom Range")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {period === "custom" && (
            <>
              <div>
                <Label className="text-xs mb-1 block">{bn("শুরু", "From")}</Label>
                <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-36" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">{bn("শেষ", "To")}</Label>
                <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-36" />
              </div>
            </>
          )}
          <Button variant="outline" size="icon" onClick={() => refetchAll()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {summary && !isLoading && (
        <>
          {/* ─── KPI Cards ─────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={bn("মোট বিক্রয়", "Total Sales")}
              value={`${t("currency")}${summary.total_sales.toLocaleString()}`}
              sub={`${summary.total_orders} ${bn("টি অর্ডার", "orders")}`}
              icon={DollarSign} borderColor="border-l-primary"
            />
            <StatCard
              title={bn("নিট মুনাফা", "Net Profit")}
              value={`${t("currency")}${netProfit.toLocaleString()}`}
              sub={`${((summary.total_sales > 0 ? netProfit / summary.total_sales : 0) * 100).toFixed(1)}% ${bn("মার্জিন", "margin")}`}
              icon={TrendingUp} borderColor={netProfit >= 0 ? "border-l-success" : "border-l-destructive"}
              valueColor={netProfit >= 0 ? "text-success" : "text-destructive"}
            />
            <StatCard
              title={bn("অ্যাফিলিয়েট কমিশন", "Affiliate Commission")}
              value={`${t("currency")}${summary.total_commissions.toLocaleString()}`}
              sub={`${summary.affiliate_orders} ${bn("টি অ্যাফিলিয়েট অর্ডার", "affiliate orders")}`}
              icon={Users} borderColor="border-l-warning"
            />
            <StatCard
              title={bn("গড় অর্ডার মূল্য", "Avg. Order Value")}
              value={`${t("currency")}${summary.avg_order_value.toFixed(0)}`}
              sub={bn("প্রতি অর্ডারে গড় আয়", "per order average")}
              icon={ShoppingCart} borderColor="border-l-info"
            />
          </div>

          {/* ─── Charts Row 1 ──────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue & Profit Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {bn("রাজস্ব ও মুনাফা ট্রেন্ড", "Revenue & Profit Trend")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))", fontSize: "12px" }}
                          formatter={(value: any, name: any) => [`৳${Number(value).toLocaleString()}`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Area type="monotone" dataKey="revenue" name={bn("রাজস্ব", "Revenue")} stroke="hsl(var(--primary))" fill="url(#gRev)" strokeWidth={2} />
                        <Area type="monotone" dataKey="profit"  name={bn("মুনাফা", "Profit")}  stroke="#10b981" fill="url(#gProfit)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                    {bn("এই সময়কালে কোনো ডেটা নেই", "No data for this period")}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income Source Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4 text-warning" />
                  {bn("আয়ের উৎস", "Income Source")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incomeSourceData.length > 0 ? (
                  <>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={incomeSourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                            {incomeSourceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => `৳${Number(v).toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-2">
                      {incomeSourceData.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-semibold">{t("currency")}{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        {bn("অ্যাফিলিয়েট অর্ডার", "Affiliate Orders")}: {summary.affiliate_orders} / {summary.total_orders}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                    {bn("ডেটা নেই", "No data")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Charts Row 2 ──────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-info" />
                  {bn("অর্ডার স্ট্যাটাস", "Order Status Breakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderStatusData.length > 0 ? (
                  <div className="space-y-3">
                    {orderStatusData.map((s, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                            <span className="capitalize">{s.name}</span>
                          </div>
                          <span className="text-muted-foreground">{s.value} {bn("টি", "orders")} · {t("currency")}{s.total.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(s.value / Math.max(...orderStatusData.map(x => x.value))) * 100}%`,
                              background: s.fill
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">{bn("ডেটা নেই", "No data")}</div>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="h-4 w-4 text-destructive" />
                  {bn("ব্যয়ের বিভাজন", "Expense Breakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseData.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseData} layout="vertical" margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip formatter={(v: any) => `৳${Number(v).toLocaleString()}`} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {expenseData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">{bn("ডেটা নেই", "No data")}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Tabs: Affiliates · Products · P&L Statement ───────── */}
          <Tabs defaultValue="affiliates">
            <TabsList className="mb-4">
              <TabsTrigger value="affiliates" className="gap-1.5">
                <Users className="h-4 w-4" /> {bn("অ্যাফিলিয়েট রিপোর্ট", "Affiliate Report")}
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-1.5">
                <Package className="h-4 w-4" /> {bn("পণ্য বিক্রয়", "Product Sales")}
              </TabsTrigger>
              <TabsTrigger value="pnl" className="gap-1.5">
                <DollarSign className="h-4 w-4" /> {bn("P&L বিবৃতি", "P&L Statement")}
              </TabsTrigger>
            </TabsList>

            {/* ── Affiliate Report ────────────────────────────────── */}
            <TabsContent value="affiliates">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-warning" />
                    {bn("শীর্ষ অ্যাফিলিয়েট তালিকা", "Top Affiliates Leaderboard")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {affLoading ? (
                    <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : affiliates && affiliates.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground uppercase">
                            <th className="text-left py-2 px-3">#</th>
                            <th className="text-left py-2 px-3">{bn("নাম", "Name")}</th>
                            <th className="text-left py-2 px-3">{bn("রেফারেল কোড", "Referral")}</th>
                            <th className="text-right py-2 px-3">{bn("ক্লিক", "Clicks")}</th>
                            <th className="text-right py-2 px-3">{bn("অর্ডার", "Orders")}</th>
                            <th className="text-right py-2 px-3">{bn("মোট বিক্রয়", "Sales")}</th>
                            <th className="text-right py-2 px-3">{bn("কমিশন", "Commission")}</th>
                            <th className="text-right py-2 px-3">{bn("কনভার্সন", "CVR")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affiliates.map((a, i) => (
                            <tr key={a.id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3">
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-muted-foreground">{i + 1}</span>}
                              </td>
                              <td className="py-2 px-3 font-medium">{a.name}</td>
                              <td className="py-2 px-3">
                                <Badge variant="outline" className="font-mono text-xs">{a.referral_code}</Badge>
                              </td>
                              <td className="py-2 px-3 text-right">{a.total_clicks.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right">{a.order_count}</td>
                              <td className="py-2 px-3 text-right font-semibold">{t("currency")}{a.total_sales.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right text-warning">{t("currency")}{a.total_commission.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right">
                                <Badge variant={a.conversion_rate > 5 ? "success" : "secondary"} className="text-xs">
                                  {a.conversion_rate.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                      {bn("কোনো অ্যাফিলিয়েট ডেটা নেই", "No affiliate data found")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Product Sales ───────────────────────────────────── */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4 text-info" />
                    {bn("পণ্য ভিত্তিক বিক্রয় রিপোর্ট", "Product-wise Sales Report")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prodLoading ? (
                    <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : products && products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground uppercase">
                            <th className="text-left py-2 px-3">{bn("পণ্য", "Product")}</th>
                            <th className="text-left py-2 px-3">{bn("ক্যাটাগরি", "Category")}</th>
                            <th className="text-right py-2 px-3">{bn("পরিমাণ", "Qty")}</th>
                            <th className="text-right py-2 px-3">{bn("অর্ডার", "Orders")}</th>
                            <th className="text-right py-2 px-3">{bn("বিক্রয়", "Sales")}</th>
                            <th className="text-right py-2 px-3">{bn("খরচ", "Cost")}</th>
                            <th className="text-right py-2 px-3">{bn("মুনাফা", "Profit")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((p, i) => (
                            <tr key={p.product_id || i} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3">
                                <div className="font-medium leading-tight">{language === "bn" ? p.name_bn || p.name_en : p.name_en}</div>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground text-xs">{p.category}</td>
                              <td className="py-2 px-3 text-right">{p.total_qty}</td>
                              <td className="py-2 px-3 text-right">{p.order_count}</td>
                              <td className="py-2 px-3 text-right font-semibold">{t("currency")}{p.total_sales.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right text-destructive">{t("currency")}{p.total_cost.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={p.profit >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                                  {t("currency")}{p.profit.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 bg-muted/30 font-bold text-sm">
                            <td colSpan={2} className="py-2 px-3">{bn("মোট", "Total")}</td>
                            <td className="py-2 px-3 text-right">{products.reduce((s, p) => s + p.total_qty, 0)}</td>
                            <td className="py-2 px-3 text-right">{products.reduce((s, p) => s + p.order_count, 0)}</td>
                            <td className="py-2 px-3 text-right">{t("currency")}{products.reduce((s, p) => s + p.total_sales, 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-destructive">{t("currency")}{products.reduce((s, p) => s + p.total_cost, 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-success">{t("currency")}{products.reduce((s, p) => s + p.profit, 0).toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                      {bn("কোনো পণ্য ডেটা নেই", "No product data found")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── P&L Statement ───────────────────────────────────── */}
            <TabsContent value="pnl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{bn("বিস্তারিত লাভ-ক্ষতি হিসাব", "Profit & Loss Statement")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex justify-between py-3 border-b">
                      <span className="font-semibold">{bn("১. মোট বিক্রয় (Revenue)", "1. Total Revenue")}</span>
                      <span className="font-bold">{t("currency")}{summary.total_sales.toLocaleString()}</span>
                    </div>

                    <div className="pl-6 space-y-2 py-3 bg-muted/20 rounded-lg my-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{bn("পণ্য ক্রয় খরচ (COGS)", "Cost of Goods Sold")}</span>
                        <span className="text-destructive">-{t("currency")}{summary.total_cost.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-sm">
                        <span>{bn("মোট লাভ (Gross Profit)", "Gross Profit")}</span>
                        <span className="text-success">{t("currency")}{summary.gross_profit.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-3 border-b">
                      <span className="font-semibold">{bn("২. পরিচালন ব্যয়", "2. Operating Expenses")}</span>
                      <span className="font-bold text-destructive">
                        -{t("currency")}{(summary.total_delivery + summary.total_commissions + totalMarketing).toLocaleString()}
                      </span>
                    </div>

                    <div className="pl-6 space-y-2.5 py-3">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-info" />
                          <span>{bn("ডেলিভারি খরচ", "Delivery Cost")}</span>
                        </div>
                        <span>-{t("currency")}{summary.total_delivery.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-warning" />
                          <span>{bn("অ্যাফিলিয়েট কমিশন", "Affiliate Commission")}</span>
                        </div>
                        <span>-{t("currency")}{summary.total_commissions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-3.5 w-3.5 text-destructive" />
                          <span>{bn("মার্কেটিং খরচ", "Marketing Expenses")}</span>
                        </div>
                        <span>-{t("currency")}{totalMarketing.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className={`flex justify-between py-4 border-t-2 mt-4 px-4 rounded-lg ${netProfit >= 0 ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}`}>
                      <div>
                        <p className={`font-bold text-lg ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                          {bn("নিট মুনাফা (Net Profit)", "Net Profit")}
                        </p>
                        <p className="text-xs text-muted-foreground">{bn("সব খরচ বাদ দেওয়ার পর", "After all expenses")}</p>
                      </div>
                      <div className={`text-2xl font-black ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                        {netProfit < 0 ? "-" : ""}{t("currency")}{Math.abs(netProfit).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">{bn("মুনাফার হার", "Profit Margin")}</p>
                        <p className={`text-xl font-bold mt-1 ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                          {summary.total_sales > 0 ? ((netProfit / summary.total_sales) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">{bn("মোট অর্ডার", "Total Orders")}</p>
                        <p className="text-xl font-bold mt-1">{summary.total_orders}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!summary && !isLoading && (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          {bn("এই সময়কালে কোনো ডেটা নেই", "No data found for the selected period")}
        </div>
      )}
    </div>
  );
};
