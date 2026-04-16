 import { useState } from "react";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Loader2, AlertTriangle, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 export type ConfirmationType = "destructive" | "warning" | "info" | "success";
 
 interface ImpactItem {
   label: string;
   value: string | number;
   type?: "neutral" | "positive" | "negative";
 }
 
 interface EnterpriseConfirmDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   title: string;
   description: string;
   type: ConfirmationType;
   impacts?: ImpactItem[];
   requiresConfirmation?: boolean;
   confirmationText?: string;
   onConfirm: () => Promise<void> | void;
   onCancel?: () => void;
   confirmLabel?: string;
   cancelLabel?: string;
   isLoading?: boolean;
   adminNote?: string;
 }
 
 export const EnterpriseConfirmDialog = ({
   open,
   onOpenChange,
   title,
   description,
   type,
   impacts = [],
   requiresConfirmation = false,
   confirmationText = "CONFIRM",
   onConfirm,
   onCancel,
   confirmLabel,
   cancelLabel,
   isLoading = false,
   adminNote,
 }: EnterpriseConfirmDialogProps) => {
    const { t, language } = useLanguage();
    const [confirmInput, setConfirmInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const typeConfig = {
      destructive: {
        icon: ShieldAlert,
        color: "text-destructive",
        bgColor: "bg-destructive/10 border-destructive/30",
        buttonVariant: "destructive" as const,
        warningText: {
          bn: "এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না",
          en: "This action cannot be undone"
        },
      },
      warning: {
        icon: AlertTriangle,
        color: "text-warning",
        bgColor: "bg-warning/10 border-warning/30",
        buttonVariant: "default" as const,
        warningText: {
          bn: "এটি বিদ্যমান ডেটাকে প্রভাবিত করতে পারে",
          en: "This may affect existing data"
        },
      },
      info: {
        icon: Clock,
        color: "text-info",
        bgColor: "bg-info/10 border-info/30",
        buttonVariant: "default" as const,
        warningText: null,
      },
      success: {
        icon: CheckCircle2,
        color: "text-success",
        bgColor: "bg-success/10 border-success/30",
        buttonVariant: "default" as const,
        warningText: null,
      },
    };
 
   const config = typeConfig[type];
   const Icon = config.icon;
 
   const canConfirm = !requiresConfirmation || confirmInput === confirmationText;
 
   const handleConfirm = async () => {
     setIsSubmitting(true);
     try {
       await onConfirm();
       onOpenChange(false);
       setConfirmInput("");
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const handleCancel = () => {
     onCancel?.();
     onOpenChange(false);
     setConfirmInput("");
   };
 
   return (
     <AlertDialog open={open} onOpenChange={onOpenChange}>
       <AlertDialogContent className="max-w-md">
         <AlertDialogHeader>
           <div className="flex items-start gap-3">
             <div className={`rounded-full p-2 ${config.bgColor}`}>
               <Icon className={`h-5 w-5 ${config.color}`} />
             </div>
             <div>
               <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
               <AlertDialogDescription className="text-left mt-1">
                 {description}
               </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {/* Destructive/Warning Banner */}
          {config.warningText && (
            <div className={`flex items-center gap-2 rounded-md border p-3 ${config.bgColor}`}>
              <AlertTriangle className={`h-4 w-4 shrink-0 ${config.color}`} />
              <span className={`text-sm font-medium ${config.color}`}>
                {language === "bn" ? config.warningText.bn : config.warningText.en}
              </span>
            </div>
          )}

          {/* Impact Summary */}
         {impacts.length > 0 && (
           <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
               {t("impactSummary")}
             </p>
             <div className="space-y-1.5">
               {impacts.map((impact, idx) => (
                 <div key={idx} className="flex items-center justify-between text-sm">
                   <span className="text-muted-foreground">{impact.label}</span>
                   <Badge
                     variant={
                       impact.type === "negative"
                         ? "destructive"
                         : impact.type === "positive"
                           ? "default"
                           : "secondary"
                     }
                   >
                     {impact.value}
                   </Badge>
                 </div>
               ))}
             </div>
           </div>
         )}
 
         {/* Admin Note */}
         {adminNote && (
           <Alert className={config.bgColor}>
             <AlertDescription className="text-sm">{adminNote}</AlertDescription>
           </Alert>
         )}
 
         {/* Confirmation Input */}
         {requiresConfirmation && (
           <div className="space-y-2">
             <Label className="text-sm">
               {t("typeToConfirm")}: <code className="font-bold">{confirmationText}</code>
             </Label>
             <Input
               value={confirmInput}
               onChange={(e) => setConfirmInput(e.target.value)}
               placeholder={confirmationText}
               className="font-mono"
             />
           </div>
         )}
 
         <AlertDialogFooter>
           <AlertDialogCancel onClick={handleCancel} disabled={isSubmitting || isLoading}>
             {cancelLabel || t("cancel")}
           </AlertDialogCancel>
           <AlertDialogAction
             onClick={handleConfirm}
             disabled={!canConfirm || isSubmitting || isLoading}
             className={
               type === "destructive"
                 ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                 : ""
             }
           >
             {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {confirmLabel || t("confirm")}
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 };