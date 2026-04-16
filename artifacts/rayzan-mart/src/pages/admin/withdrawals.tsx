import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListWithdrawals, useUpdateWithdrawalStatus } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminWithdrawalsPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const { data: withdrawals, refetch } = useListWithdrawals({ query: {} });
  const updateStatus = useUpdateWithdrawalStatus();

  function handleStatus(id: string, status: string) {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => { toast.success("Status updated"); refetch(); },
      onError: () => toast.error("Failed"),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Withdrawal Requests</h1>
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Account</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Update</th>
            </tr>
          </thead>
          <tbody>
            {(withdrawals as any[] ?? []).map((w: any) => (
              <tr key={w.id} className="border-t border-border hover:bg-muted/50">
                <td className="px-4 py-3 font-bold text-primary">৳{Number(w.amount).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{w.method}</td>
                <td className="px-4 py-3">{w.accountNumber}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[w.status] ?? 'bg-gray-100'}`}>{w.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Select value={w.status} onValueChange={v => handleStatus(w.id, v)}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending", "processing", "completed", "rejected"].map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!(withdrawals as any[])?.length && <p className="text-center py-8 text-muted-foreground">No withdrawal requests</p>}
      </div>
    </div>
  );
}
