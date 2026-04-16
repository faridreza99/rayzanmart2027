import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplyAffiliate } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function AffiliateApplyPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const [form, setForm] = useState({ paymentMethod: "bkash", paymentDetails: "", websiteUrl: "", marketingPlan: "" });
  const applyAffiliate = useApplyAffiliate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyAffiliate.mutate({ data: form }, {
      onSuccess: () => {
        toast.success("Application submitted! We'll review within 24 hours.");
        setLocation("/affiliate/dashboard");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error ?? "Application failed");
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Apply to Become an Affiliate</h1>
        <p className="text-muted-foreground mt-2">আমাদের অ্যাফিলিয়েট প্রোগ্রামে যোগ দিন</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 space-y-6">
        <div>
          <Label>Payment Method *</Label>
          <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bkash">bKash</SelectItem>
              <SelectItem value="nagad">Nagad</SelectItem>
              <SelectItem value="rocket">Rocket</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Payment Account Number *</Label>
          <Input value={form.paymentDetails} onChange={e => setForm(f => ({ ...f, paymentDetails: e.target.value }))} placeholder="Your bKash/Nagad number" required className="mt-1" />
        </div>

        <div>
          <Label>Website or Social Media URL</Label>
          <Input value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://yoursite.com or facebook.com/yourpage" className="mt-1" />
        </div>

        <div>
          <Label>How will you promote our products?</Label>
          <textarea
            value={form.marketingPlan}
            onChange={e => setForm(f => ({ ...f, marketingPlan: e.target.value }))}
            placeholder="Describe your marketing plan..."
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-24 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <Button type="submit" className="w-full bg-secondary hover:bg-green-700 text-white" disabled={applyAffiliate.isPending}>
          {applyAffiliate.isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
