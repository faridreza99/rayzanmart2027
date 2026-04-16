import { Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useAllProductReviews,
  useDeleteProductReview,
  useUpdateProductReviewApproval,
} from "@/hooks/useProductReviews";
import { toast } from "sonner";

export const ProductReviewsPanel = () => {
  const { language } = useLanguage();
  const { data: reviews, isLoading } = useAllProductReviews();
  const updateApproval = useUpdateProductReviewApproval();
  const deleteReview = useDeleteProductReview();

  const handleToggle = async (reviewId: string, productId: string, next: boolean) => {
    try {
      await updateApproval.mutateAsync({ reviewId, productId, isApproved: next });
      toast.success(language === "bn" ? "রিভিউ স্ট্যাটাস আপডেট হয়েছে" : "Review status updated");
    } catch {
      toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Something went wrong");
    }
  };

  const handleDelete = async (reviewId: string, productId: string) => {
    try {
      await deleteReview.mutateAsync({ reviewId, productId });
      toast.success(language === "bn" ? "রিভিউ মুছে ফেলা হয়েছে" : "Review deleted");
    } catch {
      toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "bn" ? "প্রোডাক্ট রিভিউ" : "Product Reviews"}</CardTitle>
      </CardHeader>
      <CardContent>
        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {language === "bn" ? "এখনো কোনো রিভিউ নেই" : "No reviews yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {language === "bn" ? review.product_name_bn : review.product_name_en}
                    </p>
                    <p className="text-sm text-muted-foreground">{review.user_name || "User"}</p>
                    <p className="mt-2 text-sm">{review.comment || "-"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">
                        {language === "bn" ? "রেটিং" : "Rating"}: {review.rating}/5
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {language === "bn" ? "দেখান" : "Visible"}
                      </span>
                      <Switch
                        checked={review.is_approved}
                        onCheckedChange={(next) => handleToggle(review.id, review.product_id, next)}
                        disabled={updateApproval.isPending}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(review.id, review.product_id)}
                      disabled={deleteReview.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
