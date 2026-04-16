 import { useLanguage } from "@/contexts/LanguageContext";
 import { Users, TrendingUp, Target, DollarSign } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface TopAffiliate {
   name: string;
   sales: number;
   commission: number;
 }
 
 interface AffiliateMarketingSnapshotProps {
   topAffiliates: TopAffiliate[];
   conversionRate: number;
   activeCampaigns: number;
   totalCommissionLiability: number;
   isLoading?: boolean;
 }
 
 export const AffiliateMarketingSnapshot = ({
   topAffiliates,
   conversionRate,
   activeCampaigns,
   totalCommissionLiability,
   isLoading,
 }: AffiliateMarketingSnapshotProps) => {
   const { t } = useLanguage();
 
   if (isLoading) {
     return (
       <div className="rounded-md border bg-card p-4">
         <div className="h-5 w-40 bg-muted rounded mb-4 animate-pulse" />
         <div className="space-y-3">
           {[1, 2, 3].map((i) => (
             <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
           ))}
         </div>
       </div>
     );
   }
 
   return (
     <div className="rounded-md border bg-card p-4 h-full">
       <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
         {t("affiliateMarketingSnapshot")}
       </h3>
 
       {/* Quick Stats */}
       <div className="grid grid-cols-3 gap-2 mb-4">
         <div className="text-center p-2 rounded-md bg-muted/30">
           <div className="flex justify-center mb-1">
             <Target className="h-3.5 w-3.5 text-info" />
           </div>
           <p className="text-lg font-bold">{conversionRate}%</p>
           <p className="text-[10px] text-muted-foreground uppercase">
             {t("conversion")}
           </p>
         </div>
         <div className="text-center p-2 rounded-md bg-muted/30">
           <div className="flex justify-center mb-1">
             <TrendingUp className="h-3.5 w-3.5 text-success" />
           </div>
           <p className="text-lg font-bold">{activeCampaigns}</p>
           <p className="text-[10px] text-muted-foreground uppercase">
             {t("campaigns") || "ক্যাম্পেইন"}
           </p>
         </div>
         <div className="text-center p-2 rounded-md bg-muted/30">
           <div className="flex justify-center mb-1">
             <DollarSign className="h-3.5 w-3.5 text-warning" />
           </div>
           <p className="text-lg font-bold">{t("currency")}{(totalCommissionLiability / 1000).toFixed(0)}k</p>
           <p className="text-[10px] text-muted-foreground uppercase">
             {t("liability")}
           </p>
         </div>
       </div>
 
       {/* Top Affiliates */}
       <div>
         <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
           <Users className="h-3 w-3" />
           {t("top5Affiliates")}
         </h4>
         <div className="space-y-1.5">
           {topAffiliates.length > 0 ? (
             topAffiliates.slice(0, 5).map((affiliate, index) => (
               <div
                 key={index}
                 className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors"
               >
                 <div className="flex items-center gap-2">
                   <span className={cn(
                     "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                     index === 0 ? "bg-warning/20 text-warning" :
                     index === 1 ? "bg-muted text-muted-foreground" :
                     index === 2 ? "bg-primary/20 text-primary" :
                     "bg-muted/50 text-muted-foreground"
                   )}>
                     {index + 1}
                   </span>
                   <span className="text-sm font-medium truncate max-w-[100px]">
                     {affiliate.name}
                   </span>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-bold">{t("currency")}{affiliate.sales.toLocaleString()}</p>
                   <p className="text-[10px] text-muted-foreground">
                     {t("commission")}: {t("currency")}{affiliate.commission.toLocaleString()}
                   </p>
                 </div>
               </div>
             ))
           ) : (
             <p className="text-sm text-muted-foreground text-center py-4">
               {t("noAffiliates")}
             </p>
           )}
         </div>
       </div>
     </div>
   );
 };