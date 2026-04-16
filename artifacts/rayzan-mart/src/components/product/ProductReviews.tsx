 import { useMemo, useState } from "react";
 import { Star, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { useAuth } from "@/contexts/AuthContext";
 import { useCreateProductReview, useProductReviews } from "@/hooks/useProductReviews";
 import { toast } from "sonner";
 
 interface ProductReviewsProps {
   productId: string;
   productRating: number;
   reviewCount: number;
 }
 
 export const ProductReviews = ({ productId, productRating, reviewCount }: ProductReviewsProps) => {
   const { language, t } = useLanguage();
   const { isAuthenticated, user } = useAuth();
   const { data: reviews = [], isLoading } = useProductReviews(productId);
   const createReview = useCreateProductReview();
   const [newReview, setNewReview] = useState("");
   const [selectedRating, setSelectedRating] = useState(5);

   const userAlreadyReviewed = !!reviews.find((r: any) => r.user_id === user?.id);
   const canReview = isAuthenticated && !userAlreadyReviewed;

   const reviewStats = useMemo(() => {
     const count = reviews.length;
     if (count === 0) {
       return { avg: productRating, count: reviewCount, distribution: [0, 0, 0, 0, 0] };
     }
     const total = reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0);
     const avg = Number((total / count).toFixed(1));
     const distribution = [1, 2, 3, 4, 5].map(
       (s) => Math.round((reviews.filter((r: any) => r.rating === s).length / count) * 100)
     );
     return { avg, count, distribution };
   }, [reviews, productRating, reviewCount]);
 
   const handleSubmitReview = async () => {
     if (!isAuthenticated) {
       toast.error(t("loginToReview"));
       return;
     }
     if (userAlreadyReviewed) {
       toast.error(language === "bn" ? "আপনি ইতোমধ্যে এই পণ্যে রিভিউ দিয়েছেন" : "You already reviewed this product");
       return;
     }
     if (!newReview.trim()) {
       toast.error(t("writeReviewFirst"));
       return;
     }
     try {
       await createReview.mutateAsync({
         productId,
         orderId: null,
         rating: selectedRating,
         comment: newReview.trim(),
       });
       toast.success(language === "bn"
        ? "রিভিউ জমা হয়েছে! অনুমোদনের পর প্রকাশিত হবে।"
        : "Review submitted! It will appear after admin approval.");
       setNewReview("");
       setSelectedRating(5);
     } catch (error: any) {
       if (error?.code === "23505") {
         toast.error(language === "bn" ? "আপনি ইতোমধ্যে এই পণ্যে রিভিউ দিয়েছেন" : "You already reviewed this product");
       } else {
         toast.error(t("somethingWentWrong"));
       }
     }
   };
 
   return (
     <div className="space-y-6">
       {/* Rating Summary */}
       <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center rounded-xl bg-muted/50 p-6">
          <span className="text-4xl font-bold text-primary">{reviewStats.avg}</span>
          <div className="my-2 flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(reviewStats.avg)
                    ? "fill-warning text-warning"
                    : "text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {reviewStats.count} {t("reviews")}
          </span>
        </div>
 
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((stars, idx) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="w-8 text-sm">{stars}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-warning"
                  style={{ width: `${reviewStats.distribution[4 - idx]}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm text-muted-foreground">
                {reviewStats.distribution[4 - idx]}%
              </span>
            </div>
          ))}
        </div>
      </div>
 
       {/* Write Review */}
       <div className="rounded-xl border bg-card p-4">
         <h4 className="mb-3 font-semibold">{t("writeReview")}</h4>
         {!canReview && (
           <p className="mb-3 text-sm text-muted-foreground">
             {!isAuthenticated
               ? (language === "bn" ? "রিভিউ দিতে লগইন করুন" : "Login to submit a review")
               : (language === "bn" ? "আপনি ইতোমধ্যে এই পণ্যে রিভিউ দিয়েছেন" : "You already reviewed this product")}
           </p>
         )}
         <div className="mb-3 flex items-center gap-2">
           <span className="text-sm">{t("yourRating")}:</span>
           {[1, 2, 3, 4, 5].map((star) => (
             <button
               key={star}
               onClick={() => setSelectedRating(star)}
               className="transition-transform hover:scale-110"
             >
               <Star
                 className={`h-6 w-6 ${
                   star <= selectedRating
                     ? "fill-warning text-warning"
                     : "text-muted"
                 }`}
               />
             </button>
           ))}
         </div>
         <Textarea
           placeholder={t("reviewPlaceholder")}
           value={newReview}
           onChange={(e) => setNewReview(e.target.value)}
           className="mb-3"
           rows={3}
         />
         <div className="flex items-center justify-between">
           <Button
             onClick={handleSubmitReview}
             size="sm"
             disabled={!canReview || createReview.isPending}
           >
             {t("submitReview")}
           </Button>
         </div>
       </div>
 
       {/* Review List */}
       <div className="space-y-4">
         {isLoading ? (
           <p className="text-sm text-muted-foreground">{language === "bn" ? "রিভিউ লোড হচ্ছে..." : "Loading reviews..."}</p>
         ) : reviews.length === 0 ? (
           <p className="text-sm text-muted-foreground">{language === "bn" ? "এখনো কোনো রিভিউ নেই" : "No reviews yet"}</p>
         ) : reviews.map((review: any) => (
           <div key={review.id} className="rounded-xl border bg-card p-4">
             <div className="mb-2 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                   <User className="h-4 w-4" />
                 </div>
                <div>
                  <p className="text-sm font-medium">{review.user_name || "User"}</p>
                   <div className="flex items-center gap-1">
                     {[...Array(5)].map((_, i) => (
                       <Star
                         key={i}
                         className={`h-3 w-3 ${
                           i < review.rating
                             ? "fill-warning text-warning"
                             : "text-muted"
                         }`}
                       />
                     ))}
                   </div>
                 </div>
               </div>
               <span className="text-xs text-muted-foreground">
                 {new Date(review.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
               </span>
             </div>
             <p className="mb-3 text-sm text-muted-foreground">{review.comment || "-"}</p>
           </div>
         ))}
       </div>
     </div>
   );
 };
