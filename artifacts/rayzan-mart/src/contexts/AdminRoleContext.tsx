 import React, { createContext, useContext, useState, ReactNode } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 
 // Simulated admin role levels for enterprise discipline
 export type AdminLevel = "super_admin" | "operations_admin" | "marketing_admin";
 
 interface AdminRoleContextType {
   adminLevel: AdminLevel;
   setAdminLevel: (level: AdminLevel) => void;
   canAccess: (module: string) => boolean;
   canPerformAction: (action: string) => boolean;
   getPermissionWarning: (module: string) => string | null;
 }
 
 const AdminRoleContext = createContext<AdminRoleContextType | undefined>(undefined);
 
 // Permission matrix for different admin levels
 const permissionMatrix: Record<AdminLevel, { modules: string[]; actions: string[] }> = {
   super_admin: {
     modules: ["*"],
     actions: ["*"],
   },
   operations_admin: {
     modules: ["orders", "products", "categories", "brands", "users", "reports"],
     actions: ["order_update", "product_edit", "bulk_update", "view_reports"],
   },
   marketing_admin: {
     modules: ["coupons", "loyalty", "affiliates", "commission", "reports"],
     actions: ["coupon_create", "campaign_manage", "commission_edit", "affiliate_manage"],
   },
 };
 
 export const AdminRoleProvider = ({ children }: { children: ReactNode }) => {
   const { isAdmin } = useAuth();
   // Default to super_admin for demo - in production this would come from DB
   const [adminLevel, setAdminLevel] = useState<AdminLevel>("super_admin");
 
   const canAccess = (module: string): boolean => {
     if (!isAdmin) return false;
     const perms = permissionMatrix[adminLevel];
     return perms.modules.includes("*") || perms.modules.includes(module);
   };
 
   const canPerformAction = (action: string): boolean => {
     if (!isAdmin) return false;
     const perms = permissionMatrix[adminLevel];
     return perms.actions.includes("*") || perms.actions.includes(action);
   };
 
   const getPermissionWarning = (module: string): string | null => {
     if (canAccess(module)) return null;
     return `আপনার "${module}" মডিউলে অ্যাক্সেস নেই। সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।`;
   };
 
   return (
     <AdminRoleContext.Provider
       value={{
         adminLevel,
         setAdminLevel,
         canAccess,
         canPerformAction,
         getPermissionWarning,
       }}
     >
       {children}
     </AdminRoleContext.Provider>
   );
 };
 
 export const useAdminRole = () => {
   const context = useContext(AdminRoleContext);
   if (context === undefined) {
     throw new Error("useAdminRole must be used within an AdminRoleProvider");
   }
   return context;
 };