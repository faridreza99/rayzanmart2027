import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListAffiliates, useUpdateAffiliateStatus } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-100 text-gray-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

export default function AdminAffiliatesPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const { data: affiliates, refetch } = useListAffiliates({ query: {} });
  const updateStatus = useUpdateAffiliateStatus();

  function handleStatus(id: string, status: string) {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => { toast.success("Status updated"); refetch(); },
      onError: () => toast.error("Failed"),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Affiliates</h1>
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Affiliate</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sales</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {(affiliates as any[] ?? []).map((a: any) => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{a.profile?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{a.paymentMethod}: {a.paymentDetails}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{a.referralCode}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[a.tier] ?? ''}`}>{a.tier}</span>
                </td>
                <td className="px-4 py-3">৳{Number(a.totalSales).toLocaleString()}</td>
                <td className="px-4 py-3">৳{Number(a.totalCommission).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-secondary">৳{Number(a.availableBalance).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Select value={a.status} onValueChange={v => handleStatus(a.id, v)}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending", "active", "suspended"].map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!(affiliates as any[])?.length && <p className="text-center py-8 text-muted-foreground">No affiliates yet</p>}
      </div>
    </div>
  );
}
