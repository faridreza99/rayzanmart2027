 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Loader2, Info, History, User, Settings, ShoppingCart, Users } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { useAuditLogs } from "@/hooks/useAdminSettings";
 
 export const AuditLogPanel = () => {
   const { language, t } = useLanguage();
   const { data: logs, isLoading } = useAuditLogs();
   
   // Demo logs for display
   const demoLogs = [
     {
       id: "demo-1",
       action_type: "status_change",
       entity_type: "order",
       description_bn: "অর্ডার স্ট্যাটাস পরিবর্তন: pending → processing",
       description_en: "Order status change: pending → processing",
       created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
     },
     {
       id: "demo-2",
       action_type: "role_change",
       entity_type: "user",
       description_bn: "ইউজার রোল পরিবর্তন: customer → affiliate",
       description_en: "User role change: customer → affiliate",
       created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
     },
     {
       id: "demo-3",
       action_type: "setting_update",
       entity_type: "settings",
       description_bn: "সিস্টেম সেটিংস আপডেট করা হয়েছে",
       description_en: "System settings updated",
       created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
     },
     {
       id: "demo-4",
       action_type: "commission_update",
       entity_type: "commission",
       description_bn: "কমিশন রুল আপডেট: 5% → 7%",
       description_en: "Commission rule update: 5% → 7%",
       created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
     },
     {
       id: "demo-5",
       action_type: "affiliate_status",
       entity_type: "affiliate",
       description_bn: "অ্যাফিলিয়েট সক্রিয় করা হয়েছে",
       description_en: "Affiliate activated",
       created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
     },
   ];
   
   const displayLogs = logs && logs.length > 0 ? logs : demoLogs;
   
   const getActionIcon = (entityType: string) => {
     switch (entityType) {
       case "order": return <ShoppingCart className="h-4 w-4" />;
       case "user": return <User className="h-4 w-4" />;
       case "settings": return <Settings className="h-4 w-4" />;
       case "affiliate": return <Users className="h-4 w-4" />;
       default: return <History className="h-4 w-4" />;
     }
   };
   
   const getActionBadgeColor = (actionType: string) => {
     switch (actionType) {
       case "status_change": return "bg-info";
       case "role_change": return "bg-warning";
       case "setting_update": return "bg-primary";
       case "commission_update": return "bg-success";
       default: return "bg-muted";
     }
   };
   
   const formatTime = (dateStr: string) => {
     const date = new Date(dateStr);
     const now = new Date();
     const diff = now.getTime() - date.getTime();
     
     if (diff < 1000 * 60) return language === "bn" ? "এইমাত্র" : "Just now";
     if (diff < 1000 * 60 * 60) {
       const mins = Math.floor(diff / (1000 * 60));
       return language === "bn" ? `${mins} মিনিট আগে` : `${mins}m ago`;
     }
     if (diff < 1000 * 60 * 60 * 24) {
       const hours = Math.floor(diff / (1000 * 60 * 60));
       return language === "bn" ? `${hours} ঘন্টা আগে` : `${hours}h ago`;
     }
     return date.toLocaleDateString();
   };
   
   if (isLoading) {
     return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
   }
   
   return (
     <div className="space-y-6">
       <Alert className="border-muted bg-muted/30">
         <Info className="h-4 w-4" />
         <AlertDescription className="text-sm">
           {t("auditLogHelper")}
         </AlertDescription>
       </Alert>
       
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="h-5 w-5" />
             {t("recentActions")}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-[50px]"></TableHead>
                   <TableHead>{t("action")}</TableHead>
                  <TableHead>{t("logDescription")}</TableHead>
                   <TableHead className="text-right">{t("time")}</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {displayLogs.map((log: any) => (
                   <TableRow key={log.id}>
                     <TableCell>
                       <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                         {getActionIcon(log.entity_type)}
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge className={getActionBadgeColor(log.action_type)}>
                         {t(log.action_type) || log.action_type}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       {language === "bn" ? log.description_bn : log.description_en}
                     </TableCell>
                     <TableCell className="text-right text-sm text-muted-foreground">
                       {formatTime(log.created_at)}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
           
           {(!logs || logs.length === 0) && (
             <p className="mt-4 text-center text-xs text-muted-foreground">{t("demoData")}</p>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };