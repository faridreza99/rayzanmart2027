import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Search, RefreshCw, Loader2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import apiClient from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Commission {
  id: string;
  affiliate_id: string;
  order_id: string;
  amount: number;
  commission_type: string;
  status: "pending" | "approved" | "rejected" | "paid";
  product_name_bn: string;
  product_name_en: string;
  unit_price: number;
  created_at: string;
  affiliate_name?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusIcons: Record<string, JSX.Element> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
  paid: <TrendingUp className="h-3.5 w-3.5" />,
};

export const CommissionsManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: commissions = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("commissions")
        .select(`*, orders(notes), affiliates(user_id, profiles(name))`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data || []).map((c: any) => ({
        ...c,
        affiliate_name: c.affiliates?.profiles?.name || c.affiliate_id?.slice(0, 8),
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, affiliateId, amount, oldStatus }: {
      id: string; status: string; affiliateId: string; amount: number; oldStatus: string;
    }) => {
      const { error } = await apiClient
        .from("commissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      // Update affiliate pending_commission counter when approving
      if (status === "approved" && oldStatus === "pending") {
        const token = localStorage.getItem("rm_auth_token");
        await fetch(`/api/db/affiliates?id=eq.${affiliateId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            pending_commission: Math.max(0, -amount), // will be recalculated via RPC anyway
          }),
        }).catch(() => {}); // non-critical
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success(language === "bn" ? "কমিশন আপডেট হয়েছে" : "Commission updated");
    },
    onError: (err: any) => {
      toast.error(err.message || (language === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Update failed"));
    },
  });

  const handleApprove = (c: Commission) => {
    updateStatus.mutate({ id: c.id, status: "approved", affiliateId: c.affiliate_id, amount: c.amount, oldStatus: c.status });
  };

  const handleReject = (c: Commission) => {
    updateStatus.mutate({ id: c.id, status: "rejected", affiliateId: c.affiliate_id, amount: c.amount, oldStatus: c.status });
  };

  const filtered = commissions.filter((c: Commission) => {
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchSearch =
      !search ||
      c.product_name_bn?.toLowerCase().includes(search.toLowerCase()) ||
      c.product_name_en?.toLowerCase().includes(search.toLowerCase()) ||
      c.affiliate_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.order_id?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = commissions.filter((c: Commission) => c.status === "pending").length;
  const totalPending = commissions
    .filter((c: Commission) => c.status === "pending")
    .reduce((sum: number, c: Commission) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {language === "bn" ? "কমিশন অনুমোদন" : "Commission Approvals"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === "bn"
              ? "অ্যাফিলিয়েটদের কমিশন অনুমোদন বা বাতিল করুন"
              : "Approve or reject affiliate commissions"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          {language === "bn" ? "রিফ্রেশ" : "Refresh"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-700 font-medium">
              {language === "bn" ? "অপেক্ষমান কমিশন" : "Pending Commissions"}
            </p>
            <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
            <p className="text-xs text-yellow-600">৳{totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-xs text-green-700 font-medium">
              {language === "bn" ? "অনুমোদিত" : "Approved"}
            </p>
            <p className="text-2xl font-bold text-green-800">
              {commissions.filter((c: Commission) => c.status === "approved").length}
            </p>
            <p className="text-xs text-green-600">
              ৳{commissions.filter((c: Commission) => c.status === "approved").reduce((s: number, c: Commission) => s + Number(c.amount), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-xs text-blue-700 font-medium">
              {language === "bn" ? "মোট কমিশন" : "Total Commissions"}
            </p>
            <p className="text-2xl font-bold text-blue-800">{commissions.length}</p>
            <p className="text-xs text-blue-600">
              ৳{commissions.reduce((s: number, c: Commission) => s + Number(c.amount), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={language === "bn" ? "পণ্য / অ্যাফিলিয়েট / অর্ডার খুঁজুন..." : "Search product / affiliate / order..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "bn" ? "সব স্ট্যাটাস" : "All Status"}</SelectItem>
                <SelectItem value="pending">{language === "bn" ? "অপেক্ষমান" : "Pending"}</SelectItem>
                <SelectItem value="approved">{language === "bn" ? "অনুমোদিত" : "Approved"}</SelectItem>
                <SelectItem value="rejected">{language === "bn" ? "বাতিল" : "Rejected"}</SelectItem>
                <SelectItem value="paid">{language === "bn" ? "পেইড" : "Paid"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {language === "bn" ? "কোনো কমিশন পাওয়া যায়নি" : "No commissions found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "bn" ? "পণ্য" : "Product"}</TableHead>
                    <TableHead>{language === "bn" ? "অ্যাফিলিয়েট" : "Affiliate"}</TableHead>
                    <TableHead>{language === "bn" ? "পরিমাণ" : "Amount"}</TableHead>
                    <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                    <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "একশন" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c: Commission) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-[160px]">
                        <p className="font-medium truncate text-sm">
                          {language === "bn" ? c.product_name_bn : c.product_name_en}
                        </p>
                        <p className="text-xs text-muted-foreground">৳{Number(c.unit_price).toFixed(0)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{c.affiliate_name}</p>
                        <p className="text-xs text-muted-foreground">{c.commission_type}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">৳{Number(c.amount).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 text-xs ${statusColors[c.status] || ""}`}>
                          {statusIcons[c.status]}
                          {language === "bn"
                            ? { pending: "অপেক্ষমান", approved: "অনুমোদিত", rejected: "বাতিল", paid: "পেইড" }[c.status]
                            : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 bg-green-600 hover:bg-green-700 text-xs"
                              onClick={() => handleApprove(c)}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                              {language === "bn" ? "অনুমোদন" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => handleReject(c)}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              {language === "bn" ? "বাতিল" : "Reject"}
                            </Button>
                          </div>
                        )}
                        {c.status !== "pending" && (
                          <span className="text-xs text-muted-foreground italic">
                            {language === "bn" ? "সম্পন্ন" : "Done"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              💡 {language === "bn"
                ? `${pendingCount}টি কমিশন অনুমোদনের অপেক্ষায়। অর্ডার "ডেলিভারড" করলে স্বয়ংক্রিয়ভাবে approve হবে।`
                : `${pendingCount} commission(s) awaiting approval. Commissions auto-approve when order is marked "delivered".`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
