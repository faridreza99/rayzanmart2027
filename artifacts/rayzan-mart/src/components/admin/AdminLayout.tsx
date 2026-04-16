import { ReactNode, useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { AdminRoleProvider } from "@/contexts/AdminRoleContext";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminLayout = ({ children, activeTab, onTabChange }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (isMobile) setMobileSidebarOpen(false);
  };

  return (
    <AdminRoleProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-background">
        {/* Mobile backdrop overlay */}
        {isMobile && mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "shrink-0 transition-transform duration-300",
            isMobile
              ? cn(
                  "fixed left-0 top-0 z-50 h-full",
                  mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )
              : "relative"
          )}
        >
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={isMobile ? false : sidebarCollapsed}
            onCollapse={
              isMobile
                ? () => setMobileSidebarOpen(false)
                : setSidebarCollapsed
            }
            isMobile={isMobile}
          />
        </div>

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopBar onMobileMenuOpen={() => setMobileSidebarOpen(true)} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <main className="p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
    </AdminRoleProvider>
  );
};
