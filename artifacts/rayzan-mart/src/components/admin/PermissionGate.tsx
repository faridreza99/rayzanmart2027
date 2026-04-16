 import { ReactNode } from "react";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { ShieldX, Lock } from "lucide-react";
 import { useAdminRole, AdminLevel } from "@/contexts/AdminRoleContext";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 interface PermissionGateProps {
   module?: string;
   action?: string;
   requiredLevel?: AdminLevel[];
   children: ReactNode;
   fallback?: ReactNode;
   showWarning?: boolean;
 }
 
 export const PermissionGate = ({
   module,
   action,
   requiredLevel,
   children,
   fallback,
   showWarning = true,
 }: PermissionGateProps) => {
   const { adminLevel, canAccess, canPerformAction } = useAdminRole();
   const { t } = useLanguage();
 
   // Check permission based on criteria
   let hasPermission = true;
 
   if (module) {
     hasPermission = hasPermission && canAccess(module);
   }
 
   if (action) {
     hasPermission = hasPermission && canPerformAction(action);
   }
 
   if (requiredLevel && requiredLevel.length > 0) {
     hasPermission = hasPermission && requiredLevel.includes(adminLevel);
   }
 
   if (hasPermission) {
     return <>{children}</>;
   }
 
   if (fallback) {
     return <>{fallback}</>;
   }
 
   if (showWarning) {
     return (
       <Alert className="border-warning/30 bg-warning/5">
         <ShieldX className="h-4 w-4 text-warning" />
         <AlertDescription className="text-sm text-warning">
           {t("noPermissionWarning")}
         </AlertDescription>
       </Alert>
     );
   }
 
   return null;
 };
 
 // Inline permission indicator for buttons/actions
 interface ActionPermissionProps {
   action: string;
   children: ReactNode;
   disabledFallback?: ReactNode;
 }
 
 export const ActionPermission = ({ action, children, disabledFallback }: ActionPermissionProps) => {
   const { canPerformAction } = useAdminRole();
 
   if (canPerformAction(action)) {
     return <>{children}</>;
   }
 
   if (disabledFallback) {
     return <>{disabledFallback}</>;
   }
 
   // Return children with disabled state
   return (
     <div className="opacity-50 cursor-not-allowed pointer-events-none">
       {children}
     </div>
   );
 };