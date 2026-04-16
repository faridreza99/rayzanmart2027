import { Clock, Lock, Rocket } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ComingSoonBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export const ComingSoonBadge = ({ size = "sm", className }: ComingSoonBadgeProps) => {
  const { language } = useLanguage();
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-muted text-muted-foreground border-muted-foreground/20",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        className
      )}
    >
      <Clock className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {language === "bn" ? "শীঘ্রই আসছে" : "Coming Soon"}
    </Badge>
  );
};

interface ComingSoonSectionProps {
  title: string;
  description: string;
  productionNote?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ComingSoonSection = ({
  title,
  description,
  productionNote,
  children,
  className,
}: ComingSoonSectionProps) => {
  const { language } = useLanguage();
  
  return (
    <div className={cn("relative", className)}>
      {/* Overlay for disabled state */}
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px]">
        <div className="mx-4 max-w-md text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {productionNote && (
            <Alert className="mt-4 border-info/30 bg-info/5 text-left">
              <Rocket className="h-4 w-4 text-info" />
              <AlertTitle className="text-info">
                {language === "bn" ? "প্রোডাকশন নোট" : "Production Note"}
              </AlertTitle>
              <AlertDescription className="text-xs text-info/90">
                {productionNote}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      {/* Blurred content behind */}
      <div className="pointer-events-none opacity-50 blur-[1px]">
        {children}
      </div>
    </div>
  );
};

interface FeatureStatusIndicatorProps {
  status: "live" | "demo" | "coming_soon" | "requires_setup";
  className?: string;
}

export const FeatureStatusIndicator = ({ status, className }: FeatureStatusIndicatorProps) => {
  const { language } = useLanguage();
  
  const statusConfig = {
    live: {
      label: { bn: "সক্রিয়", en: "Live" },
      variant: "default" as const,
      className: "bg-green-500/10 text-green-600 border-green-500/30",
    },
    demo: {
      label: { bn: "ডেমো", en: "Demo" },
      variant: "secondary" as const,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    },
    coming_soon: {
      label: { bn: "শীঘ্রই আসছে", en: "Coming Soon" },
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    },
    requires_setup: {
      label: { bn: "সেটআপ প্রয়োজন", en: "Requires Setup" },
      variant: "outline" as const,
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {language === "bn" ? config.label.bn : config.label.en}
    </Badge>
  );
};
