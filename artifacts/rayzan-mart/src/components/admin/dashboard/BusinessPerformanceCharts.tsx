 import { useState } from "react";
 import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { cn } from "@/lib/utils";
 
 type DateRange = "today" | "7days" | "30days";
 
 interface ChartData {
   date: string;
   revenue: number;
   orders: number;
   affiliateSales?: number;
 }
 
 interface BusinessPerformanceChartsProps {
   data: ChartData[];
   isLoading?: boolean;
 }
 
 export const BusinessPerformanceCharts = ({ data, isLoading }: BusinessPerformanceChartsProps) => {
   const { t, language } = useLanguage();
   const [dateRange, setDateRange] = useState<DateRange>("7days");
 
   const dateFilters: { key: DateRange; label: string }[] = [
     { key: "today", label: t("today") },
     { key: "7days", label: t("last7Days") },
     { key: "30days", label: t("last30Days") },
   ];
 
   const filteredData = data.slice(
     dateRange === "today" ? -1 : dateRange === "7days" ? -7 : -30
   );
 
   if (isLoading) {
     return (
       <div className="rounded-md border bg-card p-4">
         <div className="h-6 w-48 bg-muted rounded mb-4 animate-pulse" />
         <div className="h-64 bg-muted/50 rounded animate-pulse" />
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       {/* Header with filters */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
         <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
           {t("businessPerformance")}
         </h3>
         <div className="flex gap-1 p-0.5 rounded-md bg-muted/50">
           {dateFilters.map((filter) => (
             <button
               key={filter.key}
               onClick={() => setDateRange(filter.key)}
               className={cn(
                 "px-3 py-1 text-xs font-medium rounded transition-colors",
                 dateRange === filter.key
                   ? "bg-background text-foreground shadow-sm"
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               {filter.label}
             </button>
           ))}
         </div>
       </div>
 
       {/* Charts Grid */}
       <div className="grid gap-4 lg:grid-cols-2">
         {/* Revenue Trend */}
         <div className="rounded-md border bg-card p-4">
           <h4 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
             {t("revenueTrend")}
           </h4>
           <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                 <defs>
                   <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                     <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis 
                   dataKey="date" 
                   tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                   axisLine={{ stroke: "hsl(var(--border))" }}
                 />
                 <YAxis 
                   tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                   axisLine={{ stroke: "hsl(var(--border))" }}
                   tickFormatter={(value) => `${value / 1000}k`}
                 />
                 <Tooltip
                   contentStyle={{
                     backgroundColor: "hsl(var(--card))",
                     border: "1px solid hsl(var(--border))",
                     borderRadius: "6px",
                     fontSize: "12px",
                   }}
                   formatter={(value: number) => [`${t("currency")}${value.toLocaleString()}`, t("revenue")]}
                 />
                 <Area
                   type="monotone"
                   dataKey="revenue"
                   stroke="hsl(var(--success))"
                   strokeWidth={2}
                   fill="url(#revenueGradient)"
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
         </div>
 
         {/* Orders & Affiliate Contribution */}
         <div className="rounded-md border bg-card p-4">
           <h4 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
             {t("orderVolumeAffiliate")}
           </h4>
           <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={filteredData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis 
                   dataKey="date" 
                   tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                   axisLine={{ stroke: "hsl(var(--border))" }}
                 />
                 <YAxis 
                   tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                   axisLine={{ stroke: "hsl(var(--border))" }}
                 />
                 <Tooltip
                   contentStyle={{
                     backgroundColor: "hsl(var(--card))",
                     border: "1px solid hsl(var(--border))",
                     borderRadius: "6px",
                     fontSize: "12px",
                   }}
                 />
                 <Legend 
                   wrapperStyle={{ fontSize: "11px" }}
                   formatter={(value) => (
                     <span className="text-muted-foreground">
                       {value === "orders" ? t("orders") : t("affiliateSales")}
                     </span>
                   )}
                 />
                 <Bar dataKey="orders" fill="hsl(var(--info))" radius={[2, 2, 0, 0]} />
                 <Bar dataKey="affiliateSales" fill="hsl(var(--warning))" radius={[2, 2, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
       </div>
     </div>
   );
 };