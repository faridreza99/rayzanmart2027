import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, User, Ban, Info, Eye, CheckCircle, MailX, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAllProfiles, useUpdateProfile, useUpdateUserRole, useAdminConfirmEmail, useAdminResendVerification } from "@/hooks/useAdminSettings";
import { useAllOrders } from "@/hooks/useOrders";
import { toast } from "sonner";

export const UserManagement = () => {
  const { language, t } = useLanguage();
  const { data: profiles, isLoading } = useAllProfiles();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const updateProfile = useUpdateProfile();
  const updateUserRole = useUpdateUserRole();
  const adminConfirmEmail = useAdminConfirmEmail();
  const adminResendVerification = useAdminResendVerification();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; user: any }>({
    open: false,
    action: "",
    user: null,
  });

  const filteredProfiles = profiles?.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
  );

  const latestOrderByUserId = useMemo(() => {
    const map = new Map<string, any>();
    (orders || [])
      .filter((order: any) => !!order.user_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .forEach((order: any) => {
        if (!map.has(order.user_id)) {
          map.set(order.user_id, order);
        }
      });
    return map;
  }, [orders]);

  const getOrderAddress = (user: any) => {
    const latestOrder = latestOrderByUserId.get(user.user_id);
    if (!latestOrder) return null;
    const segments = [latestOrder.shipping_address, latestOrder.city, latestOrder.district].filter(Boolean);
    return segments.length > 0 ? segments.join(", ") : null;
  };

  const getDisplayAddress = (user: any) => {
    const orderAddress = getOrderAddress(user);
    if (orderAddress) return orderAddress;
    const profileSegments = [user.address, user.city, user.district].filter(Boolean);
    return profileSegments.length > 0 ? profileSegments.join(", ") : "-";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-destructive";
      case "affiliate": return "bg-warning";
      default: return "bg-info";
    }
  };

  const handleBlockToggle = async (user: any) => {
    setConfirmDialog({ open: false, action: "", user: null });
    try {
      await updateProfile.mutateAsync({
        userId: user.user_id,
        updates: { is_blocked: !user.is_blocked },
      });
      toast.success(t("statusUpdated"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleRoleChange = async (userId: string, newRole: "customer" | "affiliate" | "admin") => {
    try {
      await updateUserRole.mutateAsync({ userId, role: newRole });
      toast.success(t("roleUpdated"));
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const openBlockConfirm = (user: any) => {
    setConfirmDialog({
      open: true,
      action: user.is_blocked ? "unblock" : "block",
      user,
    });
  };

  const handleConfirmEmail = async (user: any) => {
    try {
      await adminConfirmEmail.mutateAsync(user.email);
      toast.success(language === "bn" ? `${user.email}-এর ইমেইল কনফার্ম করা হয়েছে` : `Email confirmed for ${user.email}`);
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleResendVerification = async (user: any) => {
    try {
      await adminResendVerification.mutateAsync(user.email);
      toast.success(language === "bn" ? "ভেরিফিকেশন ইমেইল পাঠানো হয়েছে" : "Verification email sent");
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  if (isLoading || ordersLoading) {
    return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <Alert className="border-info/30 bg-info/5">
        <Info className="h-4 w-4 text-info" />
        <AlertDescription className="text-sm text-info">
          {t("userManagementHelper")}
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder={t("searchUsers")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* User List */}
      <div>
        {filteredProfiles && filteredProfiles.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "bn" ? "ইউজার" : "User"}</TableHead>
                      <TableHead>{language === "bn" ? "যোগাযোগ" : "Contact"}</TableHead>
                      <TableHead>{language === "bn" ? "সর্বশেষ অর্ডারের ঠিকানা" : "Latest Order Address"}</TableHead>
                      <TableHead>{language === "bn" ? "রোল" : "Role"}</TableHead>
                      <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                      <TableHead className="text-right">{t("action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((user: any) => {
                      const userRole = user.user_roles?.[0]?.role || "customer";
                      const displayAddress = getDisplayAddress(user);
                      const emailConfirmed = user.email_confirmed;

                      return (
                        <TableRow key={user.id} className={user.is_blocked ? "bg-destructive/5" : ""}>
                          <TableCell className="min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[220px]">
                            <div className="space-y-0.5">
                              <p className="text-sm">{user.email || "-"}</p>
                              <p className="text-xs text-muted-foreground">{user.phone || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[360px]">
                            <p className="text-sm text-muted-foreground line-clamp-2">{displayAddress}</p>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={userRole}
                              onValueChange={(val) => handleRoleChange(user.user_id, val as any)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">{t("customer")}</SelectItem>
                                <SelectItem value="affiliate">{t("affiliate")}</SelectItem>
                                <SelectItem value="admin">{t("admin")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Badge className={getRoleBadgeColor(userRole)}>
                                  {t(userRole)}
                                </Badge>
                                {user.is_blocked && (
                                  <Badge variant="destructive">{t("blocked")}</Badge>
                                )}
                              </div>
                              {emailConfirmed === false && (
                                <Badge variant="outline" className="border-orange-400 text-orange-600 text-[10px] w-fit">
                                  <MailX className="h-2.5 w-2.5 mr-1" />
                                  {language === "bn" ? "ইমেইল অযাচাই" : "Email unverified"}
                                </Badge>
                              )}
                              {emailConfirmed === true && (
                                <Badge variant="outline" className="border-green-500 text-green-600 text-[10px] w-fit">
                                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                  {language === "bn" ? "যাচাইকৃত" : "Verified"}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                              {emailConfirmed === false && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-2 border-green-500 text-green-600 hover:bg-green-50"
                                    onClick={() => handleConfirmEmail(user)}
                                    disabled={adminConfirmEmail.isPending}
                                    title={language === "bn" ? "ইমেইল কনফার্ম করুন" : "Confirm email"}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-2 border-blue-400 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleResendVerification(user)}
                                    disabled={adminResendVerification.isPending}
                                    title={language === "bn" ? "ভেরিফিকেশন ইমেইল পাঠান" : "Resend verification"}
                                  >
                                    <Send className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant={user.is_blocked ? "outline" : "destructive"}
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => openBlockConfirm(user)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("noUsersFound")}
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("userDetails")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <p><strong>{t("name")}:</strong> {selectedUser.name}</p>
                <p><strong>{t("email")}:</strong> {selectedUser.email || "-"}</p>
                <p><strong>{t("phone")}:</strong> {selectedUser.phone || "-"}</p>
                <p><strong>{t("address")}:</strong> {getDisplayAddress(selectedUser)}</p>
                <p><strong>{t("joinedAt")}:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                <p>
                  <strong>{language === "bn" ? "ইমেইল স্ট্যাটাস:" : "Email status:"}</strong>{" "}
                  {selectedUser.email_confirmed === true
                    ? <span className="text-green-600">{language === "bn" ? "✓ যাচাইকৃত" : "✓ Verified"}</span>
                    : selectedUser.email_confirmed === false
                    ? <span className="text-orange-600">{language === "bn" ? "✗ অযাচাই" : "✗ Unverified"}</span>
                    : "-"}
                </p>
              </div>

              {selectedUser.email_confirmed === false && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-600"
                    onClick={() => { handleConfirmEmail(selectedUser); setSelectedUser(null); }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {language === "bn" ? "ইমেইল কনফার্ম করুন" : "Confirm Email"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-400 text-blue-600"
                    onClick={() => { handleResendVerification(selectedUser); setSelectedUser(null); }}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {language === "bn" ? "ইমেইল পাঠান" : "Resend Email"}
                  </Button>
                </div>
              )}

              <Alert className="border-muted bg-muted/30">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {t("activitySummaryDemo")}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">{t("orders")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-info">0</p>
                  <p className="text-xs text-muted-foreground">{t("wishlist")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-success">{t("currency")}0</p>
                  <p className="text-xs text-muted-foreground">{t("totalSpent")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Block Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmAction")}</DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "block" ? t("confirmBlockUser") : t("confirmUnblockUser")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
              {t("cancel")}
            </Button>
            <Button
              variant={confirmDialog.action === "block" ? "destructive" : "default"}
              onClick={() => handleBlockToggle(confirmDialog.user)}
            >
              {confirmDialog.action === "block" ? t("blockUser") : t("unblockUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
