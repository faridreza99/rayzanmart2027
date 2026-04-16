import { useLocation } from "wouter";
import { useGetMyCommissions } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

export default function AffiliateCommissionsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const { data: commissions } = useGetMyCommissions({ query: {} });

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    paid: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Commission History</h1>

      {!(commissions as any[])?.length ? (
        <p className="text-muted-foreground text-center py-12">No commissions yet</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {(commissions as any[]).map((c: any) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.productNameEn ?? "Order Commission"}</p>
                    {c.productNameBn && <p className="text-xs text-muted-foreground">{c.productNameBn}</p>}
                  </td>
                  <td className="px-4 py-3 font-bold text-secondary">৳{Number(c.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
