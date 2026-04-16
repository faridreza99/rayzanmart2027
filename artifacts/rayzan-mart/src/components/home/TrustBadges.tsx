 import { Shield, Truck, RotateCcw, CreditCard, Headphones } from "lucide-react";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 export const TrustBadges = () => {
   const { t } = useLanguage();
 
   const badges = [
     {
       icon: Truck,
       titleKey: "fastDelivery",
       descKey: "fastDeliveryDesc",
     },
     {
       icon: Shield,
       titleKey: "secureCheckout",
       descKey: "secureCheckoutDesc",
     },
     {
       icon: RotateCcw,
       titleKey: "easyReturns",
       descKey: "easyReturnsDesc",
     },
     {
       icon: CreditCard,
       titleKey: "securePayment",
       descKey: "securePaymentDesc",
     },
     {
       icon: Headphones,
       titleKey: "support247",
       descKey: "support247Desc",
     },
   ];
 
   return (
     <section className="border-t bg-muted/30 py-8">
       <div className="container">
         <h2 className="mb-6 text-center text-2xl font-bold">{t("whyChooseUs")}</h2>
         <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
           {badges.map((badge, index) => (
             <div
               key={index}
               className="flex flex-col items-center rounded-xl bg-card p-4 text-center shadow-sm"
             >
               <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                 <badge.icon className="h-6 w-6 text-primary" />
               </div>
               <h3 className="mb-1 text-sm font-semibold">{t(badge.titleKey as any)}</h3>
               <p className="text-xs text-muted-foreground">{t(badge.descKey as any)}</p>
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 };