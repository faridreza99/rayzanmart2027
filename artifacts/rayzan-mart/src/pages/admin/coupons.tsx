import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListCoupons, useCreateCoupon } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus, Tag } from "lucide-react";

export default function AdminCouponsPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage", value: "", minOrderAmount: "", maxUses: "", expiresAt: "" });

  const { data: coupons, refetch } = useListCoupons({ query: {} });
  const createCoupon = useCreateCoupon();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createCoupon.mutate({ data: { code: form.code, type: form.type as "percentage" | "fixed", value: parseFloat(form.value), minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined, maxUses: form.maxUses ? parseInt(form.maxUses) : undefined, expiresAt: form.expiresAt || undefined } }, {
      onSuccess: () => { toast.success("Coupon created"); setShowDialog(false); refetch(); },
      onError: (err: any) => toast.error(err?.response?.data?.error ?? "Failed"),
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
        <Button className="bg-secondary hover:bg-green-700 text-white" onClick={() => setShowDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Coupon</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(coupons as any[] ?? []).map((c: any) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-secondary" />
                <span className="font-bold font-mono text-lg">{c.code}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                {c.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Discount:</span> <span className="font-medium">{c.type === "percentage" ? `${c.value}%` : `৳${c.value}`}</span></div>
              <div><span className="text-muted-foreground">Used:</span> <span className="font-medium">{c.usedCount}/{c.maxUses ?? "∞"}</span></div>
              {c.minOrderAmount && <div><span className="text-muted-foreground">Min order:</span> <span>৳{c.minOrderAmount}</span></div>}
              {c.expiresAt && <div><span className="text-muted-foreground">Expires:</span> <span>{new Date(c.expiresAt).toLocaleDateString()}</span></div>}
            </div>
          </div>
        ))}
        {!(coupons as any[])?.length && <p className="text-muted-foreground">No coupons yet</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Code *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="SAVE20" className="mt-1 font-mono" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Value *</Label><Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} type="number" required placeholder={form.type === "percentage" ? "20" : "100"} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min Order (৳)</Label><Input value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} type="number" className="mt-1" /></div>
              <div><Label>Max Uses</Label><Input value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} type="number" className="mt-1" /></div>
            </div>
            <div><Label>Expires At</Label><Input value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} type="date" className="mt-1" /></div>
            <Button type="submit" className="w-full bg-secondary hover:bg-green-700 text-white" disabled={createCoupon.isPending}>Create Coupon</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
