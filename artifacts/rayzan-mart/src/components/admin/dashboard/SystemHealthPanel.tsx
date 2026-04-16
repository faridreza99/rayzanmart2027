 import { useLanguage } from "@/contexts/LanguageContext";
 import { CheckCircle, AlertCircle, CreditCard, Truck, Users, Gift, History } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { format } from "date-fns";
 
 interface SystemStatus {
   name: string;
   status: "active" | "inactive" | "warning";
   icon: typeof CreditCard;
 }
 
 interface AuditEntry {
   action: string;
   description: string;
   time: Date;
 }
 
 interface SystemHealthPanelProps {
   auditLog: AuditEntry[];
   isLoading?: boolean;
 }
 
 export const SystemHealthPanel = ({ auditLog, isLoading }: SystemHealthPanelProps) => {
   const { t, language } = useLanguage();
 
   const systems: SystemStatus[] = [
     { name: t("paymentSystem"), status: "active", icon: CreditCard },
     { name: t("deliverySystem"), status: "active", icon: Truck },
     { name: t("affiliateModule"), status: "active", icon: Users },
     { name: t("loyaltyProgram"), status: "active", icon: Gift },
   ];
 
   if (isLoading) {
     return (
       <div className="rounded-md border bg-card p-4">
         <div className="h-5 w-36 bg-muted rounded mb-4 animate-pulse" />
         <div className="space-y-2">
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
           ))}
         </div>
       </div>
     );
   }
 
   return (
     <div className="rounded-md border bg-card p-4 h-full">
       <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
         {t("systemHealth")}
       </h3>
 
       {/* System Status Grid */}
       <div className="grid grid-cols-2 gap-2 mb-4">
         {systems.map((system) => {
           const Icon = system.icon;
           return (
             <div
               key={system.name}
               className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
             >
               <Icon className="h-3.5 w-3.5 text-muted-foreground" />
               <span className="text-xs font-medium flex-1 truncate">{system.name}</span>
               {system.status === "active" ? (
                 <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
               ) : system.status === "warning" ? (
                 <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
               ) : (
                 <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
               )}
             </div>
           );
         })}
       </div>
 
       {/* Recent Activity */}
       <div>
         <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
           <History className="h-3 w-3" />
           {t("recentActivity")}
         </h4>
         <div className="space-y-1.5 max-h-32 overflow-y-auto">
           {auditLog.length > 0 ? (
             auditLog.slice(0, 5).map((entry, index) => (
               <div
                 key={index}
                 className="flex items-start gap-2 py-1.5 px-2 rounded-md bg-muted/20 text-xs"
               >
                 <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                 <div className="flex-1 min-w-0">
                   <p className="font-medium truncate">{entry.description}</p>
                   <p className="text-muted-foreground">
                     {format(entry.time, "dd MMM, HH:mm")}
                   </p>
                 </div>
               </div>
             ))
           ) : (
             <p className="text-xs text-muted-foreground text-center py-2">
               {t("noRecentActivity")}
             </p>
           )}
         </div>
       </div>
     </div>
   );
 };