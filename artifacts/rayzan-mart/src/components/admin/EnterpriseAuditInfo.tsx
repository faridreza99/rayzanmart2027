 import { Clock, User, History } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { Badge } from "@/components/ui/badge";
 import { format } from "date-fns";
 
 interface AuditEntry {
   action: string;
   field?: string;
   oldValue?: string;
   newValue?: string;
   changedBy?: string;
   changedAt: string;
 }
 
 interface EnterpriseAuditInfoProps {
   createdAt?: string;
   createdBy?: string;
   updatedAt?: string;
   updatedBy?: string;
   activityLog?: AuditEntry[];
   compact?: boolean;
 }
 
 export const EnterpriseAuditInfo = ({
   createdAt,
   createdBy,
   updatedAt,
   updatedBy,
   activityLog = [],
   compact = false,
 }: EnterpriseAuditInfoProps) => {
   const { language } = useLanguage();
 
   const formatDate = (date: string) => {
     try {
       return format(new Date(date), "MMM d, yyyy 'at' HH:mm");
     } catch {
       return date;
     }
   };
 
   const getActionLabel = (action: string) => {
     const labels: Record<string, { bn: string; en: string }> = {
       create: { bn: "তৈরি করা হয়েছে", en: "Created" },
       update: { bn: "আপডেট করা হয়েছে", en: "Updated" },
       price_change: { bn: "মূল্য পরিবর্তন", en: "Price changed" },
       status_change: { bn: "স্ট্যাটাস পরিবর্তন", en: "Status changed" },
       category_change: { bn: "ক্যাটাগরি পরিবর্তন", en: "Category changed" },
       stock_update: { bn: "স্টক আপডেট", en: "Stock updated" },
     };
     return labels[action]?.[language] || action;
   };
 
   if (compact) {
     return (
       <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
         {updatedAt && (
           <div className="flex items-center gap-1">
             <Clock className="h-3 w-3" />
             <span>{language === "bn" ? "আপডেট" : "Updated"}: {formatDate(updatedAt)}</span>
           </div>
         )}
         {updatedBy && (
           <div className="flex items-center gap-1">
             <User className="h-3 w-3" />
             <span>{updatedBy}</span>
           </div>
         )}
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg text-sm">
         <div>
           <p className="text-muted-foreground mb-1">
             {language === "bn" ? "তৈরির তারিখ" : "Created"}
           </p>
           <p className="font-medium">{createdAt ? formatDate(createdAt) : "-"}</p>
           {createdBy && <p className="text-xs text-muted-foreground">{createdBy}</p>}
         </div>
         <div>
           <p className="text-muted-foreground mb-1">
             {language === "bn" ? "সর্বশেষ আপডেট" : "Last Updated"}
           </p>
           <p className="font-medium">{updatedAt ? formatDate(updatedAt) : "-"}</p>
           {updatedBy && <p className="text-xs text-muted-foreground">{updatedBy}</p>}
         </div>
       </div>
 
       {activityLog.length > 0 && (
         <div>
           <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
             <History className="h-4 w-4" />
             {language === "bn" ? "সাম্প্রতিক কার্যকলাপ" : "Recent Activity"}
           </h4>
           <div className="space-y-2 max-h-[200px] overflow-y-auto">
             {activityLog.slice(0, 5).map((entry, idx) => (
               <div
                 key={idx}
                 className="flex items-start gap-2 p-2 bg-muted/20 rounded text-sm"
               >
                 <Badge variant="outline" className="text-xs shrink-0">
                   {getActionLabel(entry.action)}
                 </Badge>
                 <div className="flex-1 min-w-0">
                   {entry.field && (
                     <span className="text-muted-foreground">{entry.field}: </span>
                   )}
                   {entry.oldValue && (
                     <span className="line-through text-muted-foreground">{entry.oldValue}</span>
                   )}
                   {entry.oldValue && entry.newValue && " → "}
                   {entry.newValue && <span className="font-medium">{entry.newValue}</span>}
                 </div>
                 <span className="text-xs text-muted-foreground shrink-0">
                   {formatDate(entry.changedAt)}
                 </span>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 };