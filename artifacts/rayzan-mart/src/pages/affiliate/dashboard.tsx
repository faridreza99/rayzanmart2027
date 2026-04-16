import { Link, useLocation } from "wouter";
import { DollarSign, Users, BarChart2, Clock, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMyAffiliate, useGetMyCommissions } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-700 bg-amber-100",
  silver: "text-gray-600 bg-gray-100",
  gold: "text-yellow-700 bg-yellow-100",
  platinum: "text-purple-700 bg-purple-100",
};

export default function AffiliateDashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const { data: affiliate, isLoading } = useGetMyAffiliate({ query: {} });
  const { data: commissions } = useGetMyCommissions({ query: {} });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div></div>;

  if (!affiliate) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">You're not an affiliate yet</h2>
        <p className="text-muted-foreground mb-8">Join our affiliate program to start earning</p>
        <Link href="/affiliate/apply"><Button className="bg-primary hover:bg-red-700 text-white px-8">Apply Now</Button></Link>
      </div>
    );
  }

  const aff = affiliate as any;
  const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${BASE_URL}/?ref=${aff.referralCode}`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Affiliate Dashboard</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[aff.status] ?? 'bg-gray-100'}`}>
              {aff.status?.charAt(0).toUpperCase() + aff.status?.slice(1)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[aff.tier] ?? ''}`}>
              {aff.tier?.charAt(0).toUpperCase() + aff.tier?.slice(1)} Tier
            </span>
            <span className="text-xs text-muted-foreground">{aff.commissionRate}% commission</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/affiliate/campaigns"><Button variant="outline" size="sm">Campaigns</Button></Link>
          <Link href="/affiliate/withdrawals"><Button variant="outline" size="sm">Withdrawals</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Sales", value: `৳${Number(aff.totalSales).toLocaleString()}`, icon: DollarSign, color: "text-secondary" },
          { label: "Total Commission", value: `৳${Number(aff.totalCommission).toLocaleString()}`, icon: BarChart2, color: "text-primary" },
          { label: "Available Balance", value: `৳${Number(aff.availableBalance).toLocaleString()}`, icon: DollarSign, color: "text-secondary" },
          { label: "Total Clicks", value: aff.totalClicks ?? 0, icon: Users, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-foreground mb-3">Your Referral Link</h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {referralLink}
          </div>
          <Button onClick={copyLink} className="bg-secondary hover:bg-green-700 text-white flex-shrink-0">
            <Copy className="w-4 h-4 mr-2" />Copy
          </Button>
          <Button variant="outline" onClick={() => window.open(referralLink, "_blank")} className="flex-shrink-0">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Referral Code: <strong>{aff.referralCode}</strong></p>
      </div>

      {/* Recent Commissions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-foreground">Recent Commissions</h3>
          <Link href="/affiliate/commissions"><Button variant="outline" size="sm">View All</Button></Link>
        </div>
        {!(commissions as any[])?.length ? (
          <p className="text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">No commissions yet. Share your link to start earning!</p>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {(commissions as any[]).slice(0, 5).map((c: any) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3">{c.productNameEn ?? "Order Commission"}</td>
                    <td className="px-4 py-3 font-medium text-secondary">৳{Number(c.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
    </div>
  );
}
