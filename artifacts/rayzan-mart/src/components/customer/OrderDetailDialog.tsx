import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Package, MapPin, CreditCard, Truck, Hash, Calendar,
    ShoppingCart, Info, Star
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Order } from "@/hooks/useOrders";
import { useCreateProductReview, useMyProductReviews, useUpdateMyProductReview } from "@/hooks/useProductReviews";
import { toast } from "sonner";

interface OrderDetailDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const OrderDetailDialog = ({ order, open, onOpenChange }: OrderDetailDialogProps) => {
    const { language, t } = useLanguage();
    const createReview = useCreateProductReview();
    const updateMyReview = useUpdateMyProductReview();
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});

    const productIds = useMemo(
        () => ((order?.order_items || []).map((item) => item.product_id).filter(Boolean) as string[]),
        [order]
    );
    const { data: myReviews } = useMyProductReviews(productIds);
    const myReviewMap = new Map((myReviews || []).map((r) => [r.product_id, r]));

    if (!order) return null;

    const statusColors: Record<string, string> = {
        pending: "bg-warning",
        processing: "bg-info",
        shipped: "bg-primary",
        delivered: "bg-success",
        returned: "bg-muted",
        cancelled: "bg-destructive",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        {language === "bn" ? "অর্ডারের বিস্তারিত" : "Order Details"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/30 p-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="text-lg font-bold">{order.order_number}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
                                    year: "numeric", month: "long", day: "numeric"
                                })}
                            </div>
                        </div>
                        <Badge className={`${statusColors[order.status]} text-sm px-3 py-1`}>
                            {t(order.status as any)}
                        </Badge>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Shipping Info */}
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <MapPin className="h-4 w-4 text-primary" />
                                {t("shippingAddress")}
                            </h3>
                            <div className="rounded-lg border p-3 text-sm space-y-1">
                                <p className="font-medium">{order.customer_name}</p>
                                <p>{order.shipping_address}</p>
                                <p className="text-muted-foreground">
                                    {order.city} {order.district ? `, ${order.district}` : ""}
                                </p>
                                <p className="pt-1 text-primary">{order.customer_phone}</p>
                                <div className="mt-2">
                                    <Badge variant="outline" className="text-xs">
                                        <Truck className="mr-1 h-3 w-3" />
                                        {language === "bn"
                                            ? (order.delivery_type === "inside_city" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে")
                                            : (order.delivery_type === "inside_city" ? "Inside Dhaka" : "Outside Dhaka")
                                        }
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <CreditCard className="h-4 w-4 text-primary" />
                                {language === "bn" ? "পেমেন্ট সারাংশ" : "Payment Summary"}
                            </h3>
                            <div className="rounded-lg border p-3 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("subtotal")}</span>
                                    <span>{t("currency")}{Number(order.subtotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("deliveryCharge")}</span>
                                    <span>{t("currency")}{Number(order.delivery_charge).toLocaleString()}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-success">
                                        <span>{t("discount")}</span>
                                        <span>-{t("currency")}{Number(order.discount_amount).toLocaleString()}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>{t("cartTotal")}</span>
                                    <span className="text-primary">{t("currency")}{Number(order.total).toLocaleString()}</span>
                                </div>
                                <div className="pt-1">
                                    <p className="text-xs text-muted-foreground">
                                        {t("paymentMethod")}: {language === "bn"
                                            ? (order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : "অনলাইন পেমেন্ট")
                                            : (order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment")
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tracking Info (if available) */}
                    {(order.tracking_number || order.courier) && (
                        <div className="rounded-lg border border-info/30 bg-info/5 p-4">
                            <h3 className="flex items-center gap-2 font-semibold mb-2 text-info">
                                <Truck className="h-4 w-4" />
                                {language === "bn" ? "ট্র্যাকিং তথ্য" : "Tracking Information"}
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 text-sm">
                                {order.courier && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">{t("courier")}</p>
                                        <p className="font-medium">{order.courier}</p>
                                    </div>
                                )}
                                {order.tracking_number && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">{language === "bn" ? "ট্র্যাকিং নম্বর" : "Tracking Number"}</p>
                                        <p className="font-mono font-medium">{order.tracking_number}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Ordered Items */}
                    <div className="space-y-3">
                        <h3 className="flex items-center gap-2 font-semibold">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            {language === "bn" ? "অর্ডারকৃত পণ্যসমূহ" : "Ordered Items"}
                        </h3>
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="p-3 text-left font-medium">{language === "bn" ? "পণ্য" : "Product"}</th>
                                        <th className="p-3 text-center font-medium">{t("quantity")}</th>
                                        <th className="p-3 text-right font-medium">{t("price")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {order.order_items?.map((item) => (
                                        <tr key={item.id}>
                                            <td className="p-3">
                                                <p className="font-medium">
                                                    {language === "bn" ? item.product_name_bn : item.product_name_en}
                                                </p>
                                                {item.variant_attributes && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {typeof item.variant_attributes === "object"
                                                            ? Object.entries(item.variant_attributes).map(([k, v]) => `${k}: ${v}`).join(", ")
                                                            : String(item.variant_attributes)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">{item.quantity}</td>
                                            <td className="p-3 text-right font-medium">
                                                {t("currency")}{Number(item.total_price).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Customer Note */}
                    {order.notes && (
                        <div className="rounded-lg bg-muted/30 p-4">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground leading-none mb-1">
                                        {t("orderNote")}
                                    </p>
                                    <p className="text-sm">{order.notes}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Review Inputs */}
                    {order.status === "delivered" && (
                        <div className="space-y-3">
                            <h3 className="font-semibold">
                                {language === "bn" ? "পণ্য রিভিউ দিন" : "Review Products"}
                            </h3>
                            <div className="space-y-3">
                                {(order.order_items || [])
                                    .filter((item) => !!item.product_id)
                                    .map((item) => {
                                        const productId = item.product_id as string;
                                        const existingReview = myReviewMap.get(productId);
                                        const alreadyReviewed = !!existingReview;
                                        const rating = ratings[productId] || existingReview?.rating || 5;
                                        const comment = comments[productId] ?? existingReview?.comment ?? "";

                                        return (
                                            <div key={`review-${item.id}`} className="rounded-lg border p-3">
                                                <p className="mb-2 text-sm font-medium">
                                                    {language === "bn" ? item.product_name_bn : item.product_name_en}
                                                </p>
                                                {alreadyReviewed ? (
                                                    <p className="mb-2 text-xs text-muted-foreground">
                                                        {language === "bn"
                                                            ? "আপনি আগে রিভিউ দিয়েছেন, চাইলে আপডেট করতে পারেন"
                                                            : "You already reviewed this product, you can update it"}
                                                    </p>
                                                ) : null}
                                                <>
                                                    <div className="mb-2 flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <button
                                                                key={`${productId}-${s}`}
                                                                onClick={() =>
                                                                    setRatings((prev) => ({ ...prev, [productId]: s }))
                                                                }
                                                                className="transition-transform hover:scale-110"
                                                            >
                                                                <Star
                                                                    className={`h-5 w-5 ${
                                                                        s <= rating ? "fill-warning text-warning" : "text-muted"
                                                                    }`}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <Textarea
                                                        rows={3}
                                                        value={comment}
                                                        onChange={(e) =>
                                                            setComments((prev) => ({ ...prev, [productId]: e.target.value }))
                                                        }
                                                        placeholder={
                                                            language === "bn" ? "আপনার মতামত লিখুন..." : "Write your review..."
                                                        }
                                                    />
                                                    <div className="mt-2">
                                                        <Button
                                                            size="sm"
                                                            disabled={
                                                                createReview.isPending ||
                                                                updateMyReview.isPending ||
                                                                !comment.trim()
                                                            }
                                                            onClick={async () => {
                                                                try {
                                                                    if (existingReview) {
                                                                        await updateMyReview.mutateAsync({
                                                                            reviewId: existingReview.id,
                                                                            productId,
                                                                            rating,
                                                                            comment: comment.trim(),
                                                                        });
                                                                        toast.success(
                                                                            language === "bn"
                                                                                ? "রিভিউ আপডেট হয়েছে"
                                                                                : "Review updated successfully"
                                                                        );
                                                                    } else {
                                                                        await createReview.mutateAsync({
                                                                            productId,
                                                                            orderId: order.id,
                                                                            rating,
                                                                            comment: comment.trim(),
                                                                        });
                                                                        toast.success(
                                                                            language === "bn"
                                                                                ? "রিভিউ সফলভাবে সাবমিট হয়েছে"
                                                                                : "Review submitted successfully"
                                                                        );
                                                                    }
                                                                } catch {
                                                                    toast.error(
                                                                        language === "bn" ? "সমস্যা হয়েছে" : "Something went wrong"
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {existingReview
                                                                ? (language === "bn" ? "রিভিউ আপডেট" : "Update Review")
                                                                : (language === "bn" ? "রিভিউ সাবমিট" : "Submit Review")}
                                                        </Button>
                                                    </div>
                                                </>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
