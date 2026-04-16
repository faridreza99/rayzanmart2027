import { useLocation } from "wouter";
import { Star, ArrowUp, ArrowDown } from "lucide-react";
import { useGetLoyaltyTransactions, useGetMyProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const { data: transactions } = useGetLoyaltyTransactions({ query: {} });
  const { data: profile } = useGetMyProfile({ query: {} });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Loyalty Points</h1>

      <div className="bg-gradient-to-r from-secondary to-green-700 rounded-2xl p-8 text-white text-center mb-8">
        <Star className="w-12 h-12 mx-auto mb-3 fill-yellow-300 text-yellow-300" />
        <p className="text-5xl font-bold">{(profile as any)?.loyaltyPoints ?? 0}</p>
        <p className="text-white/80 mt-2">Available Points</p>
        <p className="text-sm text-white/60 mt-1">1 point = ৳0.25 discount</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h2 className="font-bold mb-2">How to earn points</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Earn 1 point for every ৳10 spent</li>
          <li>• Use points at checkout for discounts</li>
          <li>• Points never expire</li>
        </ul>
      </div>

      <div>
        <h2 className="font-bold text-foreground mb-4">Transaction History</h2>
        {!transactions || (transactions as any[]).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {(transactions as any[]).map((txn: any) => (
              <div key={txn.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === 'earn' ? 'bg-secondary/20' : 'bg-primary/20'}`}>
                    {txn.type === "earn" ? (
                      <ArrowUp className="w-4 h-4 text-secondary" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{txn.descriptionEn}</p>
                    <p className="text-xs text-muted-foreground">{txn.descriptionBn}</p>
                    <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-bold ${txn.type === 'earn' ? 'text-secondary' : 'text-primary'}`}>
                  {txn.type === "earn" ? "+" : "-"}{txn.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
