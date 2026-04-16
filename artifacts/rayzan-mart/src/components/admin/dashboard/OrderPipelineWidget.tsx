 import { useNavigate } from "react-router-dom";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { cn } from "@/lib/utils";
 import { Package, Clock, Truck, CheckCircle, RotateCcw, XCircle } from "lucide-react";
 
 interface PipelineStatus {
   status: string;
   count: number;
   percentage: number;
 }
 
 interface OrderPipelineWidgetProps {
   data: PipelineStatus[];
   isLoading?: boolean;
   onStatusClick?: (status: string) => void;
 }
 
 const statusConfig: Record<string, { icon: typeof Package; color: string; bg: string }> = {
   pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
   processing: { icon: Package, color: "text-info", bg: "bg-info/10" },
   shipped: { icon: Truck, color: "text-primary", bg: "bg-primary/10" },
   delivered: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
   returned: { icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted" },
   cancelled: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
 };
 
 export const OrderPipelineWidget = ({ data, isLoading, onStatusClick }: OrderPipelineWidgetProps) => {
   const { t } = useLanguage();
   const navigate = useNavigate();
 
   const handleClick = (status: string) => {
     if (onStatusClick) {
       onStatusClick(status);
     }
   };
 
   if (isLoading) {
     return (
       <div className="rounded-md border bg-card p-4">
         <div className="h-5 w-32 bg-muted rounded mb-4 animate-pulse" />
         <div className="space-y-2">
           {[1, 2, 3, 4, 5, 6].map((i) => (
             <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
           ))}
         </div>
       </div>
     );
   }
 
   const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
 
   return (
     <div className="rounded-md border bg-card p-4 h-full">
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
           {t("orderPipeline")}
         </h3>
         <span className="text-xs text-muted-foreground">
           {t("total")}: {totalOrders}
         </span>
       </div>
 
       <div className="space-y-2">
         {data.map((item) => {
           const config = statusConfig[item.status] || statusConfig.pending;
           const Icon = config.icon;
 
           return (
             <button
               key={item.status}
               onClick={() => handleClick(item.status)}
               className={cn(
                 "w-full flex items-center gap-3 p-2.5 rounded-md transition-colors",
                 "hover:bg-muted/50 text-left group"
               )}
             >
               <div className={cn("rounded-md p-1.5 shrink-0", config.bg)}>
                 <Icon className={cn("h-3.5 w-3.5", config.color)} />
               </div>
               
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-sm font-medium capitalize">
                     {t(item.status as any) || item.status}
                   </span>
                   <span className="text-sm font-bold">{item.count}</span>
                 </div>
                 <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                   <div
                     className={cn("h-full rounded-full transition-all", config.bg.replace("/10", ""))}
                     style={{ width: `${item.percentage}%` }}
                   />
                 </div>
               </div>
 
               <span className="text-xs text-muted-foreground shrink-0 w-10 text-right">
                 {item.percentage.toFixed(0)}%
               </span>
             </button>
           );
         })}
       </div>
     </div>
   );
 };