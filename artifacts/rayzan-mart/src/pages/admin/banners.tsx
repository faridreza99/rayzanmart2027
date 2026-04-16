import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Image } from "lucide-react";

const emptyForm = { imageUrl: "", titleEn: "", titleBn: "", subtitleEn: "", subtitleBn: "", link: "", orderIndex: "0" };

export default function AdminBannersPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: banners, refetch } = useListBanners({ query: {} });
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  function openCreate() { setForm({ ...emptyForm }); setEditingId(null); setShowDialog(true); }
  function openEdit(b: any) { setForm({ imageUrl: b.imageUrl, titleEn: b.titleEn, titleBn: b.titleBn, subtitleEn: b.subtitleEn ?? "", subtitleBn: b.subtitleBn ?? "", link: b.link ?? "", orderIndex: String(b.orderIndex ?? 0) }); setEditingId(b.id); setShowDialog(true); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...form, orderIndex: parseInt(form.orderIndex) };
    if (editingId) {
      updateBanner.mutate({ id: editingId, data: body as any }, { onSuccess: () => { toast.success("Banner updated"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    } else {
      createBanner.mutate({ data: body as any }, { onSuccess: () => { toast.success("Banner created"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Hero Banners</h1>
        <Button className="bg-secondary hover:bg-green-700 text-white" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Banner</Button>
      </div>

      <div className="space-y-4">
        {(banners as any[] ?? []).map((b: any) => (
          <div key={b.id} className="bg-card border border-border rounded-xl overflow-hidden flex gap-4">
            <div className="w-32 h-24 flex-shrink-0 bg-muted">
              {b.imageUrl ? <img src={b.imageUrl} alt={b.titleEn} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-6 h-6 text-muted-foreground" /></div>}
            </div>
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{b.titleEn}</h3>
                  <p className="text-sm text-muted-foreground">{b.titleBn}</p>
                  {b.subtitleEn && <p className="text-xs text-muted-foreground mt-1">{b.subtitleEn}</p>}
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-muted-foreground">Order: {b.orderIndex}</span>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete?")) deleteBanner.mutate({ id: b.id }, { onSuccess: () => { toast.success("Deleted"); refetch(); } }); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {b.link && <p className="text-xs text-secondary mt-2">{b.link}</p>}
            </div>
          </div>
        ))}
        {!(banners as any[])?.length && <p className="text-muted-foreground">No banners yet</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Banner" : "Add Banner"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Image URL *</Label><Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} required className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title (English) *</Label><Input value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))} required className="mt-1" /></div>
              <div><Label>Title (Bengali) *</Label><Input value={form.titleBn} onChange={e => setForm(f => ({ ...f, titleBn: e.target.value }))} required className="mt-1" /></div>
              <div><Label>Subtitle (English)</Label><Input value={form.subtitleEn} onChange={e => setForm(f => ({ ...f, subtitleEn: e.target.value }))} className="mt-1" /></div>
              <div><Label>Subtitle (Bengali)</Label><Input value={form.subtitleBn} onChange={e => setForm(f => ({ ...f, subtitleBn: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Link (URL)</Label><Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className="mt-1" /></div>
            <div><Label>Order Index</Label><Input value={form.orderIndex} onChange={e => setForm(f => ({ ...f, orderIndex: e.target.value }))} type="number" className="mt-1" /></div>
            <Button type="submit" className="w-full bg-secondary hover:bg-green-700 text-white">{editingId ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
