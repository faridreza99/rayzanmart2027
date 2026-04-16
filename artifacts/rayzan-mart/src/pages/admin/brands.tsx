import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

const emptyForm = { nameEn: "", nameBn: "", logoUrl: "", slug: "" };

export default function AdminBrandsPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: brands, refetch } = useListBrands({ query: {} });
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  function openCreate() { setForm({ ...emptyForm }); setEditingId(null); setShowDialog(true); }
  function openEdit(b: any) { setForm({ nameEn: b.nameEn, nameBn: b.nameBn, logoUrl: b.logoUrl ?? "", slug: b.slug ?? "" }); setEditingId(b.id); setShowDialog(true); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateBrand.mutate({ id: editingId, data: form as any }, { onSuccess: () => { toast.success("Brand updated"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    } else {
      createBrand.mutate({ data: form as any }, { onSuccess: () => { toast.success("Brand created"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Brands</h1>
        <Button className="bg-secondary hover:bg-green-700 text-white" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Brand</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(brands as any[] ?? []).map((b: any) => (
          <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {b.logoUrl ? <img src={b.logoUrl} alt={b.nameEn} className="w-10 h-10 object-contain rounded" /> : <div className="w-10 h-10 bg-secondary/20 rounded flex items-center justify-center"><span className="font-bold text-secondary text-sm">{b.nameEn.slice(0, 2)}</span></div>}
              <div>
                <p className="font-medium">{b.nameEn}</p>
                <p className="text-xs text-muted-foreground">{b.nameBn} • {b.productCount} products</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete?")) deleteBrand.mutate({ id: b.id }, { onSuccess: () => { toast.success("Deleted"); refetch(); } }); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Brand" : "Add Brand"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name (English) *</Label><Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} required className="mt-1" /></div>
            <div><Label>Name (Bengali) *</Label><Input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))} required className="mt-1" /></div>
            <div><Label>Logo URL</Label><Input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="mt-1" /></div>
            <Button type="submit" className="w-full bg-secondary hover:bg-green-700 text-white">{editingId ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
