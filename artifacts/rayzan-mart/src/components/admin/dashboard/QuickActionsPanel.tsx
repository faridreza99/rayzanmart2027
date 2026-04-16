 import { useLanguage } from "@/contexts/LanguageContext";
 import { Plus, Megaphone, Percent, BarChart3, ChevronRight } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface QuickAction {
   key: string;
   label: string;
   icon: typeof Plus;
   color: string;
   onClick: () => void;
 }
 
 interface QuickActionsPanelProps {
   onAddProduct: () => void;
   onCreateCampaign: () => void;
   onChangeCommission: () => void;
   onViewReports: () => void;
   onManageMarketing: () => void;
 }
 
 export const QuickActionsPanel = ({
   onAddProduct,
   onCreateCampaign,
   onChangeCommission,
   onViewReports,
   onManageMarketing,
 }: QuickActionsPanelProps) => {
   const { t } = useLanguage();
 
   const actions: QuickAction[] = [
     {
       key: "addProduct",
       label: t("addNewProduct"),
       icon: Plus,
       color: "bg-success/10 text-success hover:bg-success/20",
       onClick: onAddProduct,
     },
     {
       key: "createCampaign",
       label: t("createCampaign"),
       icon: Megaphone,
       color: "bg-primary/10 text-primary hover:bg-primary/20",
       onClick: onCreateCampaign,
     },
     {
       key: "changeCommission",
       label: t("commissionRules"),
       icon: Percent,
       color: "bg-warning/10 text-warning hover:bg-warning/20",
       onClick: onChangeCommission,
     },
     {
       key: "viewReports",
       label: t("reports"),
       icon: BarChart3,
       color: "bg-info/10 text-info hover:bg-info/20",
       onClick: onViewReports,
     },
     {
       key: "manageMarketing",
       label: t("marketing"),
       icon: Megaphone,
       color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
       onClick: onManageMarketing,
     },
   ];
 
   return (
     <div className="rounded-md border bg-card p-4">
       <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
         {t("quickActions")}
       </h3>
       <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
         {actions.map((action) => {
           const Icon = action.icon;
           return (
             <button
               key={action.key}
               onClick={action.onClick}
               className={cn(
                 "flex items-center gap-2 p-3 rounded-md transition-all",
                 "border border-transparent",
                 action.color,
                 "group"
               )}
             >
               <Icon className="h-4 w-4 shrink-0" />
               <span className="text-xs font-medium flex-1 text-left truncate">
                 {action.label}
               </span>
               <ChevronRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
             </button>
           );
         })}
       </div>
     </div>
   );
 };