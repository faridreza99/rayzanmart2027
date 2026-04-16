import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tag, Plus, Trash2, Info, Calendar, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { EnterpriseConfirmDialog } from "@/components/admin/EnterpriseConfirmDialog";
import { ItemStateIndicator, ItemState } from "@/components/admin/ItemStateIndicator";
import { EnterpriseEmptyState } from "@/components/admin/EnterpriseEmptyState";
import { FeatureStatusIndicator } from "@/components/admin/ComingSoonBadge";
import { ValidationMessage } from "@/components/admin/ValidationMessage";
import { validateDiscountPercentage, SYSTEM_LIMITS } from "@/lib/validation-limits";
 
 interface Coupon {
   id: string;
   code: string;
   nameBn: string;
   nameEn: string;
   type: "percentage" | "fixed";
   value: number;
   minOrder: number;
   maxDiscount?: number;
   usageLimit?: number;
   usedCount: number;
   isActive: boolean;
   expiresAt?: string;
 }
 
 const demoCoupons: Coupon[] = [
   {
     id: "1",
     code: "SAVE10",
     nameBn: "১০% ছাড়",
     nameEn: "10% Off",
     type: "percentage",
     value: 10,
     minOrder: 500,
     maxDiscount: 200,
     usageLimit: 100,
     usedCount: 45,
     isActive: true,
     expiresAt: "2025-03-31",
   },
   {
     id: "2",
     code: "WELCOME20",
     nameBn: "নতুন গ্রাহকদের জন্য ২০% ছাড়",
     nameEn: "20% Off for New Customers",
     type: "percentage",
     value: 20,
     minOrder: 1000,
     maxDiscount: 500,
     usageLimit: 50,
     usedCount: 23,
     isActive: true,
     expiresAt: "2025-06-30",
   },
   {
     id: "3",
     code: "FLAT100",
     nameBn: "১০০ টাকা ছাড়",
     nameEn: "Flat 100 Taka Off",
     type: "fixed",
     value: 100,
     minOrder: 800,
     usedCount: 78,
     isActive: true,
   },
   {
     id: "4",
     code: "EXPIRED50",
     nameBn: "মেয়াদোত্তীর্ণ কুপন",
     nameEn: "Expired Coupon",
     type: "percentage",
     value: 50,
     minOrder: 0,
     usedCount: 120,
     isActive: false,
     expiresAt: "2024-12-31",
   },
 ];
 
 export const CouponManagement = () => {
   const { language, t } = useLanguage();
   const [coupons, setCoupons] = useState<Coupon[]>(demoCoupons);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; coupon: Coupon | null }>({
     open: false,
     coupon: null,
   });
   const [toggleConfirm, setToggleConfirm] = useState<{ open: boolean; coupon: Coupon | null }>({
     open: false,
     coupon: null,
   });
   const [newCoupon, setNewCoupon] = useState({
     code: "",
     nameBn: "",
     nameEn: "",
     type: "percentage" as "percentage" | "fixed",
     value: 10,
     minOrder: 500,
     maxDiscount: 200,
     usageLimit: 100,
     expiresAt: "",
   });
 
   const handleToggleCoupon = (id: string) => {
     const coupon = coupons.find((c) => c.id === id);
     if (coupon) {
       setToggleConfirm({ open: true, coupon });
     }
   };
 
   const confirmToggleCoupon = () => {
     if (!toggleConfirm.coupon) return;
     const id = toggleConfirm.coupon.id;
     const wasActive = toggleConfirm.coupon.isActive;
     setCoupons((prev) =>
       prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
     );
     toast.success(
       wasActive
         ? (language === "bn" ? "কুপন নিষ্ক্রিয় করা হয়েছে" : "Coupon deactivated")
         : (language === "bn" ? "কুপন সক্রিয় করা হয়েছে" : "Coupon activated")
     );
      setToggleConfirm({ open: false, coupon: null });
    };

    // Validation for discount value
    const discountValidation = useMemo(() => {
      if (newCoupon.type === "percentage") {
        return validateDiscountPercentage(newCoupon.value);
      }
      return { isValid: true, hasWarning: false, severity: "info" as const };
    }, [newCoupon.value, newCoupon.type]);

    const handleAddCoupon = () => {
      if (!newCoupon.code || !newCoupon.nameBn) {
        toast.error(t("somethingWentWrong"));
        return;
      }
      
      // Check validation before saving
      if (!discountValidation.isValid) {
        toast.error(language === "bn" ? "ডিসকাউন্ট মান সীমার মধ্যে নেই" : "Discount value is out of range");
        return;
      }
      
      const coupon: Coupon = {
        id: Date.now().toString(),
        ...newCoupon,
        usedCount: 0,
        isActive: true,
      };
      setCoupons((prev) => [...prev, coupon]);
      setDialogOpen(false);
      setNewCoupon({
        code: "",
        nameBn: "",
        nameEn: "",
        type: "percentage",
        value: 10,
        minOrder: 500,
        maxDiscount: 200,
        usageLimit: 100,
        expiresAt: "",
      });
      toast.success(t("settingsSaved"));
    };
 
   const handleDeleteCoupon = (id: string) => {
     const coupon = coupons.find((c) => c.id === id);
     if (coupon) {
       setDeleteConfirm({ open: true, coupon });
     }
   };
 
   const confirmDeleteCoupon = () => {
     if (!deleteConfirm.coupon) return;
     setCoupons((prev) => prev.filter((c) => c.id !== deleteConfirm.coupon?.id));
     toast.success(language === "bn" ? "কুপন সফলভাবে মুছে ফেলা হয়েছে" : "Coupon deleted successfully");
     setDeleteConfirm({ open: false, coupon: null });
   };
 
   const getCouponState = (coupon: Coupon): ItemState => {
     if (!coupon.isActive) return "paused";
     if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return "archived";
     return "active";
   };
 
   return (
     <div className="space-y-6">
       <Alert className="border-info/30 bg-info/5">
         <Info className="h-4 w-4 text-info" />
         <AlertDescription className="text-sm text-info">
           {t("couponDemoNote")}
         </AlertDescription>
       </Alert>
 
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {t("couponManagement")}
              </CardTitle>
              <FeatureStatusIndicator status="demo" />
            </div>
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button size="sm">
                 <Plus className="mr-2 h-4 w-4" />
                 {t("add")}
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>{t("add")} {t("couponCode")}</DialogTitle>
               </DialogHeader>
               <div className="space-y-4">
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <Label>{t("couponCode")}</Label>
                     <Input
                       value={newCoupon.code}
                       onChange={(e) =>
                         setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                       }
                       placeholder="SAVE10"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>{t("commissionType")}</Label>
                     <Select
                       value={newCoupon.type}
                       onValueChange={(val) =>
                         setNewCoupon({ ...newCoupon, type: val as "percentage" | "fixed" })
                       }
                     >
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="percentage">{t("percentage")}</SelectItem>
                         <SelectItem value="fixed">{t("fixedAmount")}</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
 
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <Label>{language === "bn" ? "নাম (বাংলা)" : "Name (Bangla)"}</Label>
                     <Input
                       value={newCoupon.nameBn}
                       onChange={(e) => setNewCoupon({ ...newCoupon, nameBn: e.target.value })}
                       placeholder="১০% ছাড়"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>{language === "bn" ? "নাম (ইংরেজি)" : "Name (English)"}</Label>
                     <Input
                       value={newCoupon.nameEn}
                       onChange={(e) => setNewCoupon({ ...newCoupon, nameEn: e.target.value })}
                       placeholder="10% Off"
                     />
                   </div>
                 </div>
 
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("commissionValue")}</Label>
                      <Input
                        type="number"
                        value={newCoupon.value}
                        onChange={(e) =>
                          setNewCoupon({ ...newCoupon, value: Number(e.target.value) })
                        }
                        max={newCoupon.type === "percentage" ? SYSTEM_LIMITS.MAX_DISCOUNT_PERCENTAGE : undefined}
                        className={!discountValidation.isValid ? "border-destructive" : discountValidation.hasWarning ? "border-warning" : ""}
                      />
                      {newCoupon.type === "percentage" && (discountValidation.hasWarning || !discountValidation.isValid) && (
                        <ValidationMessage validation={discountValidation} />
                      )}
                      {newCoupon.type === "percentage" && (
                        <p className="text-xs text-muted-foreground">
                          {language === "bn" ? `সর্বোচ্চ: ${SYSTEM_LIMITS.MAX_DISCOUNT_PERCENTAGE}%` : `Maximum: ${SYSTEM_LIMITS.MAX_DISCOUNT_PERCENTAGE}%`}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>{t("minOrder")}</Label>
                      <Input
                        type="number"
                        value={newCoupon.minOrder}
                        onChange={(e) =>
                          setNewCoupon({ ...newCoupon, minOrder: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
 
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <Label>{language === "bn" ? "ব্যবহার সীমা" : "Usage Limit"}</Label>
                     <Input
                       type="number"
                       value={newCoupon.usageLimit}
                       onChange={(e) =>
                         setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })
                       }
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>{t("endDate")}</Label>
                     <Input
                       type="date"
                       value={newCoupon.expiresAt}
                       onChange={(e) =>
                         setNewCoupon({ ...newCoupon, expiresAt: e.target.value })
                       }
                     />
                   </div>
                 </div>
 
                 <Button onClick={handleAddCoupon} className="w-full">
                   {t("add")} {t("couponCode")}
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {coupons.map((coupon) => (
               <div
                 key={coupon.id}
                 className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 ${
                   !coupon.isActive ? "opacity-70 border-muted" : "border-primary/20"
                 }`}
               >
                 <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                     <Tag className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                       <span className="font-mono font-bold">{coupon.code}</span>
                       <ItemStateIndicator state={getCouponState(coupon)} size="sm" />
                     </div>
                     <p className="text-sm text-muted-foreground">
                       {language === "bn" ? coupon.nameBn : coupon.nameEn}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {coupon.type === "percentage"
                         ? `${coupon.value}%`
                         : `৳${coupon.value}`}{" "}
                       | {t("minOrder")}: ৳{coupon.minOrder} | {language === "bn" ? "ব্যবহৃত" : "Used"}:{" "}
                       {coupon.usedCount}
                       {coupon.usageLimit && `/${coupon.usageLimit}`}
                     </p>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   {coupon.expiresAt && (
                     <div className="flex items-center gap-1 text-xs text-muted-foreground">
                       <Calendar className="h-3 w-3" />
                       {coupon.expiresAt}
                     </div>
                   )}
                   <Switch
                     checked={coupon.isActive}
                     onCheckedChange={() => handleToggleCoupon(coupon.id)}
                   />
                   <Button
                     variant="ghost"
                     size="icon"
                     className="text-destructive hover:text-destructive"
                     onClick={() => handleDeleteCoupon(coupon.id)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             ))}
             
             {coupons.length === 0 && (
               <EnterpriseEmptyState
                 icon={Tag}
                 title={t("noCampaignsYet")}
                 description={t("noCampaignsDescription")}
                 actionLabel={t("add")}
                 onAction={() => setDialogOpen(true)}
               />
             )}
           </div>
         </CardContent>
       </Card>
 
       {/* Delete Confirmation */}
       <EnterpriseConfirmDialog
         open={deleteConfirm.open}
         onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
         title={language === "bn" ? "কুপন মুছে ফেলুন" : "Delete Coupon"}
         description={
           language === "bn"
             ? "এই কুপন স্থায়ীভাবে মুছে ফেলা হবে। এই অ্যাকশন রিভার্স করা যাবে না।"
             : "This coupon will be permanently deleted. This action cannot be undone."
         }
         type="destructive"
         impacts={[
           {
             label: language === "bn" ? "কুপন কোড" : "Coupon Code",
             value: deleteConfirm.coupon?.code || "",
           },
           {
             label: language === "bn" ? "ব্যবহৃত" : "Used",
             value: deleteConfirm.coupon?.usedCount || 0,
             type: "neutral",
           },
         ]}
         onConfirm={confirmDeleteCoupon}
       />
 
       {/* Toggle Confirmation */}
       <EnterpriseConfirmDialog
         open={toggleConfirm.open}
         onOpenChange={(open) => setToggleConfirm({ ...toggleConfirm, open })}
         title={
           toggleConfirm.coupon?.isActive
             ? (language === "bn" ? "কুপন নিষ্ক্রিয় করুন" : "Deactivate Coupon")
             : (language === "bn" ? "কুপন সক্রিয় করুন" : "Activate Coupon")
         }
         description={
           toggleConfirm.coupon?.isActive
             ? (language === "bn"
                 ? "এই কুপন নিষ্ক্রিয় করলে গ্রাহকরা এটি ব্যবহার করতে পারবে না।"
                 : "Deactivating this coupon will prevent customers from using it.")
             : (language === "bn"
                 ? "এই কুপন সক্রিয় করলে গ্রাহকরা এটি ব্যবহার করতে পারবে।"
                 : "Activating this coupon will allow customers to use it.")
         }
         type={toggleConfirm.coupon?.isActive ? "warning" : "success"}
         onConfirm={confirmToggleCoupon}
       />
     </div>
   );
 };