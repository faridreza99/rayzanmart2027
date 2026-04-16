import { useState, ReactNode } from "react";
import {
  UserCheck,
  UserX,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnterpriseConfirmDialog } from "./EnterpriseConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAllAffiliates, useUpdateAffiliateStatus } from "@/hooks/useAffiliate";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateWithProfile {
  id: string;
  user_id: string;
  referral_code: string;
  payment_method: string;
  payment_details: string | null;
  website_url: string | null;
  marketing_plan: string | null;
  status: "pending" | "active" | "inactive" | "approved" | "rejected";
  commission_rate: number;
  tier: string;
  total_clicks: number;
  total_sales: number;
  total_commission: number;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

export const AffiliateApplicationsPanel = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: affiliates, isLoading } = useAllAffiliates();
  const updateStatus = useUpdateAffiliateStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateWithProfile | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredAffiliates = ((affiliates as any) || []).filter((aff: any) => {
    const matchesSearch =
      aff.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aff.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aff.referral_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || aff.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) as AffiliateWithProfile[];

  const pendingCount = ((affiliates as any) || []).filter(
    (a: any) => a.status === "pending"
  ).length;

  const handleApprove = async () => {
    if (!selectedAffiliate) return;

    try {
      // Single backend call: updates status, assigns role, sends approval email atomically
      const token = localStorage.getItem("rm_auth_token");
      const response = await fetch("/api/auth/approve-affiliate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ affiliate_id: selectedAffiliate.id }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Approval failed");
      }

      // Refresh affiliate list in the UI
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });

      toast.success(
        language === "bn"
          ? "অ্যাফিলিয়েট অনুমোদন করা হয়েছে এবং ইমেইল পাঠানো হয়েছে"
          : "Affiliate approved and notification email sent"
      );
      setShowApproveConfirm(false);
      setShowDetailsDialog(false);
      setSelectedAffiliate(null);
    } catch (err: any) {
      console.error("[AffiliatePanel] Error in handleApprove:", err);
      toast.error(err.message || t("somethingWentWrong"));
    }
  };

  const handleReject = async () => {
    if (!selectedAffiliate) return;
    try {
      await updateStatus.mutateAsync({
        affiliateId: selectedAffiliate.id,
        status: "inactive",
      });
      toast.success(
        language === "bn"
          ? "অ্যাফিলিয়েট আবেদন প্রত্যাখ্যান করা হয়েছে"
          : "Affiliate application rejected"
      );
      setShowRejectConfirm(false);
      setShowDetailsDialog(false);
      setSelectedAffiliate(null);
      setRejectionReason("");
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleSuspend = async () => {
    if (!selectedAffiliate) return;
    try {
      await updateStatus.mutateAsync({
        affiliateId: selectedAffiliate.id,
        status: "inactive",
      });
      toast.success(
        language === "bn"
          ? "অ্যাফিলিয়েট স্থগিত করা হয়েছে"
          : "Affiliate suspended"
      );
      setShowSuspendConfirm(false);
      setShowDetailsDialog(false);
      setSelectedAffiliate(null);
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleReactivate = async (affiliate: AffiliateWithProfile) => {
    try {
      await updateStatus.mutateAsync({
        affiliateId: affiliate.id,
        status: "active",
      });
      toast.success(
        language === "bn"
          ? "অ্যাফিলিয়েট পুনরায় সক্রিয় করা হয়েছে"
          : "Affiliate reactivated"
      );
    } catch (error) {
      toast.error(t("somethingWentWrong"));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-warning text-warning">
            <Clock className="mr-1 h-3 w-3" />
            {language === "bn" ? "অনুমোদনের অপেক্ষায়" : "Pending Approval"}
          </Badge>
        );
      case "active":
      case "approved":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {language === "bn" ? "অনুমোদিত" : "Approved"}
          </Badge>
        );
      case "inactive":
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            {language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {pendingCount > 0 && (
        <Alert className="border-warning bg-warning/10">
          <Clock className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            {language === "bn"
              ? `${pendingCount}টি অ্যাফিলিয়েট আবেদন অনুমোদনের অপেক্ষায় রয়েছে`
              : `${pendingCount} affiliate application(s) pending approval`}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={language === "bn" ? "অ্যাফিলিয়েট খুঁজুন..." : "Search affiliates..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === "bn" ? "স্ট্যাটাস ফিল্টার" : "Filter by status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সব স্ট্যাটাস" : "All Statuses"}</SelectItem>
              <SelectItem value="pending">{language === "bn" ? "অনুমোদনের অপেক্ষায়" : "Pending"}</SelectItem>
              <SelectItem value="active">{language === "bn" ? "অনুমোদিত" : "Approved"}</SelectItem>
              <SelectItem value="inactive">{language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Affiliates Table */}
      {filteredAffiliates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="rounded-full bg-muted/50 p-4 mb-4">
            <UserCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {language === "bn" ? "কোনো অ্যাফিলিয়েট আবেদন নেই" : "No affiliate applications"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {language === "bn"
              ? "গ্রাহকরা অ্যাফিলিয়েট হিসেবে আবেদন করলে এখানে দেখা যাবে।"
              : "When customers apply to become affiliates, they will appear here."}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{language === "bn" ? "আবেদনকারীর নাম" : "Applicant Name"}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{language === "bn" ? "রেফারেল কোড" : "Referral Code"}</TableHead>
                    <TableHead>{t("paymentMethod")}</TableHead>
                    <TableHead>{language === "bn" ? "আবেদনের তারিখ" : "Application Date"}</TableHead>
                    <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                    <TableHead className="text-right">{t("action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell className="font-medium">
                        {affiliate.profiles?.name || "-"}
                      </TableCell>
                      <TableCell>{affiliate.profiles?.email || "-"}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-0.5 text-sm">
                          {affiliate.referral_code}
                        </code>
                      </TableCell>
                      <TableCell className="uppercase">
                        {affiliate.payment_method}
                      </TableCell>
                      <TableCell>
                        {new Date(affiliate.created_at).toLocaleDateString(
                          language === "bn" ? "bn-BD" : "en-US"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAffiliate(affiliate);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            {t("view")}
                          </Button>
                          {affiliate.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-success hover:bg-success/90"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate);
                                  setShowApproveConfirm(true);
                                }}
                              >
                                <UserCheck className="mr-1 h-3 w-3" />
                                {language === "bn" ? "অনুমোদন" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate);
                                  setShowRejectConfirm(true);
                                }}
                              >
                                <UserX className="mr-1 h-3 w-3" />
                                {language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                              </Button>
                            </>
                          )}
                          {affiliate.status === "inactive" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReactivate(affiliate)}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              {language === "bn" ? "পুনরায় সক্রিয়" : "Reactivate"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "অ্যাফিলিয়েট বিবরণ" : "Affiliate Details"}</DialogTitle>
            <DialogDescription>{language === "bn" ? "অ্যাফিলিয়েট আবেদন পর্যালোচনা করুন" : "Review affiliate application"}</DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{t("name")}</Label>
                  <p className="font-medium">{selectedAffiliate.profiles?.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("email")}</Label>
                  <p className="font-medium">{selectedAffiliate.profiles?.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("paymentMethod")}</Label>
                  <p className="font-medium uppercase">{selectedAffiliate.payment_method}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{language === "bn" ? "পেমেন্ট বিবরণ" : "Payment Details"}</Label>
                  <p className="font-medium">{selectedAffiliate.payment_details || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{language === "bn" ? "রেফারেল কোড" : "Referral Code"}</Label>
                  <code className="rounded bg-muted px-2 py-0.5">
                    {selectedAffiliate.referral_code}
                  </code>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{language === "bn" ? "আবেদনের তারিখ" : "Application Date"}</Label>
                  <p className="font-medium">
                    {new Date(selectedAffiliate.created_at).toLocaleDateString(
                      language === "bn" ? "bn-BD" : "en-US"
                    )}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">{language === "bn" ? "সোশ্যাল / ওয়েবসাইট লিংক" : "Social / Website Link"}</Label>
                <p className="font-medium text-primary">
                  <a href={selectedAffiliate.website_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                    {selectedAffiliate.website_url || "-"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">{language === "bn" ? "প্রচার পরিকল্পনা" : "Promotion Plan"}</Label>
                <div className="rounded-md bg-muted/50 p-3 text-sm italic">
                  {selectedAffiliate.marketing_plan || "-"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">{language === "bn" ? "বর্তমান স্ট্যাটাস" : "Current Status"}:</Label>
                {getStatusBadge(selectedAffiliate.status)}
              </div>

              {selectedAffiliate.status === "active" && (
                <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted p-4">
                  <div className="text-center">
                    <p className="text-lg font-bold">{selectedAffiliate.total_clicks}</p>
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "ক্লিক" : "Clicks"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-success">
                      ৳{Number(selectedAffiliate.total_commission).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("commission")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      ৳{Number(selectedAffiliate.total_sales).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "বিক্রয়" : "Sales"}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selectedAffiliate?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectConfirm(true)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  {language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                </Button>
                <Button
                  className="bg-success hover:bg-success/90"
                  onClick={() => setShowApproveConfirm(true)}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  {language === "bn" ? "অনুমোদন" : "Approve"}
                </Button>
              </>
            )}
            {selectedAffiliate?.status === "active" && (
              <Button
                variant="destructive"
                onClick={() => setShowSuspendConfirm(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {language === "bn" ? "অ্যাফিলিয়েট স্থগিত করুন" : "Suspend Affiliate"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <EnterpriseConfirmDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        title={language === "bn" ? "অনুমোদন নিশ্চিত করুন" : "Confirm Approval"}
        description={language === "bn" ? "আপনি কি এই অ্যাফিলিয়েট আবেদন অনুমোদন করতে চান?" : "Are you sure you want to approve this affiliate application?"}
        confirmLabel={language === "bn" ? "অনুমোদন করুন" : "Approve"}
        onConfirm={handleApprove}
        type="success"
        impacts={[
          { label: language === "bn" ? "ড্যাশবোর্ড অ্যাক্সেস" : "Dashboard Access", value: language === "bn" ? "সক্রিয়" : "Enabled", type: "positive" },
          { label: language === "bn" ? "রেফারেল লিংক" : "Referral Link", value: language === "bn" ? "সক্রিয়" : "Active", type: "positive" },
        ]}
      />

      {/* Reject Confirmation */}
      <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "প্রত্যাখ্যান নিশ্চিত করুন" : "Confirm Rejection"}</DialogTitle>
            <DialogDescription>{language === "bn" ? "এই অ্যাফিলিয়েট আবেদন প্রত্যাখ্যান করতে চান?" : "Do you want to reject this affiliate application?"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {language === "bn"
                  ? "এই ব্যবহারকারী অ্যাফিলিয়েট সুবিধা পাবেন না। তবে সাধারণ কাস্টমার হিসেবে থাকবেন।"
                  : "This user will not receive affiliate privileges. They will remain a regular customer."}
              </AlertDescription>
            </Alert>
            <div>
              <Label>{language === "bn" ? "প্রত্যাখ্যানের কারণ" : "Rejection Reason"} ({language === "bn" ? "ঐচ্ছিক" : "optional"})</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={
                  language === "bn"
                    ? "প্রত্যাখ্যানের কারণ লিখুন..."
                    : "Enter reason for rejection..."
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectConfirm(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <UserX className="mr-2 h-4 w-4" />
              {language === "bn" ? "প্রত্যাখ্যান নিশ্চিত" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation */}
      <EnterpriseConfirmDialog
        open={showSuspendConfirm}
        onOpenChange={setShowSuspendConfirm}
        title={language === "bn" ? "স্থগিত নিশ্চিত করুন" : "Confirm Suspension"}
        description={language === "bn" ? "এই অ্যাফিলিয়েটকে স্থগিত করতে চান?" : "Do you want to suspend this affiliate?"}
        confirmLabel={language === "bn" ? "স্থগিত করুন" : "Suspend"}
        onConfirm={handleSuspend}
        type="destructive"
        impacts={[
          { label: language === "bn" ? "রেফারেল লিংক" : "Referral Link", value: language === "bn" ? "নিষ্ক্রিয়" : "Disabled", type: "negative" },
          { label: language === "bn" ? "কমিশন আয়" : "Commission Earnings", value: language === "bn" ? "বন্ধ" : "Stopped", type: "negative" },
        ]}
      />
    </div>
  );
};