 import { Badge } from "@/components/ui/badge";
 import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
 import { Clock, CheckCircle2, PauseCircle, Archive, Lock, Edit3 } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 export type ItemState = "draft" | "active" | "paused" | "archived";
 
 interface ItemStateIndicatorProps {
   state: ItemState;
   showLabel?: boolean;
   size?: "sm" | "md";
 }
 
 export const ItemStateIndicator = ({
   state,
   showLabel = true,
   size = "md",
 }: ItemStateIndicatorProps) => {
   const { t } = useLanguage();
 
   const stateConfig: Record<ItemState, { icon: typeof Clock; color: string; label: string }> = {
     draft: {
       icon: Edit3,
       color: "bg-muted text-muted-foreground",
       label: t("draft"),
     },
     active: {
       icon: CheckCircle2,
       color: "bg-success/20 text-success border-success/30",
       label: t("active"),
     },
     paused: {
       icon: PauseCircle,
       color: "bg-warning/20 text-warning border-warning/30",
       label: t("paused"),
     },
     archived: {
       icon: Archive,
       color: "bg-muted text-muted-foreground",
       label: t("archived"),
     },
   };
 
   const config = stateConfig[state];
   const Icon = config.icon;
   const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
 
   if (!showLabel) {
     return (
       <Tooltip>
         <TooltipTrigger>
           <div className={`rounded-full p-1 ${config.color}`}>
             <Icon className={iconSize} />
           </div>
         </TooltipTrigger>
         <TooltipContent>{config.label}</TooltipContent>
       </Tooltip>
     );
   }
 
   return (
     <Badge variant="outline" className={`${config.color} gap-1`}>
       <Icon className={iconSize} />
       {config.label}
     </Badge>
   );
 };
 
 // Editing lock indicator
 interface EditingLockProps {
   isLocked: boolean;
   lockedBy?: string;
   lockedAt?: Date;
 }
 
 export const EditingLockIndicator = ({ isLocked, lockedBy, lockedAt }: EditingLockProps) => {
   const { t } = useLanguage();
 
   if (!isLocked) return null;
 
   return (
     <Tooltip>
       <TooltipTrigger>
         <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
           <Lock className="h-3 w-3" />
           {t("currentlyEditing")}
         </Badge>
       </TooltipTrigger>
       <TooltipContent>
         <div className="text-xs">
           {lockedBy && <p>{t("editedBy")}: {lockedBy}</p>}
           {lockedAt && <p>{lockedAt.toLocaleTimeString()}</p>}
         </div>
       </TooltipContent>
     </Tooltip>
   );
 };
 
 // Last updated timestamp
 interface LastUpdatedProps {
   updatedAt: Date | string;
   updatedBy?: string;
 }
 
 export const LastUpdatedIndicator = ({ updatedAt, updatedBy }: LastUpdatedProps) => {
   const { t } = useLanguage();
   const date = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
 
   return (
     <div className="flex items-center gap-1 text-xs text-muted-foreground">
       <Clock className="h-3 w-3" />
       <span>
         {t("lastUpdated")}: {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
       </span>
       {updatedBy && <span className="text-muted-foreground/70">• {updatedBy}</span>}
     </div>
   );
 };