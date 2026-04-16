import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetOrder } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Package, MapPin, CreditCard, Truck } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  processing: "bg-purple-100 text-purple-800 border-purple-300",
  shipped: "bg-orange-100 text-orange-800 border-orange-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  returned: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) { setLocation("/login"); return null; }

  const { data: order, isLoading } = useGetOrder(id!, { query: { enabled: !!id } });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div></div>;
  if (!order) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><p>Order not found</p><Link href="/orders"><Button variant="outline" className="mt-4">Back to Orders</Button></Link></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order #{(order as any).orderNumber}</h1>
          <p className="text-muted-foreground text-sm">{new Date((order as any).createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[(order as any).status] ?? 'bg-gray-100 text-gray-700'}`}>
          {((order as any).status ?? "").charAt(0).toUpperCase() + ((order as any).status ?? "").slice(1)}
        </span>
      </div>

      {(order as any).trackingNumber && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Truck className="w-5 h-5 text-secondary flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">Tracking: {(order as any).trackingNumber}</p>
            {(order as any).courier && <p className="text-sm text-muted-foreground">via {(order as any).courier}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-secondary" />
            <h3 className="font-semibold">Delivery Info</h3>
          </div>
          <p className="font-medium">{(order as any).customerName}</p>
          <p className="text-sm text-muted-foreground">{(order as any).customerPhone}</p>
          <p className="text-sm text-muted-foreground mt-1">{(order as any).shippingAddress}</p>
          {(order as any).city && <p className="text-sm text-muted-foreground">{(order as any).city}, {(order as any).district}</p>}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-secondary" />
            <h3 className="font-semibold">Payment</h3>
          </div>
          <p className="text-sm"><span className="text-muted-foreground">Method:</span> {(order as any).paymentMethod === "cod" ? "Cash on Delivery" : "Online"}</p>
          <p className="text-sm mt-1"><span className="text-muted-foreground">Delivery:</span> {(order as any).deliveryType === "inside_city" ? "Inside Dhaka" : "Outside Dhaka"}</p>
          {(order as any).couponCode && <p className="text-sm mt-1"><span className="text-muted-foreground">Coupon:</span> {(order as any).couponCode}</p>}
        </div>
      </div>

      {(order as any).items && (order as any).items.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-secondary" />
            <h3 className="font-semibold">Items</h3>
          </div>
          <div className="space-y-2">
            {(order as any).items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{item.productNameEn}</p>
                  <p className="text-xs text-muted-foreground">{item.productNameBn}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">৳{Number(item.unitPrice).toLocaleString()} x {item.quantity}</p>
                  <p className="text-primary font-bold">৳{Number(item.totalPrice).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Price Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{Number((order as any).subtotal).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>৳{Number((order as any).deliveryCharge).toLocaleString()}</span></div>
          {Number((order as any).discountAmount) > 0 && (
            <div className="flex justify-between text-secondary"><span>Discount</span><span>-৳{Number((order as any).discountAmount).toLocaleString()}</span></div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-border pt-2">
            <span>Total</span>
            <span className="text-primary">৳{Number((order as any).total).toLocaleString()}</span>
          </div>
        </div>
        {(order as any).pointsEarned > 0 && (
          <p className="mt-3 text-sm text-secondary font-medium">+{(order as any).pointsEarned} loyalty points earned!</p>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/orders"><Button variant="outline">Back to Orders</Button></Link>
        <Link href="/products"><Button className="bg-primary hover:bg-red-700 text-white">Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
