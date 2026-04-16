 import { ReactNode, useState } from "react";
 import { AdminSidebar } from "./AdminSidebar";
 import { AdminTopBar } from "./AdminTopBar";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { AdminRoleProvider } from "@/contexts/AdminRoleContext";
 
 interface AdminLayoutProps {
   children: ReactNode;
   activeTab: string;
   onTabChange: (tab: string) => void;
 }
 
 export const AdminLayout = ({ children, activeTab, onTabChange }: AdminLayoutProps) => {
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
 
   return (
     <AdminRoleProvider>
     <div className="flex h-screen w-full overflow-hidden bg-background">
       {/* Sidebar */}
       <AdminSidebar
         activeTab={activeTab}
         onTabChange={onTabChange}
         collapsed={sidebarCollapsed}
         onCollapse={setSidebarCollapsed}
       />
 
       {/* Main Content */}
       <div className="flex flex-1 flex-col overflow-hidden">
         {/* Top Bar */}
         <AdminTopBar />
 
         {/* Content Area */}
         <ScrollArea className="flex-1">
           <main className="p-6">{children}</main>
         </ScrollArea>
       </div>
     </div>
     </AdminRoleProvider>
   );
 };