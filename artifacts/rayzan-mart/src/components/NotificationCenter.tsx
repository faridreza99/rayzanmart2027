import { useState } from "react";
import { Bell, Package, Tag, Gift, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: "order" | "promo" | "reward";
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  time: string;
  read: boolean;
}

const demoNotifications: Notification[] = [
  {
    id: "1",
    type: "order",
    titleBn: "অর্ডার শিপড হয়েছে",
    titleEn: "Order Shipped",
    descBn: "আপনার অর্ডার #ORD-250205-1234 শিপড হয়েছে",
    descEn: "Your order #ORD-250205-1234 has been shipped",
    time: "2 min",
    read: false,
  },
  {
    id: "2",
    type: "promo",
    titleBn: "ফ্ল্যাশ সেল শুরু!",
    titleEn: "Flash Sale Started!",
    descBn: "সব পণ্যে ৩০% পর্যন্ত ছাড়",
    descEn: "Up to 30% off on all products",
    time: "1 hr",
    read: false,
  },
  {
    id: "3",
    type: "reward",
    titleBn: "লয়্যালটি পয়েন্ট যোগ হয়েছে",
    titleEn: "Loyalty Points Added",
    descBn: "আপনার অ্যাকাউন্টে ৫০ পয়েন্ট যোগ হয়েছে",
    descEn: "50 points added to your account",
    time: "3 hrs",
    read: true,
  },
  {
    id: "4",
    type: "order",
    titleBn: "অর্ডার ডেলিভারড",
    titleEn: "Order Delivered",
    descBn: "আপনার অর্ডার সফলভাবে পৌঁছে গেছে",
    descEn: "Your order has been delivered successfully",
    time: "1 day",
    read: true,
  },
];

export const NotificationCenter = () => {
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(demoNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return Package;
      case "promo":
        return Tag;
      case "reward":
        return Gift;
      default:
        return Bell;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!isAuthenticated) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs pointer-events-none">
              {unreadCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{t("notifications")}</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`flex gap-3 border-b px-4 py-3 transition-colors last:border-0 ${!notification.read ? "bg-primary/5" : ""
                      }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.type === "order"
                        ? "bg-info/10 text-info"
                        : notification.type === "promo"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success/10 text-success"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {language === "bn" ? notification.titleBn : notification.titleEn}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "bn" ? notification.descBn : notification.descEn}
                      </p>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {notification.time} {language === "bn" ? "আগে" : "ago"}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};