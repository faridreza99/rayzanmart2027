import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetMyAffiliateCampaigns, useCreateAffiliateCampaign } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export default function AffiliateCampaignsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const { data: campaigns, refetch } = useGetMyAffiliateCampaigns({ query: {} });
  const createCampaign = useCreateAffiliateCampaign();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nameEn: "", nameBn: "", url: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createCampaign.mutate({ data: form }, {
      onSuccess: () => { toast.success("Campaign created!"); setShowForm(false); refetch(); },
      onError: (err: any) => toast.error(err?.response?.data?.error ?? "Failed to create campaign"),
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Campaigns</h1>
        <Button className="bg-secondary hover:bg-green-700 text-white" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Campaign"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Campaign Name (English) *</Label>
              <Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <Label>Campaign Name (Bengali) *</Label>
              <Input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))} required className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Target URL (product or category page) *</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required placeholder="https://..." className="mt-1" />
            </div>
          </div>
          <Button type="submit" className="bg-primary hover:bg-red-700 text-white" disabled={createCampaign.isPending}>
            Create Campaign
          </Button>
        </form>
      )}

      {!(campaigns as any[])?.length ? (
        <p className="text-muted-foreground text-center py-12">No campaigns yet. Create your first campaign!</p>
      ) : (
        <div className="space-y-4">
          {(campaigns as any[]).map((c: any) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-foreground">{c.nameEn}</h3>
                  <p className="text-sm text-muted-foreground">{c.nameBn}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{c.clicks}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{c.conversions}</p>
                  <p className="text-xs text-muted-foreground">Conversions</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-secondary">৳{Number(c.earnings).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                </div>
              </div>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary flex items-center gap-1 hover:underline">
                <ExternalLink className="w-3 h-3" />{c.url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
