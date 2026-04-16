import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

const emptyForm = { nameEn: "", nameBn: "", icon: "", slug: "", sortOrder: "0" };

export default function AdminCategoriesPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: categories, refetch } = useListCategories({ query: {} });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  function openCreate() { setForm({ ...emptyForm }); setEditingId(null); setShowDialog(true); }
  function openEdit(c: any) { setForm({ nameEn: c.nameEn, nameBn: c.nameBn, icon: c.icon ?? "", slug: c.slug ?? "", sortOrder: String(c.sortOrder ?? 0) }); setEditingId(c.id); setShowDialog(true); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...form, sortOrder: parseInt(form.sortOrder) };
    if (editingId) {
      updateCategory.mutate({ id: editingId, data: body as any }, { onSuccess: () => { toast.success("Category updated"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    } else {
      createCategory.mutate({ data: body as any }, { onSuccess: () => { toast.success("Category created"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    deleteCategory.mutate({ id }, { onSuccess: () => { toast.success("Deleted"); refetch(); }, onError: () => toast.error("Failed") });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <Button className="bg-secondary hover:bg-green-700 text-white" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Category</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(categories as any[] ?? []).map((c: any) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {c.icon ? <span className="text-2xl">{c.icon}</span> : <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center"><span className="text-secondary text-sm font-bold">{c.nameEn.slice(0, 2)}</span></div>}
              <div>
                <p className="font-medium">{c.nameEn}</p>
                <p className="text-xs text-muted-foreground">{c.nameBn} • {c.productCount} products</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name (English) *</Label><Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} required className="mt-1" /></div>
            <div><Label>Name (Bengali) *</Label><Input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))} required className="mt-1" /></div>
            <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. 👗" className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="mt-1" /></div>
            <div><Label>Sort Order</Label><Input value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} type="number" className="mt-1" /></div>
            <Button type="submit" className="w-full bg-secondary hover:bg-green-700 text-white">{editingId ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
