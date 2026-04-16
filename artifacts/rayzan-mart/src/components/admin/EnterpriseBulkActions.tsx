 import { useState } from "react";
 import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 
 interface BulkActionConfig {
   id: string;
   labelBn: string;
   labelEn: string;
   type: "status" | "category" | "brand" | "stock" | "delete" | "sort";
   impactType?: "positive" | "negative" | "warning";
 }
 
 interface EnterpriseBulkActionsProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   selectedCount: number;
   actionType: string;
   onConfirm: (params?: any) => Promise<void>;
   categories?: { id: string; name_bn: string; name_en: string }[];
   brands?: { id: string; name_bn: string; name_en: string }[];
 }
 
 export const EnterpriseBulkActions = ({
   open,
   onOpenChange,
   selectedCount,
   actionType,
   onConfirm,
   categories = [],
   brands = [],
 }: EnterpriseBulkActionsProps) => {
   const { language, t } = useLanguage();
   const [isLoading, setIsLoading] = useState(false);
   const [selectedCategory, setSelectedCategory] = useState("");
   const [selectedBrand, setSelectedBrand] = useState("");
   const [stockAdjustment, setStockAdjustment] = useState(0);
   const [sortOrder, setSortOrder] = useState(0);
 
   const actionConfigs: Record<string, BulkActionConfig> = {
     activate: { id: "activate", labelBn: "বাল্ক সক্রিয়", labelEn: "Bulk Activate", type: "status", impactType: "positive" },
     deactivate: { id: "deactivate", labelBn: "বাল্ক নিষ্ক্রিয়", labelEn: "Bulk Deactivate", type: "status", impactType: "warning" },
     change_category: { id: "change_category", labelBn: "ক্যাটাগরি পরিবর্তন", labelEn: "Change Category", type: "category" },
     change_brand: { id: "change_brand", labelBn: "ব্র্যান্ড পরিবর্তন", labelEn: "Change Brand", type: "brand" },
     adjust_stock: { id: "adjust_stock", labelBn: "স্টক সমন্বয়", labelEn: "Adjust Stock", type: "stock" },
     delete: { id: "delete", labelBn: "বাল্ক মুছুন", labelEn: "Bulk Delete", type: "delete", impactType: "negative" },
     update_sort: { id: "update_sort", labelBn: "সাজানোর ক্রম আপডেট", labelEn: "Update Sort Order", type: "sort" },
   };
 
   const config = actionConfigs[actionType] || actionConfigs.activate;
 
   const handleConfirm = async () => {
     setIsLoading(true);
     try {
       const params: any = {};
       if (actionType === "change_category") params.category_id = selectedCategory;
       if (actionType === "change_brand") params.brand_id = selectedBrand;
       if (actionType === "adjust_stock") params.stock_adjustment = stockAdjustment;
       if (actionType === "update_sort") params.sort_order = sortOrder;
       await onConfirm(params);
       onOpenChange(false);
     } finally {
       setIsLoading(false);
     }
   };
 
   const getImpactBadge = () => {
     if (config.impactType === "negative") {
       return <Badge variant="destructive">{language === "bn" ? "উচ্চ প্রভাব" : "High Impact"}</Badge>;
     }
     if (config.impactType === "warning") {
       return <Badge variant="outline" className="border-orange-500 text-orange-500">{language === "bn" ? "সতর্কতা" : "Caution"}</Badge>;
     }
     return <Badge variant="outline" className="border-green-500 text-green-500">{language === "bn" ? "নিরাপদ" : "Safe"}</Badge>;
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <div className="flex items-center gap-2">
             <DialogTitle>{language === "bn" ? config.labelBn : config.labelEn}</DialogTitle>
             {getImpactBadge()}
           </div>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
             <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
             <div className="text-sm">
               <p className="font-medium">
                 {language === "bn" ? "প্রভাবিত আইটেম" : "Affected Items"}: {selectedCount}
               </p>
               <p className="text-muted-foreground">
                 {language === "bn"
                   ? "এই অ্যাকশন নির্বাচিত সকল আইটেমে প্রযোজ্য হবে।"
                   : "This action will apply to all selected items."}
               </p>
             </div>
           </div>
 
           {config.type === "category" && (
             <div className="space-y-2">
               <Label>{language === "bn" ? "নতুন ক্যাটাগরি" : "New Category"}</Label>
               <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                 <SelectTrigger>
                   <SelectValue placeholder={language === "bn" ? "ক্যাটাগরি নির্বাচন করুন" : "Select category"} />
                 </SelectTrigger>
                 <SelectContent>
                   {categories.map((cat) => (
                     <SelectItem key={cat.id} value={cat.id}>
                       {language === "bn" ? cat.name_bn : cat.name_en}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}
 
           {config.type === "brand" && (
             <div className="space-y-2">
               <Label>{language === "bn" ? "নতুন ব্র্যান্ড" : "New Brand"}</Label>
               <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                 <SelectTrigger>
                   <SelectValue placeholder={language === "bn" ? "ব্র্যান্ড নির্বাচন করুন" : "Select brand"} />
                 </SelectTrigger>
                 <SelectContent>
                   {brands.map((brand) => (
                     <SelectItem key={brand.id} value={brand.id}>
                       {language === "bn" ? brand.name_bn : brand.name_en}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}
 
           {config.type === "stock" && (
             <div className="space-y-2">
               <Label>{language === "bn" ? "স্টক সমন্বয়" : "Stock Adjustment"}</Label>
               <div className="flex gap-2">
                 <Input
                   type="number"
                   value={stockAdjustment}
                   onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                   placeholder="0"
                 />
               </div>
               <p className="text-xs text-muted-foreground">
                 {language === "bn"
                   ? "ধনাত্মক = বৃদ্ধি, ঋণাত্মক = হ্রাস"
                   : "Positive = increase, Negative = decrease"}
               </p>
             </div>
           )}
 
           {config.type === "sort" && (
             <div className="space-y-2">
               <Label>{language === "bn" ? "সাজানোর ক্রম" : "Sort Order"}</Label>
               <Input
                 type="number"
                 value={sortOrder}
                 onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
               />
             </div>
           )}
 
           {config.type === "delete" && (
             <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
               <p className="text-sm text-destructive font-medium">
                 {language === "bn"
                   ? "⚠️ সতর্কতা: এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না!"
                   : "⚠️ Warning: This action cannot be undone!"}
               </p>
             </div>
           )}
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
             {t("cancel")}
           </Button>
           <Button
             variant={config.impactType === "negative" ? "destructive" : "default"}
             onClick={handleConfirm}
             disabled={isLoading || (config.type === "category" && !selectedCategory) || (config.type === "brand" && !selectedBrand)}
           >
             {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             {t("confirm")}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };