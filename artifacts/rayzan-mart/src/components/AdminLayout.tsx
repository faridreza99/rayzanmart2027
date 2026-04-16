import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, Users, ShoppingBag, Tag, Image, BarChart2, Users2, DollarSign, ChevronRight } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/affiliates", label: "Affiliates", icon: Users2 },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: DollarSign },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/profit-loss", label: "Profit & Loss", icon: BarChart2 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:flex flex-col">
        <div className="px-4 py-5 border-b border-sidebar-border">
          <Link href="/">
            <span className="text-xl font-bold">Rayzan<span className="text-red-400">Mart</span></span>
          </Link>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? location === "/admin" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border">
          <Link href="/" className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground flex items-center gap-1">
            Back to Store <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      <main className="flex-1 bg-background overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
