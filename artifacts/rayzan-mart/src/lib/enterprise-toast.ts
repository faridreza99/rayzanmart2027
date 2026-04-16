 import { toast } from "sonner";
 
 // Enterprise-grade feedback messages with professional tone
 export const enterpriseToast = {
   // Success messages
   saved: (entityBn: string, entityEn: string, lang: "bn" | "en" = "bn") => {
     toast.success(
       lang === "bn" 
         ? `${entityBn} সফলভাবে সংরক্ষিত হয়েছে` 
         : `${entityEn} saved successfully`
     );
   },
 
   activated: (entityBn: string, entityEn: string, lang: "bn" | "en" = "bn") => {
     toast.success(
       lang === "bn"
         ? `${entityBn} সক্রিয় করা হয়েছে এবং নতুন অর্ডারে প্রযোজ্য হবে`
         : `${entityEn} activated and will apply to new orders`
     );
   },
 
   deactivated: (entityBn: string, entityEn: string, lang: "bn" | "en" = "bn") => {
     toast.success(
       lang === "bn"
         ? `${entityBn} নিষ্ক্রিয় করা হয়েছে। পূর্বের ট্রান্সঅ্যাকশনে কোনো প্রভাব পড়বে না।`
         : `${entityEn} deactivated. Past transactions are not affected.`
     );
   },
 
   statusUpdated: (newStatus: string, lang: "bn" | "en" = "bn") => {
     toast.success(
       lang === "bn"
         ? `স্ট্যাটাস "${newStatus}" এ আপডেট হয়েছে`
         : `Status updated to "${newStatus}"`
     );
   },
 
   bulkUpdated: (count: number, lang: "bn" | "en" = "bn") => {
     toast.success(
       lang === "bn"
         ? `${count}টি আইটেম সফলভাবে আপডেট হয়েছে`
         : `${count} items updated successfully`
     );
   },
 
   ruleApplied: (lang: "bn" | "en" = "bn") => {
     toast.success(
       lang === "bn"
         ? "নিয়ম প্রয়োগ হয়েছে এবং নতুন অর্ডারে কার্যকর হবে"
         : "Rule applied and will take effect on new orders"
     );
   },
 
   // Warning messages
   noImpactOnPast: (lang: "bn" | "en" = "bn") => {
     toast.info(
       lang === "bn"
         ? "এই পরিবর্তন পূর্বের ট্রান্সঅ্যাকশনে প্রভাব ফেলবে না"
         : "This change does not affect past transactions"
     );
   },
 
   actionCancelled: (lang: "bn" | "en" = "bn") => {
     toast.info(
       lang === "bn"
         ? "অ্যাকশন বাতিল করা হয়েছে"
         : "Action cancelled"
     );
   },
 
   // Error messages
   operationFailed: (lang: "bn" | "en" = "bn") => {
     toast.error(
       lang === "bn"
         ? "অপারেশন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
         : "Operation failed. Please try again."
     );
   },
 
   permissionDenied: (lang: "bn" | "en" = "bn") => {
     toast.error(
       lang === "bn"
         ? "আপনার এই অ্যাকশনের অনুমতি নেই"
         : "You don't have permission for this action"
     );
   },
 
   // Confirmation messages
   confirmRequired: (lang: "bn" | "en" = "bn") => {
     toast.warning(
       lang === "bn"
         ? "এই অ্যাকশনের জন্য নিশ্চিতকরণ প্রয়োজন"
         : "This action requires confirmation"
     );
   },
 };