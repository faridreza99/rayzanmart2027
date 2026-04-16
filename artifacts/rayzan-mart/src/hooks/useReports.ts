import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "/api/reports";

async function fetchReport(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => !!v)));
  const res = await fetch(`${API_BASE}${path}${qs.toString() ? "?" + qs : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface ReportSummary {
  total_sales: number;
  total_cost: number;
  total_delivery: number;
  total_commissions: number;
  total_marketing: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  total_orders: number;
  affiliate_orders: number;
  direct_orders: number;
  affiliate_sales: number;
  direct_sales: number;
  avg_order_value: number;
  order_status: { status: string; count: number; total: number }[];
}

export interface DailyReport {
  date: string;
  revenue: number;
  cost: number;
  delivery: number;
  commissions: number;
  profit: number;
  orders: number;
}

export interface AffiliateReport {
  id: string;
  referral_code: string;
  name: string;
  email: string;
  order_count: number;
  total_sales: number;
  total_commission: number;
  total_clicks: number;
  conversion_rate: number;
}

export interface ProductReport {
  product_id: string;
  name_en: string;
  name_bn: string;
  category: string;
  total_qty: number;
  total_sales: number;
  total_cost: number;
  profit: number;
  order_count: number;
}

function useToken() {
  const { session } = useAuth();
  return (session as any)?.access_token as string | undefined;
}

export function useReportSummary(start?: string, end?: string) {
  const token = useToken();
  return useQuery<ReportSummary>({
    queryKey: ["reports", "summary", start, end],
    queryFn: () => fetchReport("/summary", token!, { start: start || "", end: end || "" }),
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useReportDaily(start?: string, end?: string) {
  const token = useToken();
  return useQuery<DailyReport[]>({
    queryKey: ["reports", "daily", start, end],
    queryFn: () => fetchReport("/daily", token!, { start: start || "", end: end || "" }),
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useReportAffiliates(start?: string, end?: string) {
  const token = useToken();
  return useQuery<AffiliateReport[]>({
    queryKey: ["reports", "affiliates", start, end],
    queryFn: () => fetchReport("/affiliates", token!, { start: start || "", end: end || "" }),
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useReportProducts(start?: string, end?: string) {
  const token = useToken();
  return useQuery<ProductReport[]>({
    queryKey: ["reports", "products", start, end],
    queryFn: () => fetchReport("/products", token!, { start: start || "", end: end || "" }),
    enabled: !!token,
    staleTime: 30_000,
  });
}
