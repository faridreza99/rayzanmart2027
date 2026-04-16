import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetMyWithdrawals, useRequestWithdrawal, useGetMyAffiliate } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function AffiliateWithdrawalsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const { data: withdrawals, refetch } = useGetMyWithdrawals({ query: {} });
  const { data: affiliate } = useGetMyAffiliate({ query: {} });
  const requestWithdrawal = useRequestWithdrawal();

  const [form, setForm] = useState({ amount: "", method: "bkash", accountNumber: "" });
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    requestWithdrawal.mutate({ data: { amount: parseFloat(form.amount), method: form.method, accountNumber: form.accountNumber } }, {
      onSuccess: () => { toast.success("Withdrawal request submitted!"); setShowForm(false); refetch(); },
      onError: (err: any) => toast.error(err?.response?.data?.error ?? "Failed to submit withdrawal"),
    });
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const availableBalance = Number((affiliate as any)?.availableBalance ?? 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Withdrawals</h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-bold text-secondary">৳{availableBalance.toLocaleString()}</p>
        </div>
      </div>

      <Button className="mb-6 bg-secondary hover:bg-green-700 text-white" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Request Withdrawal"}
      </Button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Amount (BDT) *</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" min="100" step="0.01" placeholder="Min 100" required className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Max: ৳{availableBalance}</p>
            </div>
            <div>
              <Label>Method *</Label>
              <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Account Number *</Label>
              <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} required placeholder="Your account number" className="mt-1" />
            </div>
          </div>
          <Button type="submit" className="bg-primary hover:bg-red-700 text-white" disabled={requestWithdrawal.isPending}>
            {requestWithdrawal.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {!(withdrawals as any[])?.length ? (
          <p className="text-muted-foreground text-center py-8">No withdrawal requests yet</p>
        ) : (
          (withdrawals as any[]).map((w: any) => (
            <div key={w.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="font-bold">৳{Number(w.amount).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{w.method} — {w.accountNumber}</p>
                <p className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</p>
                {w.adminNotes && <p className="text-xs text-muted-foreground mt-1">Note: {w.adminNotes}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[w.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {w.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
