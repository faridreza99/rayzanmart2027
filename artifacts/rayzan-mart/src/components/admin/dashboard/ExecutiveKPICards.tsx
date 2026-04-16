import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, Users, UserCheck } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { cn } from "@/lib/utils";
 
 interface KPIData {
   totalRevenue: number;
   totalOrders: number;
   activeCustomers: number;
   activeAffiliates: number;
   totalProfit: number;
   revenueChange: number;
   ordersChange: number;
   customersChange: number;
   affiliatesChange: number;
   profitChange: number;
 }
 
 interface ExecutiveKPICardsProps {
   data: KPIData;
   isLoading?: boolean;
 }
 
 const TrendIndicator = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
   if (value === 0) {
     return (
       <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
         <Minus className="h-3 w-3" />
         <span>0{suffix}</span>
       </span>
     );
   }
   
   const isPositive = value > 0;
   return (
     <span className={cn(
       "inline-flex items-center gap-0.5 text-xs font-medium",
       isPositive ? "text-success" : "text-destructive"
     )}>
       {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
       <span>{isPositive ? "+" : ""}{value.toFixed(1)}{suffix}</span>
     </span>
   );
 };
 
 export const ExecutiveKPICards = ({ data, isLoading }: ExecutiveKPICardsProps) => {
   const { t, language } = useLanguage();
 
   const kpis = [
     {
       key: "revenue",
       label: t("totalRevenue"),
       value: `${t("currency")}${data.totalRevenue.toLocaleString()}`,
       change: data.revenueChange,
       icon: DollarSign,
       iconBg: "bg-success/10",
       iconColor: "text-success",
     },
     {
       key: "orders",
       label: t("totalOrders"),
       value: data.totalOrders.toLocaleString(),
       change: data.ordersChange,
       icon: ShoppingCart,
       iconBg: "bg-info/10",
       iconColor: "text-info",
     },
     {
       key: "customers",
       label: t("activeCustomers"),
       value: data.activeCustomers.toLocaleString(),
       change: data.customersChange,
       icon: Users,
       iconBg: "bg-primary/10",
       iconColor: "text-primary",
     },
     {
       key: "affiliates",
       label: t("activeAffiliates"),
       value: data.activeAffiliates.toLocaleString(),
       change: data.affiliatesChange,
       icon: UserCheck,
       iconBg: "bg-warning/10",
       iconColor: "text-warning",
     },
     {
       key: "profit",
       label: language === "bn" ? "নিট লাভ" : "Net Profit",
       value: `${t("currency")}${data.totalProfit.toLocaleString()}`,
       change: data.profitChange,
       icon: TrendingUp,
       iconBg: "bg-primary/10",
       iconColor: "text-primary",
     },
   ];
 
   if (isLoading) {
     return (
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
         {[1, 2, 3, 4, 5].map((i) => (
           <div key={i} className="rounded-md border bg-card p-4 animate-pulse">
             <div className="h-4 w-24 bg-muted rounded mb-3" />
             <div className="h-8 w-32 bg-muted rounded mb-2" />
             <div className="h-3 w-20 bg-muted rounded" />
           </div>
         ))}
       </div>
     );
   }
 
   return (
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
       {kpis.map((kpi) => (
         <div
           key={kpi.key}
           className="rounded-md border bg-card p-4 transition-colors hover:bg-muted/30"
         >
           <div className="flex items-start justify-between mb-3">
             <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
               {kpi.label}
             </span>
             <div className={cn("rounded-md p-1.5", kpi.iconBg)}>
               <kpi.icon className={cn("h-4 w-4", kpi.iconColor)} />
             </div>
           </div>
           <div className="space-y-1">
             <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
             <div className="flex items-center gap-2">
               <TrendIndicator value={kpi.change} />
               <span className="text-xs text-muted-foreground">
                 {t("vsLast7Days")}
               </span>
             </div>
           </div>
         </div>
       ))}
     </div>
   );
 };