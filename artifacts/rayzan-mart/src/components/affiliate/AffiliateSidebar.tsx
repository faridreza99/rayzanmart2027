import { Home, ShoppingBag, Target, Share2, Award, FileText, CreditCard, Gift, LogOut, ChevronRight, ChevronDown, ListTree, Compass, DollarSign, PlayCircle } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AffiliateSidebar = () => {
    const { language } = useLanguage();
    const { logout } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const currentTab = searchParams.get("tab") || "products";
    const categoryId = searchParams.get("category");

    const { data: categories } = useCategories();
    const [catExpanded, setCatExpanded] = useState<Record<string, boolean>>({});
    const [mainCategoriesOpen, setMainCategoriesOpen] = useState(true);

    const toggleCat = (id: string) => setCatExpanded(p => ({ ...p, [id]: !p[id] }));

    const topLevelCategories = categories?.filter((c: any) => !c.parent_id)?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
    const getChildren = (parentId: string) => categories?.filter((c: any) => c.parent_id === parentId)?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

    const menuGroups = [
        {
            title: { en: "Navigation", bn: "নেভিগেশন" },
            icon: Compass,
            items: [
                { id: "home", label: { bn: "হোম", en: "Overview" }, icon: Home, path: "/affiliate" },
                { id: "campaigns", label: { bn: "আফিলিয়েট ক্যাম্পেইন", en: "Campaigns" }, icon: Share2, path: "/affiliate?tab=campaigns" },
                { id: "videos", label: { bn: "ভিডিও ক্যাম্পেইন", en: "Videos" }, icon: PlayCircle, path: "/affiliate?tab=videos" },
                { id: "leaderboard", label: { bn: "লিডারবোর্ড", en: "Leaderboard" }, icon: Award, path: "/affiliate?tab=leaderboard" },
            ]
        },
        {
            title: { en: "Earnings & Analytics", bn: "উপার্জন ও রিপোর্ট" },
            icon: DollarSign,
            items: [
                { id: "payment", label: { bn: "ওয়ালেট এবং উইথড্র", en: "Wallet & Withdraw" }, icon: CreditCard, path: "/affiliate?tab=payment" },
                { id: "report", label: { bn: "রিপোর্ট", en: "Reports" }, icon: FileText, path: "/affiliate?tab=report" },
                { id: "sales_target", label: { bn: "সেলস টার্গেট", en: "Sales Target" }, icon: Target, path: "/affiliate?tab=target" },
            ]
        },
        {
            title: { en: "Store", bn: "স্টোর" },
            icon: ShoppingBag,
            items: [
                { id: "products", label: { bn: "সকল পণ্য", en: "All Products" }, icon: ShoppingBag, path: "/affiliate/products" },
                { id: "offers", label: { bn: "অফার সমূহ", en: "Offers" }, icon: Gift, path: "/affiliate?tab=offers" },
            ]
        }
    ];

    const renderMenuItem = (item: any) => {
        const isHome = item.id === "home" && location.pathname === "/affiliate" && (!searchParams.get("tab") || searchParams.get("tab") === "home");
        const isTabActive = searchParams.get("tab") === item.id;
        const isActive = isHome || isTabActive;

        return (
            <li key={item.id}>
                <Link
                    to={item.path}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all group",
                        isActive
                            ? "bg-[#0070bb]/10 text-[#0070bb]"
                            : "text-slate-600 hover:bg-slate-50 hover:text-[#0070bb]"
                    )}
                >
                    <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-[#0070bb]" : "text-slate-400")} />
                    <span>{language === "bn" ? item.label.bn : item.label.en}</span>
                </Link>
            </li>
        );
    };

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white shadow-sm border-slate-200">
            <div className="p-5 flex items-center gap-3 border-b border-slate-100 mb-2">
                <div className="bg-[#0070bb] rounded-lg p-2 shadow-sm flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-extrabold text-lg text-[#333] leading-tight">Rayzan</span>
                    <span className="font-medium text-[11px] text-[#0070bb] uppercase tracking-wider">{language === "bn" ? "অ্যাফিলিয়েট" : "Affiliate"}</span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
                
                {menuGroups.map((group, idx) => (
                    <div key={idx} className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                            <group.icon className="h-3 w-3" />
                            {language === "bn" ? group.title.bn : group.title.en}
                        </p>
                        <ul className="space-y-1">
                            {group.items.map(renderMenuItem)}
                        </ul>
                    </div>
                ))}

                {topLevelCategories.length > 0 && (
                    <div className="border-t border-slate-100 pt-5 space-y-2 pb-4">
                        <Collapsible open={mainCategoriesOpen} onOpenChange={setMainCategoriesOpen}>
                            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#0070bb] transition-colors">
                                <div className="flex items-center gap-1.5">
                                    <ListTree className="h-3 w-3" />
                                    <span>{language === "bn" ? "ক্যাটাগরি ব্রাউজ" : "Browse Categories"}</span>
                                </div>
                                {mainCategoriesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="mt-2 space-y-1 pl-1">
                                {topLevelCategories.map((cat: any) => {
                                    const children = getChildren(cat.id);
                                    const hasChildren = children.length > 0;
                                    const isSelfActive = categoryId === cat.id;
                                    const isAnyChildActive = children.some((c: any) => c.id === categoryId);
                                    const isExpanded = catExpanded[cat.id] || isAnyChildActive;

                                    if (hasChildren) {
                                        return (
                                            <Collapsible key={cat.id} open={isExpanded} onOpenChange={() => toggleCat(cat.id)}>
                                                <CollapsibleTrigger className={cn(
                                                    "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold transition-all",
                                                    (isSelfActive || isAnyChildActive) ? "text-[#0070bb]" : "text-slate-600 hover:bg-slate-50"
                                                )}>
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name={cat.icon} className="h-3.5 w-3.5 text-slate-400" fallback="📦" />
                                                        <span className="truncate max-w-[140px] text-left">{language === "bn" ? cat.name_bn : cat.name_en}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="ml-5 border-l border-slate-100 pl-2 mt-1 space-y-1">
                                                    <Link
                                                        to={`/affiliate/products?category=${cat.id}`}
                                                        className={cn(
                                                            "block rounded-lg px-2 py-1.5 text-xs transition-colors",
                                                            isSelfActive ? "bg-slate-100 text-[#0070bb] font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                        )}
                                                    >
                                                        {language === "bn" ? "সবগুলো দেখুন" : "View All"}
                                                    </Link>
                                                    {children.map((child: any) => (
                                                        <Link
                                                            key={child.id}
                                                            to={`/affiliate/products?category=${child.id}`}
                                                            className={cn(
                                                                "block rounded-lg px-2 py-1.5 text-xs transition-colors truncate max-w-[130px]",
                                                                categoryId === child.id ? "bg-slate-100 text-[#0070bb] font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                            )}
                                                        >
                                                            {language === "bn" ? child.name_bn : child.name_en}
                                                        </Link>
                                                    ))}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={cat.id}
                                            to={`/affiliate/products?category=${cat.id}`}
                                            className={cn(
                                                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all",
                                                isSelfActive ? "text-[#0070bb] bg-slate-50" : "text-slate-600 hover:bg-slate-50 hover:text-[#0070bb]"
                                            )}
                                        >
                                            <DynamicIcon name={cat.icon} className="h-3.5 w-3.5 text-slate-400" fallback="📦" />
                                            <span className="truncate max-w-[160px]">{language === "bn" ? cat.name_bn : cat.name_en}</span>
                                        </Link>
                                    );
                                })}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                )}

            </nav>

            <div className="border-t border-slate-100 p-4 bg-slate-50">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                >
                    <LogOut className="h-4 w-4" />
                    <span>{language === "bn" ? "সাইন আউট" : "Sign Out"}</span>
                </button>
            </div>
        </div>
    );
};

export default AffiliateSidebar;
