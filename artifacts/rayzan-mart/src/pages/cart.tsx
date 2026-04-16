import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Minus, Plus, ShoppingBag, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart-context";
import { useValidateCoupon } from "@workspace/api-client-react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [, setLocation] = useLocation();
  const validateCoupon = useValidateCoupon();

  function handleValidateCoupon() {
    if (!couponCode.trim()) return;
    validateCoupon.mutate(
      { data: { code: couponCode.trim(), orderAmount: total } },
      {
        onSuccess: (coupon: any) => {
          let discount = 0;
          if (coupon.type === "percentage") discount = total * coupon.value / 100;
          else discount = coupon.value;
          setCouponDiscount(discount);
          setCouponApplied(couponCode.trim());
          toast.success(`Coupon applied! Saving ৳${discount.toFixed(0)}`);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error ?? "Invalid coupon");
        },
      }
    );
  }

  const deliveryCharge = 60;
  const finalTotal = Math.max(0, total + deliveryCharge - couponDiscount);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">আপনার কার্টে কোনো পণ্য নেই</p>
        <Link href="/products">
          <Button className="bg-primary hover:bg-red-700 text-white">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={`${item.productId}-${item.variantId}`} className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.nameEn} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.nameBn}</p>
                <h3 className="font-semibold text-foreground text-sm">{item.nameEn}</h3>
                {item.variantName && <p className="text-xs text-muted-foreground mt-0.5">Variant: {item.variantName}</p>}
                <p className="text-primary font-bold mt-1">৳{item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)} className="p-1.5 hover:bg-muted"><Minus className="w-3 h-3" /></button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)} className="p-1.5 hover:bg-muted"><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => removeItem(item.productId, item.variantId)} className="text-destructive hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span>Subtotal</span><span>৳{total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>৳{deliveryCharge}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-secondary"><span>Coupon ({couponApplied})</span><span>-৳{couponDiscount.toFixed(0)}</span></div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {!couponApplied && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code" className="flex-1 text-sm" />
                  <Button variant="outline" size="sm" onClick={handleValidateCoupon} disabled={validateCoupon.isPending}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button className="w-full bg-primary hover:bg-red-700 text-white" onClick={() => setLocation(`/checkout${couponApplied ? `?coupon=${couponApplied}` : ''}`)}>
              Proceed to Checkout
            </Button>
            <Link href="/products">
              <Button variant="outline" className="w-full mt-3">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
