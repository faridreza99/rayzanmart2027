import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  TrendingUp,
  Clock,
  Search,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  ShoppingBag,
  Wallet,
  Gift,
  AlertCircle,
  KeyRound,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

const API_BASE = "/api";

async function apiFetch(path: string) {
  const token = localStorage.getItem("rm_auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function money(val: any) {
  const n = parseFloat(val) || 0;
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pts(val: any) {
  return parseInt(val || "0").toLocaleString();
}

function dt(val: any) {
  if (!val) return "—";
  try { return format(new Date(val), "dd MMM yyyy, hh:mm a"); }
  catch { return "—"; }
}

interface Summary {
  affiliate: {
    total_paid_commission: string;
    total_earned_commission: string;
    total_pending_commission: string;
    total_affiliates: string;
  };
  loyalty: {
    total_points_earned: string;
    total_points_redeemed: string;
    total_amount_earned: string;
    users_with_loyalty: string;
  };
  total_users: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  is_blocked: boolean;
  email_confirmed: boolean;
  loyalty_points: number;
  affiliate_total_commission: string;
  affiliate_paid_commission: string;
  affiliate_pending_commission: string;
  referral_code: string | null;
  affiliate_status: string | null;
  loyalty_total_earned: string;
  loyalty_total_redeemed: string;
  loyalty_amount_earned: string;
  login_count: number;
  last_login: string | null;
  total_orders: number;
  total_spent: string;
}

interface LoginLog {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const PAGE_SIZE = 15;

export const UserReport = () => {
  const { language } = useLanguage();
  const bn = language === "bn";
  const qc = useQueryClient();

  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  // Password change state
  const [pwUser, setPwUser]       = useState<UserRow | null>(null);
  const [pwOpen, setPwOpen]       = useState(false);
  const [newPw, setNewPw]         = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Password reveal state
  const [revealedPw, setRevealedPw]   = useState<Record<string, string | null>>({});
  const [revealLoading, setRevealLoading] = useState<string | null>(null);

  const handleRevealPassword = async (userId: string) => {
    if (revealedPw[userId] !== undefined) {
      setRevealedPw(prev => { const n = { ...prev }; delete n[userId]; return n; });
      return;
    }
    setRevealLoading(userId);
    try {
      const token = localStorage.getItem("rm_auth_token");
      const res = await fetch(`/api/user-reports/users/${userId}/password`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRevealedPw(prev => ({ ...prev, [userId]: data.plain_password || null }));
    } catch {
      toast.error(bn ? "পাসওয়ার্ড লোড ব্যর্থ হয়েছে" : "Failed to load password");
    } finally {
      setRevealLoading(null);
    }
  };

  const summaryQ = useQuery<Summary>({
    queryKey: ["ur-summary"],
    queryFn: () => apiFetch("/user-reports/summary"),
  });

  const usersQ = useQuery<{ users: UserRow[]; total: number }>({
    queryKey: ["ur-users", page, search, dateFrom, dateTo],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search)   p.set("search", search);
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);
      return apiFetch(`/user-reports/users?${p}`);
    },
  });

  const logsQ = useQuery<{ logs: LoginLog[] }>({
    queryKey: ["ur-logs", selected?.id],
    queryFn: () => apiFetch(`/user-reports/login-logs/${selected?.id}`),
    enabled: !!selected && logsOpen,
  });

  const totalPages = Math.ceil((usersQ.data?.total || 0) / PAGE_SIZE);
  const s = summaryQ.data;

  /* ── PDF Export ── */
  const exportPDF = async () => {
    const { default: jsPDF }    = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16); doc.setTextColor(230, 81, 0);
    doc.text("Rayzan Mart", 14, 16);
    doc.setFontSize(12); doc.setTextColor(30, 30, 30);
    doc.text(bn ? "ইউজার ইনফরমেশন রিপোর্ট" : "User Information Report", 14, 24);
    doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(`${bn ? "তারিখ" : "Date"}: ${format(new Date(), "dd MMM yyyy")}`, 14, 31);

    autoTable(doc, {
      startY: 36,
      head: [[
        "#",
        bn ? "নাম" : "Name",
        bn ? "ইমেইল" : "Email",
        bn ? "ফোন" : "Phone",
        bn ? "মোট অর্ডার" : "Orders",
        bn ? "মোট ব্যয়" : "Spent",
        bn ? "অ্যাফিলিয়েট আয়" : "Aff. Earned",
        bn ? "পেন্ডিং কমিশন" : "Aff. Pending",
        bn ? "পেইড কমিশন" : "Aff. Paid",
        bn ? "লয়্যালটি পয়েন্ট" : "Loyalty Pts",
        bn ? "সর্বশেষ লগইন" : "Last Login",
      ]],
      body: (usersQ.data?.users || []).map((u, i) => [
        (page - 1) * PAGE_SIZE + i + 1,
        u.name || "—",
        u.email,
        u.phone || "—",
        u.total_orders,
        money(u.total_spent),
        money(u.affiliate_total_commission),
        money(u.affiliate_pending_commission),
        money(u.affiliate_paid_commission),
        pts(u.loyalty_points),
        dt(u.last_login),
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [230, 81, 0], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 245, 235] },
    });

    doc.save(`user-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  /* ── Excel Export ── */
  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = (usersQ.data?.users || []).map((u, i) => ({
      "#": (page - 1) * PAGE_SIZE + i + 1,
      [bn ? "নাম" : "Name"]: u.name || "",
      [bn ? "ইমেইল" : "Email"]: u.email,
      [bn ? "ফোন" : "Phone"]: u.phone || "",
      [bn ? "পাসওয়ার্ড" : "Password"]: "••••••••",
      [bn ? "মোট অর্ডার" : "Total Orders"]: u.total_orders,
      [bn ? "মোট ব্যয়" : "Total Spent"]: parseFloat(u.total_spent) || 0,
      [bn ? "অ্যাফিলিয়েট আয়" : "Affiliate Earned"]: parseFloat(u.affiliate_total_commission) || 0,
      [bn ? "পেন্ডিং কমিশন" : "Affiliate Pending"]: parseFloat(u.affiliate_pending_commission) || 0,
      [bn ? "পেইড কমিশন" : "Affiliate Paid"]: parseFloat(u.affiliate_paid_commission) || 0,
      [bn ? "অ্যাফিলিয়েট স্ট্যাটাস" : "Affiliate Status"]: u.affiliate_status || "",
      [bn ? "লয়্যালটি পয়েন্ট" : "Loyalty Points"]: u.loyalty_points || 0,
      [bn ? "লয়্যালটি অর্জিত" : "Loyalty Earned (pts)"]: parseInt(u.loyalty_total_earned) || 0,
      [bn ? "লয়্যালটি রিডিম" : "Loyalty Redeemed (pts)"]: parseInt(u.loyalty_total_redeemed) || 0,
      [bn ? "লয়্যালটি টাকা" : "Loyalty (৳)"]: parseFloat(u.loyalty_amount_earned) || 0,
      [bn ? "লগইন সংখ্যা" : "Login Count"]: u.login_count,
      [bn ? "সর্বশেষ লগইন" : "Last Login"]: dt(u.last_login),
      [bn ? "নিবন্ধন তারিখ" : "Registered"]: dt(u.created_at),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Report");
    ws["!cols"] = Array(18).fill({ wch: 20 });
    XLSX.writeFile(wb, `user-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  /* ── Change Password ── */
  const handleChangePassword = async () => {
    if (!pwUser) return;
    if (!newPw || newPw.length < 6) {
      toast.error(bn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("rm_auth_token");
      const res = await fetch(`/api/user-reports/users/${pwUser.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPw }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success(bn
        ? `${pwUser.name || pwUser.email}-এর পাসওয়ার্ড পরিবর্তন হয়েছে`
        : `Password changed for ${pwUser.name || pwUser.email}`
      );
      setPwOpen(false);
      setNewPw("");
      setShowPw(false);
    } catch (err: any) {
      toast.error(err.message || (bn ? "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে" : "Failed to change password"));
    } finally {
      setPwLoading(false);
    }
  };

  const affiliateStatusColor: Record<string, string> = {
    active:   "bg-green-100 text-green-800",
    approved: "bg-blue-100 text-blue-800",
    pending:  "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
    inactive: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {bn ? "ইউজার ইনফরমেশন রিপোর্ট" : "User Information Report"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {bn
            ? "ব্যবহারকারী, অ্যাফিলিয়েট ও লয়্যালটি ডেটার বিস্তারিত প্রতিবেদন"
            : "Detailed report of users, affiliate commissions, and loyalty data"}
        </p>
      </div>

      {summaryQ.isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {bn ? "সারসংক্ষেপ লোড করতে ব্যর্থ হয়েছে।" : "Failed to load summary. Please refresh."}
        </div>
      )}

      {/* ── 6 Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">

        {/* Card 1: Total Users */}
        <Card className="border-l-4 border-l-slate-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {bn ? "মোট ব্যবহারকারী" : "Total Users"}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {summaryQ.isLoading ? "—" : parseInt(s?.total_users || "0").toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? "নিবন্ধিত অ্যাকাউন্ট" : "Registered accounts"}
                </p>
              </div>
              <div className="rounded-full bg-slate-100 p-2.5">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Affiliate Earned */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {bn ? "মোট অ্যাফিলিয়েট আয়" : "Total Affiliate Earned"}
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {summaryQ.isLoading ? "—" : money(s?.affiliate.total_earned_commission)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? "সব অ্যাফিলিয়েট মিলে" : "Across all affiliates"}
                  {" · "}{s?.affiliate.total_affiliates || 0} {bn ? "সক্রিয়" : "active"}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pending Affiliate */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {bn ? "পেন্ডিং অ্যাফিলিয়েট" : "Pending Affiliate"}
                </p>
                <p className="text-2xl font-bold text-yellow-700 mt-1">
                  {summaryQ.isLoading ? "—" : money(s?.affiliate.total_pending_commission)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? "পরিশোধের অপেক্ষায়" : "Awaiting payment"}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-2.5">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Paid Affiliate */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {bn ? "পেইড অ্যাফিলিয়েট" : "Paid Affiliate"}
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {summaryQ.isLoading ? "—" : money(s?.affiliate.total_paid_commission)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? "সফলভাবে পরিশোধ" : "Successfully paid out"}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-2.5">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Loyalty Points */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {bn ? "মোট লয়্যালটি পয়েন্ট" : "Total Loyalty Points"}
                </p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {summaryQ.isLoading ? "—" : pts(s?.loyalty.total_points_earned)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? "রিডিম:" : "Redeemed:"} {pts(s?.loyalty.total_points_redeemed)}
                  {" · "}{s?.loyalty.users_with_loyalty || 0} {bn ? "ইউজার" : "users"}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-2.5">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Loyalty ৳ Value */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {bn ? "লয়্যালটি টাকার মান" : "Loyalty ৳ Value"}
                </p>
                <p className="text-2xl font-bold text-orange-700 mt-1">
                  {summaryQ.isLoading ? "—" : money(s?.loyalty.total_amount_earned)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? "মোট অর্জিত লয়্যালটি মূল্য" : "Total loyalty monetary value"}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-2.5">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters + Export ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {bn ? "কাস্টমার ডেটা রিপোর্ট" : "Customer Data Report"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Row 1: Search + Dates + Action buttons */}
          <div className="flex flex-wrap gap-2 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs text-muted-foreground mb-1">
                {bn ? "নাম / ইমেইল / ফোন" : "Name / Email / Phone"}
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={bn ? "অনুসন্ধান করুন..." : "Search..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); usersQ.refetch(); } }}
                />
              </div>
            </div>

            {/* Date From */}
            <div className="min-w-[140px]">
              <p className="text-xs text-muted-foreground mb-1">{bn ? "তারিখ থেকে" : "Date From"}</p>
              <Input type="date" className="h-9 text-sm" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>

            {/* Date To */}
            <div className="min-w-[140px]">
              <p className="text-xs text-muted-foreground mb-1">{bn ? "তারিখ পর্যন্ত" : "Date To"}</p>
              <Input type="date" className="h-9 text-sm" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>

            <Button size="sm" onClick={() => { setPage(1); usersQ.refetch(); }}>
              <Search className="mr-1.5 h-3.5 w-3.5" />
              {bn ? "খুঁজুন" : "Search"}
            </Button>

            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setPage(1); }}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              {bn ? "রিসেট" : "Reset"}
            </Button>
          </div>

          {/* Row 2: Export buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportExcel}
              disabled={usersQ.isLoading}
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              {bn ? "Excel ডাউনলোড" : "Download Excel"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportPDF}
              disabled={usersQ.isLoading}
              className="border-red-400 text-red-700 hover:bg-red-50"
            >
              <FileText className="mr-1.5 h-4 w-4" />
              {bn ? "PDF ডাউনলোড" : "Download PDF"}
            </Button>
          </div>

          {/* ── Table ── */}
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-8 px-2 text-xs whitespace-nowrap">#</TableHead>
                  <TableHead className="text-xs whitespace-nowrap min-w-[130px]">{bn ? "নাম" : "Name"}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap min-w-[160px]">{bn ? "ইমেইল" : "Email"}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{bn ? "ফোন" : "Phone"}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap min-w-[140px]">{bn ? "পাসওয়ার্ড" : "Password"}</TableHead>
                  <TableHead className="text-center text-xs whitespace-nowrap">{bn ? "অর্ডার" : "Orders"}</TableHead>
                  <TableHead className="text-right text-xs whitespace-nowrap">{bn ? "মোট ব্যয়" : "Spent"}</TableHead>
                  <TableHead className="text-right text-xs whitespace-nowrap">{bn ? "অ্যাফি. আয়" : "Aff. Earned"}</TableHead>
                  <TableHead className="text-right text-xs whitespace-nowrap">{bn ? "পেন্ডিং" : "Pending"}</TableHead>
                  <TableHead className="text-right text-xs whitespace-nowrap">{bn ? "পেইড" : "Paid"}</TableHead>
                  <TableHead className="text-right text-xs whitespace-nowrap">{bn ? "পয়েন্ট" : "Points"}</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">{bn ? "সর্বশেষ লগইন" : "Last Login"}</TableHead>
                  <TableHead className="text-center text-xs whitespace-nowrap">{bn ? "কার্যক্রম" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQ.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      {bn ? "লোড হচ্ছে..." : "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : usersQ.isError ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-12 text-red-500">
                      <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                      {bn ? "ডেটা লোড করতে ব্যর্থ হয়েছে।" : "Failed to load data."}
                    </TableCell>
                  </TableRow>
                ) : (usersQ.data?.users || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                      {bn ? "কোনো ডেটা পাওয়া যায়নি।" : "No data found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  (usersQ.data?.users || []).map((u, i) => (
                    <TableRow key={u.id} className="hover:bg-muted/20 text-xs">
                      <TableCell className="text-muted-foreground px-2">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {(u.name || u.email)?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium leading-tight truncate max-w-[110px]">{u.name || "—"}</p>
                            {u.is_blocked && (
                              <span className="text-[10px] text-red-500">{bn ? "ব্লকড" : "Blocked"}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2">
                        <span className="block truncate max-w-[160px]" title={u.email}>{u.email}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2 whitespace-nowrap">{u.phone || "—"}</TableCell>
                      <TableCell className="py-2">
                        {/* Case: not yet fetched */}
                        {revealedPw[u.id] === undefined && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-muted-foreground select-none text-xs">••••••••</span>
                            <button
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title={bn ? "পাসওয়ার্ড দেখুন" : "Show password"}
                              onClick={() => handleRevealPassword(u.id)}
                            >
                              {revealLoading === u.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Eye className="h-3 w-3" />
                              }
                            </button>
                          </div>
                        )}
                        {/* Case: fetched and has value */}
                        {revealedPw[u.id] !== undefined && revealedPw[u.id] !== null && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-green-700 font-medium select-all">{revealedPw[u.id]}</span>
                            <button
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title={bn ? "লুকান" : "Hide"}
                              onClick={() => setRevealedPw(prev => { const n = { ...prev }; delete n[u.id]; return n; })}
                            >
                              <EyeOff className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* Case: fetched but null — prompt to set password */}
                        {revealedPw[u.id] !== undefined && revealedPw[u.id] === null && (
                          <button
                            className="flex items-center gap-1 text-[10px] text-orange-600 hover:text-orange-700 border border-orange-300 rounded px-1.5 py-0.5 hover:bg-orange-50 transition-colors"
                            title={bn ? "পাসওয়ার্ড সেট করুন" : "Set password to save it"}
                            onClick={() => { setPwUser(u); setNewPw(""); setShowPw(false); setPwOpen(true); setRevealedPw(prev => { const n = { ...prev }; delete n[u.id]; return n; }); }}
                          >
                            <KeyRound className="h-2.5 w-2.5" />
                            {bn ? "পাসওয়ার্ড সেট করুন" : "Set password"}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{u.total_orders}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium py-2 whitespace-nowrap">{money(u.total_spent)}</TableCell>
                      <TableCell className="text-right py-2">
                        <div>
                          <p className="font-medium text-blue-700 whitespace-nowrap">{money(u.affiliate_total_commission)}</p>
                          {u.affiliate_status && (
                            <span className={`text-[10px] px-1 py-0.5 rounded-full font-medium ${affiliateStatusColor[u.affiliate_status] || "bg-gray-100 text-gray-600"}`}>
                              {u.affiliate_status}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-yellow-700 py-2 whitespace-nowrap">
                        {parseFloat(u.affiliate_pending_commission) > 0
                          ? money(u.affiliate_pending_commission)
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-700 py-2 whitespace-nowrap">
                        {parseFloat(u.affiliate_paid_commission) > 0
                          ? money(u.affiliate_paid_commission)
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div>
                          <p className="font-medium text-purple-700">{pts(u.loyalty_points)}</p>
                          {parseFloat(u.loyalty_amount_earned) > 0 && (
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap">{money(u.loyalty_amount_earned)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2">
                        {u.last_login ? (
                          <div className="whitespace-nowrap">
                            <p>{dt(u.last_login)}</p>
                            <p className="text-[10px]">{bn ? "লগইন:" : "Logins:"} {u.login_count}</p>
                          </div>
                        ) : (
                          <span className="italic whitespace-nowrap">{bn ? "লগইন নেই" : "No login"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            title={bn ? "পাসওয়ার্ড পরিবর্তন" : "Change Password"}
                            onClick={() => { setPwUser(u); setNewPw(""); setShowPw(false); setPwOpen(true); }}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            title={bn ? "লগইন ইতিহাস" : "Login History"}
                            onClick={() => { setSelected(u); setLogsOpen(true); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {bn
                  ? `মোট ${usersQ.data?.total || 0} জন ব্যবহারকারী`
                  : `Total ${usersQ.data?.total || 0} users`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Change Password Modal ── */}
      <Dialog open={pwOpen} onOpenChange={(o) => { if (!pwLoading) { setPwOpen(o); if (!o) { setNewPw(""); setShowPw(false); } } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {bn ? "পাসওয়ার্ড পরিবর্তন" : "Change Password"}
            </DialogTitle>
          </DialogHeader>
          {pwUser && (
            <div className="space-y-4 py-2">
              {/* User info */}
              <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {(pwUser.name || pwUser.email)?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-sm">{pwUser.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{pwUser.email}</p>
                </div>
              </div>

              {/* New password field */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {bn ? "নতুন পাসওয়ার্ড" : "New Password"}
                </Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder={bn ? "নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)" : "Enter new password (min 6 chars)"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                    disabled={pwLoading}
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw((s) => !s)}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPw.length > 0 && newPw.length < 6 && (
                  <p className="text-xs text-red-500">
                    {bn ? "কমপক্ষে ৬ অক্ষর দিতে হবে" : "Minimum 6 characters required"}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwLoading}>
              {bn ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={pwLoading || newPw.length < 6}
              className="bg-primary"
            >
              {pwLoading ? (
                <><RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />{bn ? "সংরক্ষণ হচ্ছে..." : "Saving..."}</>
              ) : (
                <><KeyRound className="mr-1.5 h-4 w-4" />{bn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Change Password"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Login History Modal ── */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {bn ? "লগইন ইতিহাস" : "Login History"}
              {selected && (
                <span className="font-normal text-muted-foreground">— {selected.name || selected.email}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>{bn ? "ইভেন্ট" : "Event"}</TableHead>
                  <TableHead>{bn ? "তারিখ ও সময়" : "Date & Time"}</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsQ.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      {bn ? "লোড হচ্ছে..." : "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : (logsQ.data?.logs || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {bn ? "কোনো লগইন ডেটা পাওয়া যায়নি।" : "No login history found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  (logsQ.data?.logs || []).map((log, i) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <Badge
                          className={log.event_type === "login"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-100"}
                        >
                          {log.event_type === "login"
                            ? (bn ? "লগইন" : "Login")
                            : (bn ? "লগআউট" : "Logout")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{dt(log.created_at)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.ip_address || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
