 import { ReactNode } from "react";
 import { Button } from "@/components/ui/button";
 import { LucideIcon, Package, FileText, Users, Tag, Settings } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 interface EnterpriseEmptyStateProps {
   icon?: LucideIcon;
   title: string;
   description: string;
   actionLabel?: string;
   onAction?: () => void;
   secondaryActionLabel?: string;
   onSecondaryAction?: () => void;
   children?: ReactNode;
 }
 
 export const EnterpriseEmptyState = ({
   icon: Icon = Package,
   title,
   description,
   actionLabel,
   onAction,
   secondaryActionLabel,
   onSecondaryAction,
   children,
 }: EnterpriseEmptyStateProps) => {
   const { t } = useLanguage();
 
   return (
     <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
       <div className="rounded-full bg-muted/50 p-4 mb-4">
         <Icon className="h-8 w-8 text-muted-foreground" />
       </div>
       <h3 className="text-lg font-semibold mb-2">{title}</h3>
       <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
       
       {(actionLabel || secondaryActionLabel) && (
         <div className="flex items-center gap-3">
           {actionLabel && onAction && (
             <Button onClick={onAction}>{actionLabel}</Button>
           )}
           {secondaryActionLabel && onSecondaryAction && (
             <Button variant="outline" onClick={onSecondaryAction}>
               {secondaryActionLabel}
             </Button>
           )}
         </div>
       )}
       
       {children}
     </div>
   );
 };
 
 // Pre-configured empty states for common scenarios
 export const EmptyOrdersState = ({ onAction }: { onAction?: () => void }) => {
   const { t } = useLanguage();
   return (
     <EnterpriseEmptyState
       icon={FileText}
       title={t("noOrdersYet")}
       description={t("noOrdersDescription")}
       actionLabel={t("viewProducts")}
       onAction={onAction}
     />
   );
 };
 
 export const EmptyUsersState = ({ onAction }: { onAction?: () => void }) => {
   const { t } = useLanguage();
   return (
     <EnterpriseEmptyState
       icon={Users}
       title={t("noUsersFound")}
       description={t("noUsersDescription")}
     />
   );
 };
 
 export const EmptyCampaignsState = ({ onAction }: { onAction?: () => void }) => {
   const { t } = useLanguage();
   return (
     <EnterpriseEmptyState
       icon={Tag}
       title={t("noCampaignsYet")}
       description={t("noCampaignsDescription")}
       actionLabel={t("createCampaign")}
       onAction={onAction}
     />
   );
 };
 
 export const EmptyRulesState = ({ onAction }: { onAction?: () => void }) => {
   const { t } = useLanguage();
   return (
     <EnterpriseEmptyState
       icon={Settings}
       title={t("noRulesYet")}
       description={t("noRulesDescription")}
       actionLabel={t("addNewRule")}
       onAction={onAction}
     />
   );
 };