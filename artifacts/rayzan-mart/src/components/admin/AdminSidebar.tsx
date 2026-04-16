import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCheck,
  Megaphone,
  Settings,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Menu,
  X,
  Star,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  children?: { id: string; labelKey: string }[];
}

const navItems: NavItem[] = [
  { id: "overview", labelKey: "dashboard", icon: LayoutDashboard },
  {
    id: "sales-group",
    labelKey: "orderManagement",
    icon: ShoppingCart,
    children: [
      { id: "orders", labelKey: "orders" },
      { id: "reports", labelKey: "reports" },
    ],
  },
  {
    id: "catalog",
    labelKey: "catalogManagement",
    icon: FolderTree,
    children: [
      { id: "products", labelKey: "products" },
      { id: "categories", labelKey: "categories" },
      { id: "brands", labelKey: "brandManagement" },
      { id: "reviews", labelKey: "productReviews" },
      { id: "website-feedback", labelKey: "websiteFeedback" },
    ],
  },
  {
    id: "marketing-group",
    labelKey: "marketing",
    icon: Megaphone,
    children: [
      { id: "coupons", labelKey: "couponManagement" },
      { id: "loyalty", labelKey: "loyaltyProgram" },
      { id: "marketing", labelKey: "marketingExpenses" },
      { id: "hero-banners", labelKey: "heroBanners" },
    ],
  },
  {
    id: "affiliate-group",
    labelKey: "affiliateManagement",
    icon: UserCheck,
    children: [
      { id: "affiliates", labelKey: "affiliateManagement" },
      { id: "commissions-mgmt", labelKey: "commissionsManagement" },
      { id: "withdrawals", labelKey: "withdrawals" },
      { id: "commission", labelKey: "commissionRules" },
    ],
  },
  {
    id: "affiliate-landing-mgmt",
    labelKey: "affiliateProgram",
    icon: Star,
    children: [
      { id: "affiliate-faqs", labelKey: "affiliateLandingFAQs" },
      { id: "affiliate-testimonials", labelKey: "affiliateTestimonials" },
      { id: "affiliate-videos", labelKey: "affiliateVideos" },
      { id: "affiliate-page-content", labelKey: "affiliatePageContent" },
    ],
  },
  { id: "users", labelKey: "customerManagement", icon: Users },
  { id: "user-report", labelKey: "userReport", icon: FileText },
  {
    id: "system-group",
    labelKey: "settings",
    icon: Settings,
    children: [
      { id: "settings", labelKey: "systemSettings" },
      { id: "audit", labelKey: "auditLog" },
      { id: "system-info", labelKey: "systemInfo" },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isMobile?: boolean;
}

export const AdminSidebar = ({
  activeTab,
  onTabChange,
  collapsed,
  onCollapse,
  isMobile = false,
}: AdminSidebarProps) => {
  const { t } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["catalog"]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isActive = (id: string) => activeTab === id;

  const isGroupActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => activeTab === child.id);
    }
    return false;
  };

  const handleGroupClick = (item: NavItem) => {
    if (collapsed && !isMobile) {
      // On desktop collapsed mode, expand the sidebar first
      onCollapse(false);
      setExpandedGroups((prev) =>
        prev.includes(item.id) ? prev : [...prev, item.id]
      );
    } else {
      toggleGroup(item.id);
    }
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between border-b px-3 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
              A
            </div>
            <span className="font-semibold text-sm">{t("adminPanel")}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onCollapse(!collapsed)}
        >
          {isMobile ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            if (item.children) {
              const isExpanded = expandedGroups.includes(item.id);
              const groupActive = isGroupActive(item);

              return (
                <Collapsible
                  key={item.id}
                  open={isExpanded && !collapsed}
                  onOpenChange={() => handleGroupClick(item)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        groupActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{t(item.labelKey as any)}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => onTabChange(child.id)}
                          className={cn(
                            "flex w-full items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                            isActive(child.id)
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {t(child.labelKey as any)}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.id)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{t(item.labelKey as any)}</span>}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-3 shrink-0">
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">{t("operationalStatus")}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs font-medium">{t("systemHealth")}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
