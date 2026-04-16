import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
};

export default function AdminOrdersPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (status !== "all") params.status = status;

  const { data, refetch } = useListOrders({ params }, { query: {} });
  const updateStatus = useUpdateOrderStatus();

  const orders = (data as any)?.orders ?? [];
  const totalPages = (data as any)?.totalPages ?? 1;

  function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    updateStatus.mutate({ id: orderId, data: { status: newStatus } }, {
      onSuccess: () => { toast.success("Status updated"); refetch(); setUpdatingId(null); },
      onError: () => { toast.error("Failed to update status"); setUpdatingId(null); },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Orders</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${status === s ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground hover:bg-secondary/20'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-t border-border hover:bg-muted/50 transition">
                <td className="px-4 py-3 font-medium">#{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                </td>
                <td className="px-4 py-3 font-bold text-primary">৳{Number(o.total).toLocaleString()}</td>
                <td className="px-4 py-3">{o.paymentMethod?.toUpperCase()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Select value={o.status} onValueChange={v => handleStatusChange(o.id, v)} disabled={updatingId === o.id}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.filter(s => s !== "all").map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-center py-8 text-muted-foreground">No orders found</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="flex items-center px-4 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
