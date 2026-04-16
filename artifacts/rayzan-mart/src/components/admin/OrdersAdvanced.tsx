import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Search, Filter, StickyNote, CheckSquare, AlertTriangle, FileText,
  Eye, MapPin, Phone, Mail, CreditCard, Truck, Package, Calendar, Hash,
  User, ClipboardList, Tag, Trash2, CalendarRange, X
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAllOrders, useUpdateOrderStatus, useUpdateOrderDeliveryCost, useDeleteOrder, OrderStatus, Order } from "@/hooks/useOrders";
import { useUpdateOrderNotes, useSiteSettings } from "@/hooks/useAdminSettings";
import { toast } from "sonner";
import { EnterpriseConfirmDialog } from "@/components/admin/EnterpriseConfirmDialog";
import { EnterpriseEmptyState } from "@/components/admin/EnterpriseEmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DatePreset = "all" | "today" | "week" | "month" | "last_month" | "custom";

function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (preset === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (preset === "week") {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (preset === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (preset === "custom" && customFrom && customTo) {
    const from = new Date(customFrom); from.setHours(0, 0, 0, 0);
    const to = new Date(customTo); to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  return { from: null, to: null };
}

export const OrdersAdvanced = () => {
  const { language, t } = useLanguage();
  const { data: orders, isLoading } = useAllOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const updateOrderDeliveryCost = useUpdateOrderDeliveryCost();
  const updateOrderNotes = useUpdateOrderNotes();
  const deleteOrder = useDeleteOrder();
  const { data: siteSettings } = useSiteSettings();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; orderId: string; currentNote: string }>({
    open: false,
    orderId: "",
    currentNote: "",
  });
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("processing");
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [actualDeliveryCost, setActualDeliveryCost] = useState<string>("");

  useEffect(() => {
    if (detailOrder) {
      setActualDeliveryCost(detailOrder.actual_delivery_cost?.toString() || "");
    }
  }, [detailOrder]);

  const { from: dateFrom, to: dateTo } = getDateRange(datePreset, customDateFrom, customDateTo);

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    let matchesDate = true;
    if (dateFrom && dateTo) {
      const orderDate = new Date(order.created_at);
      matchesDate = orderDate >= dateFrom && orderDate <= dateTo;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders?.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders?.map((o) => o.id) || []);
    }
  };

  const handleBulkStatusUpdate = async () => {
    setBulkConfirmOpen(false);
    try {
      for (const orderId of selectedOrders) {
        await updateOrderStatus.mutateAsync({ orderId, status: bulkStatus });
      }
      toast.success(
        language === "bn"
          ? `${selectedOrders.length}টি অর্ডার সফলভাবে আপডেট হয়েছে`
          : `${selectedOrders.length} orders updated successfully`
      );
      setSelectedOrders([]);
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const openBulkConfirm = () => {
    if (selectedOrders.length === 0) return;
    setBulkConfirmOpen(true);
  };

  const handleSaveNote = async () => {
    try {
      await updateOrderNotes.mutateAsync({
        orderId: noteDialog.orderId,
        notes: noteDialog.currentNote,
      });
      toast.success(t("noteSaved"));
      setNoteDialog({ open: false, orderId: "", currentNote: "" });
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteOrder.mutateAsync(deleteConfirmId);
      toast.success(language === "bn" ? "অর্ডার মুছে ফেলা হয়েছে" : "Order deleted successfully");
      setDeleteConfirmId(null);
      if (detailOrder?.id === deleteConfirmId) setDetailOrder(null);
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleUpdateDeliveryCost = async () => {
    if (!detailOrder) return;
    try {
      await updateOrderDeliveryCost.mutateAsync({
        orderId: detailOrder.id,
        actual_delivery_cost: Number(actualDeliveryCost),
      });
      toast.success(language === "bn" ? "ডেলিভারি খরচ আপডেট করা হয়েছে" : "Delivery cost updated");
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning",
    processing: "bg-info",
    shipped: "bg-primary",
    delivered: "bg-success",
    returned: "bg-muted",
    cancelled: "bg-destructive",
  };

  const paymentMethodLabel = (method: string) => {
    if (language === "bn") return method === "cod" ? "ক্যাশ অন ডেলিভারি" : "অনলাইন পেমেন্ট";
    return method === "cod" ? "Cash on Delivery" : "Online Payment";
  };

  const deliveryTypeLabel = (type: string) => {
    if (language === "bn") return type === "inside_city" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে";
    return type === "inside_city" ? "Inside Dhaka" : "Outside Dhaka";
  };

  if (isLoading) {
    return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t("filterOrders")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("overview")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="processing">{t("processing")}</SelectItem>
            <SelectItem value="shipped">{t("shipped")}</SelectItem>
            <SelectItem value="delivered">{t("delivered")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
        {(["all", "today", "week", "month", "last_month", "custom"] as DatePreset[]).map((preset) => {
          const labels: Record<DatePreset, string> = {
            all: language === "bn" ? "সব সময়" : "All Time",
            today: language === "bn" ? "আজ" : "Today",
            week: language === "bn" ? "এই সপ্তাহ" : "This Week",
            month: language === "bn" ? "এই মাস" : "This Month",
            last_month: language === "bn" ? "গত মাস" : "Last Month",
            custom: language === "bn" ? "কাস্টম" : "Custom",
          };
          return (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                datePreset === preset
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {labels[preset]}
            </button>
          );
        })}
        {datePreset !== "all" && (
          <button
            onClick={() => { setDatePreset("all"); setCustomDateFrom(""); setCustomDateTo(""); }}
            className="ml-1 text-muted-foreground hover:text-destructive"
            title={language === "bn" ? "ফিল্টার সরান" : "Clear filter"}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Custom Date Range Inputs */}
      {datePreset === "custom" && (
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            className="w-40 h-8 text-sm"
            value={customDateFrom}
            onChange={(e) => setCustomDateFrom(e.target.value)}
          />
          <span className="text-muted-foreground text-sm">{language === "bn" ? "থেকে" : "to"}</span>
          <Input
            type="date"
            className="w-40 h-8 text-sm"
            value={customDateTo}
            onChange={(e) => setCustomDateTo(e.target.value)}
          />
        </div>
      )}

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">
                {selectedOrders.length} {t("selectedOrders")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("highImpactAction")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as OrderStatus)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="processing">{t("processing")}</SelectItem>
                  <SelectItem value="shipped">{t("shipped")}</SelectItem>
                  <SelectItem value="delivered">{t("delivered")}</SelectItem>
                  <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openBulkConfirm} disabled={updateOrderStatus.isPending}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                {t("updateSelected")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("orderManagement")}</CardTitle>
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              <CheckSquare className="mr-2 h-4 w-4" />
              {t("selectAll")}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t("statusUpdateHelper")}</p>
        </CardHeader>
        <CardContent>
          {filteredOrders && filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`flex flex-col md:flex-row md:items-center gap-4 border-b last:border-0 py-4 transition-colors hover:bg-muted/30 ${selectedOrders.includes(order.id) ? "bg-primary/5 px-4 rounded-lg -mx-4 border-b-0 mb-4" : ""
                    }`}
                >
                  {/* Left Section: Selection, Order details */}
                  <div className="flex flex-1 items-start gap-3 min-w-[300px]">
                    <div className="pt-1 border-r pr-3 border-transparent">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                      />
                    </div>

                    <div
                      className="cursor-pointer group flex-1 space-y-1"
                      onClick={() => setDetailOrder(order)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary group-hover:underline">
                          {order.order_number}
                        </span>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm font-medium">
                        {order.customer_name} <span className="text-muted-foreground font-normal">({order.customer_phone})</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] py-0 h-4 uppercase">
                          {order.payment_method}
                        </Badge>
                        {order.affiliates?.referral_code && (
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">
                            <Tag className="mr-1 h-2.5 w-2.5" />
                            {order.affiliates.referral_code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Price, Status, Actions */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-muted">
                    <div className="flex flex-col text-left md:text-right flex-1 md:flex-none">
                      <span className="text-xs text-muted-foreground mb-0.5">{t("totalAmount") || "Total"}</span>
                      <span className="font-bold text-base text-primary">
                        {t("currency")}{Number(order.total).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <Select
                        value={order.status}
                        onValueChange={(val) =>
                          updateOrderStatus.mutate({ orderId: order.id, status: val as OrderStatus })
                        }
                      >
                        <SelectTrigger className={`w-[130px] h-9 font-medium text-xs ${order.status === 'pending' ? 'text-warning border-warning/50 bg-warning/5' :
                          order.status === 'processing' ? 'text-info border-info/50 bg-info/5' :
                            order.status === 'shipped' ? 'text-primary border-primary/50 bg-primary/5' :
                              order.status === 'delivered' ? 'text-success border-success/50 bg-success/5' :
                                'text-destructive border-destructive/50 bg-destructive/5'
                          }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("pending")}</SelectItem>
                          <SelectItem value="processing">{t("processing")}</SelectItem>
                          <SelectItem value="shipped">{t("shipped")}</SelectItem>
                          <SelectItem value="delivered">{t("delivered")}</SelectItem>
                          <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Add Note"
                        onClick={() =>
                          setNoteDialog({
                            open: true,
                            orderId: order.id,
                            currentNote: order.notes || "",
                          })
                        }
                      >
                        <StickyNote className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title={language === "bn" ? "অর্ডার মুছুন" : "Delete Order"}
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(order.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EnterpriseEmptyState
              icon={FileText}
              title={t("noOrdersYet")}
              description={t("noOrdersDescription")}
            />
          )}
        </CardContent>
      </Card>

      {/* Note Dialog */}
      <Dialog open={noteDialog.open} onOpenChange={(open) => !open && setNoteDialog({ ...noteDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminNotes")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteDialog.currentNote}
            onChange={(e) => setNoteDialog({ ...noteDialog, currentNote: e.target.value })}
            placeholder={t("addNote")}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog({ ...noteDialog, open: false })}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSaveNote} disabled={updateOrderNotes.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Confirmation */}
      <EnterpriseConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={t("confirmBulkUpdateTitle")}
        description={t("confirmBulkUpdateDesc")}
        type="warning"
        impacts={[
          {
            label: t("affectedOrders"),
            value: selectedOrders.length,
            type: "neutral",
          },
          {
            label: t("newStatus"),
            value: t(bulkStatus as any),
            type: bulkStatus === "cancelled" ? "negative" : "positive",
          },
        ]}
        onConfirm={handleBulkStatusUpdate}
        isLoading={updateOrderStatus.isPending}
      />

      {/* Delete Order Confirmation */}
      <EnterpriseConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title={language === "bn" ? "অর্ডার মুছে ফেলুন" : "Delete Order"}
        description={language === "bn" ? "আপনি কি নিশ্চিত? এই অর্ডারটি স্থায়ীভাবে মুছে যাবে এবং আর ফিরিয়ে আনা যাবে না।" : "Are you sure? This order will be permanently deleted and cannot be recovered."}
        type="destructive"
        confirmLabel={language === "bn" ? "মুছে ফেলুন" : "Delete"}
        cancelLabel={t("cancel")}
        onConfirm={handleDeleteOrder}
        isLoading={deleteOrder.isPending}
      />

      {/* ====== ORDER DETAIL DIALOG ====== */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  {language === "bn" ? "অর্ডার বিস্তারিত" : "Order Details"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-bold">{detailOrder.order_number}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(detailOrder.created_at).toLocaleString(language === "bn" ? "bn-BD" : "en-US", {
                        year: "numeric", month: "long", day: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>
                  <Badge className={`${statusColors[detailOrder.status]} text-sm px-3 py-1`}>
                    {t(detailOrder.status as any)}
                  </Badge>
                </div>

                <Separator />

                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {language === "bn" ? "কাস্টমার তথ্য" : "Customer Information"}
                  </h3>
                  <div className="grid gap-2 text-sm rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{detailOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`tel:${detailOrder.customer_phone}`} className="text-primary hover:underline">
                        {detailOrder.customer_phone}
                      </a>
                    </div>
                    {detailOrder.customer_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`mailto:${detailOrder.customer_email}`} className="text-primary hover:underline">
                          {detailOrder.customer_email}
                        </a>
                      </div>
                    )}
                    {detailOrder.affiliates?.referral_code && (
                      <div className="flex items-center gap-2 mt-1 pt-2 border-t">
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">
                          {language === "bn" ? "অ্যাফিলিয়েট মাধ্যম:" : "Referral Source:"}
                        </span>
                        <Badge variant="secondary" className="text-[10px] py-0 h-4">
                          {detailOrder.affiliates.referral_code}
                        </Badge>
                      </div>
                    )}
                    {(detailOrder as any).affiliate_referral_code && (
                      <div className="flex items-center gap-2 mt-1 pt-2 border-t">
                        <Tag className="h-3.5 w-3.5 text-warning" />
                        <span className="text-xs text-muted-foreground">
                          {language === "bn" ? "রেফারেল কোড (র-ডেটা):" : "Referral Code (Raw):"}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-warning text-warning">
                          {(detailOrder as any).affiliate_referral_code}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Debug Metadata Section */}
                {((detailOrder as any).affiliate_referral_code || (detailOrder as any).delivery_fee_transaction_id) && (
                  <div className="mt-4 rounded-lg bg-muted/30 p-3 text-[10px] font-mono border border-muted">
                    <p className="mb-2 font-bold uppercase text-muted-foreground tracking-wider border-b border-muted/50 pb-1">
                      {language === "bn" ? "অতিরিক্ত তথ্য (ডিবাগ)" : "Extended Metadata (Debug)"}
                    </p>
                    {(detailOrder as any).affiliate_referral_code && (
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">affiliate_referral_code:</span>
                        <span className="text-primary truncate ml-2">{(detailOrder as any).affiliate_referral_code}</span>
                      </div>
                    )}
                    {(detailOrder as any).delivery_fee_transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">delivery_fee_transaction_id:</span>
                        <span className="text-primary truncate ml-2">{(detailOrder as any).delivery_fee_transaction_id}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Shipping Address */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {language === "bn" ? "শিপিং ঠিকানা" : "Shipping Address"}
                  </h3>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm">
                    <p>{detailOrder.shipping_address}</p>
                    <p className="text-muted-foreground mt-1">
                      {detailOrder.city}{detailOrder.district ? `, ${detailOrder.district}` : ""}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      <Truck className="mr-1 h-3 w-3" />
                      {deliveryTypeLabel(detailOrder.delivery_type)}
                    </Badge>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {language === "bn" ? "অর্ডারকৃত পণ্য" : "Ordered Items"}
                    {detailOrder.order_items && (
                      <Badge variant="secondary" className="text-xs">
                        {detailOrder.order_items.length} {language === "bn" ? "টি আইটেম" : "items"}
                      </Badge>
                    )}
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-3 font-medium">
                            {language === "bn" ? "পণ্য" : "Product"}
                          </th>
                          <th className="text-center p-3 font-medium w-20">
                            {language === "bn" ? "পরিমাণ" : "Qty"}
                          </th>
                          <th className="text-right p-3 font-medium w-24">
                            {language === "bn" ? "দাম" : "Price"}
                          </th>
                          <th className="text-right p-3 font-medium w-28">
                            {language === "bn" ? "মোট" : "Total"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailOrder.order_items?.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-3">
                              <p className="font-medium">
                                {language === "bn" ? item.product_name_bn : item.product_name_en}
                              </p>
                              {item.variant_attributes && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {typeof item.variant_attributes === "object"
                                    ? Object.entries(item.variant_attributes).map(([k, v]) => `${k}: ${v}`).join(" / ")
                                    : String(item.variant_attributes)}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">
                              {t("currency")}{Number(item.unit_price).toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {t("currency")}{Number(item.total_price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Summary */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {language === "bn" ? "পেমেন্ট সারাংশ" : "Payment Summary"}
                  </h3>
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
                      <span>{t("currency")}{Number(detailOrder.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "bn" ? "ডেলিভারি চার্জ" : "Delivery Charge"}</span>
                      <span>{t("currency")}{Number(detailOrder.delivery_charge).toLocaleString()}</span>
                    </div>
                    {detailOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>{language === "bn" ? "ডিসকাউন্ট" : "Discount"}</span>
                        <span>-{t("currency")}{Number(detailOrder.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>{language === "bn" ? "সর্বমোট" : "Total"}</span>
                      <span className="text-primary">{t("currency")}{Number(detailOrder.total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">{language === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method"}</span>
                      <Badge variant="outline">
                        <CreditCard className="mr-1 h-3 w-3" />
                        {paymentMethodLabel(detailOrder.payment_method)}
                      </Badge>
                    </div>
                    {detailOrder.delivery_fee_transaction_id && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-muted-foreground">
                          {language === "bn" ? "ডেলিভারি ফি ট্রানজেকশন আইডি" : "Delivery Fee Transaction ID"}
                        </span>
                        <span className="font-mono text-xs rounded bg-background px-2 py-0.5 border">
                          {detailOrder.delivery_fee_transaction_id}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                        <span className="text-primary font-semibold">
                          {language === "bn" ? "প্রকৃত ডেলিভারি খরচ (এডমিন)" : "Actual Delivery Cost (Admin)"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t("currency")}</span>
                          <Input
                            type="number"
                            value={actualDeliveryCost}
                            onChange={(e) => setActualDeliveryCost(e.target.value)}
                            className="w-24 h-8 text-right"
                            placeholder="0"
                          />
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 px-2"
                            onClick={handleUpdateDeliveryCost}
                            disabled={updateOrderDeliveryCost.isPending}
                          >
                            {updateOrderDeliveryCost.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              language === "bn" ? "সংরক্ষণ" : "Save"
                            )}
                          </Button>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {detailOrder.tracking_number && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">{language === "bn" ? "ট্র্যাকিং নম্বর" : "Tracking Number"}</p>
                      <p className="font-mono font-medium mt-1">{detailOrder.tracking_number}</p>
                    </div>
                  )}
                  {detailOrder.courier && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">{language === "bn" ? "কুরিয়ার" : "Courier"}</p>
                      <p className="font-medium mt-1">{detailOrder.courier}</p>
                    </div>
                  )}
                  {detailOrder.coupon_code && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">{language === "bn" ? "কুপন কোড" : "Coupon Code"}</p>
                      <p className="font-mono font-medium mt-1">{detailOrder.coupon_code}</p>
                    </div>
                  )}
                  {detailOrder.notes && (
                    <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">{language === "bn" ? "কাস্টমার নোট" : "Customer Note"}</p>
                      <p className="mt-1 text-sm">{detailOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailOrder(null);
                    setNoteDialog({
                      open: true,
                      orderId: detailOrder.id,
                      currentNote: detailOrder.notes || "",
                    });
                  }}
                >
                  <StickyNote className="mr-2 h-4 w-4" />
                  {language === "bn" ? "নোট যোগ করুন" : "Add Note"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      let siteName = "BanglaShop";
                      let siteLogo = "";
                      if (siteSettings) {
                        if (siteSettings.site_name) {
                          siteName = language === "bn" ? siteSettings.site_name.bn || siteSettings.site_name.en : siteSettings.site_name.en;
                        }
                        if (siteSettings.site_logo?.url) {
                          siteLogo = siteSettings.site_logo.url;
                        }
                      }

                      const rootStyles = getComputedStyle(document.documentElement);
                      const primaryHsl = rootStyles.getPropertyValue('--primary').trim();
                      const themeColor = primaryHsl ? `hsl(${primaryHsl})` : '#ea580c';

                      const itemsHtml = detailOrder.order_items?.map(item => {
                        const variantDetails = item.variant_attributes ? ` <span style="color:#666;font-size:12px;">(${typeof item.variant_attributes === "object" ? Object.entries(item.variant_attributes).map(([k, v]) => `${k}: ${v}`).join(", ") : item.variant_attributes})</span>` : "";
                        return `
                          <tr>
                          <td style="padding:12px;border-bottom:1px solid #eee;color:#333;">${language === "bn" ? item.product_name_bn : item.product_name_en}${variantDetails}</td>
                          <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#333;">${item.quantity}</td>
                          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;color:#333;">৳${Number(item.unit_price).toLocaleString()}</td>
                          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;color:#333;font-weight:600;">৳${Number(item.total_price).toLocaleString()}</td>
                        </tr>
                      `}).join("") || "";

                      const invoiceDate = new Date(detailOrder.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "long", day: "numeric" });

                      printWindow.document.write(`
                        <html><head><title>Invoice #${detailOrder.order_number}</title>
                        <style>
                          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; margin: 0 auto; max-width: 800px; color: #1a1a1a; background: #fff; line-height: 1.6; }
                          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
                          .brand { display: flex; flex-direction: column; }
                          .brand img { max-height: 100px; margin-bottom: 10px; object-fit: contain; }
                          .brand h1 { margin: 0; font-size: 24px; color: ${themeColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;}
                          .invoice-details { text-align: right; }
                          .invoice-title { font-size: 32px; font-weight: 300; color: ${themeColor}; margin: 0 0 10px 0; letter-spacing: 2px;}
                          .detail-row { display: flex; justify-content: flex-end; gap: 10px; font-size: 14px; margin-bottom: 4px;}
                          .detail-label { color: #666; font-weight: 600;}
                          .detail-value { font-weight: 500; min-width: 120px;}
                          
                          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                          .info-block { background: #f9fbfc; padding: 20px; border-radius: 8px; border: 1px solid #edf2f7;}
                          .info-title { font-size: 12px; text-transform: uppercase; color: #666; font-weight: 700; margin: 0 0 10px 0; letter-spacing: 0.5px;}
                          .info-content { font-size: 14px; margin: 0; color: #333;}
                          .info-content strong { color: #1a1a1a; display: block; font-size: 15px; margin-bottom: 4px;}
                          
                          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                          th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;}
                          
                          .totals-wrapper { display: flex; justify-content: flex-end; }
                          .totals { width: 300px; }
                          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569;}
                          .total-row.final { border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 800; color: #1a1a1a;}
                          .discount { color: #ef4444; }
                          
                          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; color: #94a3b8; font-size: 12px; }
                          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                        </style>
                        </head><body>
                        
                        <div class="header">
                          <div class="brand">
                            ${siteLogo ? `<img src="${siteLogo}" alt="${siteName}" />` : `<h1>${siteName}</h1>`}
                          </div>
                          <div class="invoice-details">
                            <h2 class="invoice-title">INVOICE</h2>
                            <div class="detail-row"><span class="detail-label">Order #</span><span class="detail-value">${detailOrder.order_number}</span></div>
                            <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${invoiceDate}</span></div>
                            <div class="detail-row"><span class="detail-label">Payment</span><span class="detail-value">${detailOrder.payment_method === "cod" ? "Cash on Delivery" : "Online"}</span></div>
                            ${detailOrder.delivery_fee_transaction_id ? `<div class="detail-row"><span class="detail-label">Delivery Fee TXN</span><span class="detail-value">${detailOrder.delivery_fee_transaction_id}</span></div>` : ""}
                          </div>
                        </div>

                        <div class="info-grid">
                          <div class="info-block">
                            <h3 class="info-title">Bill To</h3>
                            <p class="info-content">
                              <strong>${detailOrder.customer_name}</strong>
                              ${detailOrder.customer_phone}<br/>
                              ${detailOrder.customer_email ? `${detailOrder.customer_email}` : ""}
                            </p>
                          </div>
                          <div class="info-block">
                            <h3 class="info-title">Ship To</h3>
                            <p class="info-content">
                              ${detailOrder.shipping_address}<br/>
                              ${detailOrder.district ? `${detailOrder.district}, ` : ""}${detailOrder.city}<br/>
                              ${detailOrder.courier ? `Courier: ${detailOrder.courier}` : ""}
                            </p>
                          </div>
                        </div>

                        <table>
                          <thead>
                            <tr>
                              <th>Item Description</th>
                              <th style="text-align:center">Qty</th>
                              <th style="text-align:right">Unit Price</th>
                              <th style="text-align:right">Total</th>
                            </tr>
                          </thead>
                          <tbody>${itemsHtml}</tbody>
                        </table>

                        <div class="totals-wrapper">
                          <div class="totals">
                            <div class="total-row"><span>Subtotal</span><span>৳${Number(detailOrder.subtotal).toLocaleString()}</span></div>
                            <div class="total-row"><span>Delivery Charge</span><span>৳${Number(detailOrder.delivery_charge).toLocaleString()}</span></div>
                            ${detailOrder.discount_amount > 0 ? `<div class="total-row discount"><span>Discount</span><span>-৳${Number(detailOrder.discount_amount).toLocaleString()}</span></div>` : ""}
                            <div class="total-row final"><span>Total Amount</span><span>৳${Number(detailOrder.total).toLocaleString()}</span></div>
                          </div>
                        </div>

                        <div class="footer">
                          Thank you for shopping with ${siteName}! If you have any questions about this invoice, please contact support.
                        </div>
                        
                        </body></html>
                      `);
                      printWindow.document.close();
                      setTimeout(() => printWindow.print(), 500); // Slight delay for logo image to load
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {language === "bn" ? "প্রিন্ট / ইনভয়েস" : "Print / Invoice"}
                </Button>
                <Button onClick={() => setDetailOrder(null)}>
                  {language === "bn" ? "বন্ধ করুন" : "Close"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
};
