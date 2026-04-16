import { Link, useLocation } from "wouter";
import { Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMyOrders } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const { data: orders, isLoading } = useGetMyOrders({ query: {} });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div></div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-8">আপনার কোনো অর্ডার নেই</p>
        <Link href="/products"><Button className="bg-primary hover:bg-red-700 text-white">Start Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order: any) => (
          <Link key={order.id} href={`/order/${order.id}`}>
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-foreground">#{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">৳{Number(order.total).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{order.customerName}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
