import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/hooks/use-cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@workspace/api-client-react";
import { toast } from "sonner";

const DISTRICTS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barishal", "Rangpur", "Mymensingh"];

export default function CheckoutPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();

  const [form, setForm] = useState({
    customerName: user?.profile?.name ?? "",
    customerPhone: user?.profile?.phone ?? "",
    customerEmail: user?.email ?? "",
    shippingAddress: user?.profile?.address ?? "",
    city: user?.profile?.city ?? "",
    district: user?.profile?.district ?? "",
    deliveryType: "inside_city",
    paymentMethod: "cod",
    couponCode: params.get("coupon") ?? "",
    affiliateReferralCode: "",
    notes: "",
    pointsToRedeem: 0,
  });

  function handleField(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }));
  }

  const deliveryCharge = form.deliveryType === "inside_city" ? 60 : 120;
  const finalTotal = total + deliveryCharge;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    if (!form.customerName || !form.customerPhone || !form.shippingAddress) {
      toast.error("Please fill in all required fields"); return;
    }

    createOrder.mutate({
      data: {
        ...form,
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        deliveryType: form.deliveryType as "inside_city" | "outside_city",
        paymentMethod: form.paymentMethod as "cod" | "online",
      },
    }, {
      onSuccess: (order: any) => {
        clearCart();
        toast.success(`Order placed! Order #${order.orderNumber}`);
        setLocation(`/order/${order.id}`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error ?? "Failed to place order");
      },
    });
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg">No items in cart. <a href="/products" className="text-secondary hover:underline">Shop now</a></p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-bold text-foreground mb-4">Delivery Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={form.customerName} onChange={e => handleField("customerName", e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={form.customerPhone} onChange={e => handleField("customerPhone", e.target.value)} required placeholder="01XXXXXXXXX" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label>Email</Label>
                  <Input value={form.customerEmail} onChange={e => handleField("customerEmail", e.target.value)} type="email" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label>Shipping Address *</Label>
                  <Input value={form.shippingAddress} onChange={e => handleField("shippingAddress", e.target.value)} required placeholder="House, Street, Area" className="mt-1" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={e => handleField("city", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>District</Label>
                  <Select value={form.district} onValueChange={v => handleField("district", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-bold text-foreground mb-4">Delivery & Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Type</Label>
                  <Select value={form.deliveryType} onValueChange={v => handleField("deliveryType", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inside_city">Inside Dhaka (৳60)</SelectItem>
                      <SelectItem value="outside_city">Outside Dhaka (৳120)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={form.paymentMethod} onValueChange={v => handleField("paymentMethod", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coupon Code</Label>
                  <Input value={form.couponCode} onChange={e => handleField("couponCode", e.target.value)} placeholder="Optional" className="mt-1" />
                </div>
                <div>
                  <Label>Affiliate Referral Code</Label>
                  <Input value={form.affiliateReferralCode} onChange={e => handleField("affiliateReferralCode", e.target.value)} placeholder="Optional" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label>Order Notes</Label>
                  <Input value={form.notes} onChange={e => handleField("notes", e.target.value)} placeholder="Any special instructions..." className="mt-1" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
              <h2 className="font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                    <span className="truncate flex-1 text-foreground">{item.nameEn} x{item.quantity}</span>
                    <span className="ml-2 font-medium">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>৳{total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>৳{deliveryCharge}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-primary">৳{finalTotal.toLocaleString()}</span>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-red-700 text-white mt-4" disabled={createOrder.isPending}>
                {createOrder.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
