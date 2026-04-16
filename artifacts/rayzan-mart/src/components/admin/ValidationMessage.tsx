import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ValidationResult } from "@/lib/validation-limits";
import { cn } from "@/lib/utils";

interface ValidationMessageProps {
  validation: ValidationResult;
  className?: string;
}

export const ValidationMessage = ({ validation, className }: ValidationMessageProps) => {
  const { language } = useLanguage();
  
  if (!validation.message) return null;
  
  const severityConfig = {
    error: {
      icon: AlertCircle,
      textColor: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
    },
    warning: {
      icon: AlertTriangle,
      textColor: "text-warning",
      bgColor: "bg-warning/10", 
      borderColor: "border-warning/30",
    },
    info: {
      icon: Info,
      textColor: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/30",
    },
  };
  
  const config = severityConfig[validation.severity];
  const Icon = config.icon;
  const message = language === "bn" ? validation.message.bn : validation.message.en;
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border p-2 text-xs",
        config.bgColor,
        config.borderColor,
        config.textColor,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
