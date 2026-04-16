import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useListCategories, useListBrands } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emptyForm = { nameEn: "", nameBn: "", price: "", originalPrice: "", imageUrl: "", categoryId: "", brandId: "", stock: "", sku: "", descriptionEn: "", descriptionBn: "", isFeatured: false, isAffiliate: false, costPrice: "" };

export default function AdminProductsPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, refetch } = useListProducts({ params: { page: String(page), limit: "20" } }, { query: {} });
  const { data: categories } = useListCategories({ query: {} });
  const { data: brands } = useListBrands({ query: {} });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = (data as any)?.products ?? [];
  const totalPages = (data as any)?.totalPages ?? 1;

  function openCreate() { setForm({ ...emptyForm }); setEditingId(null); setShowDialog(true); }
  function openEdit(p: any) {
    setForm({ nameEn: p.nameEn, nameBn: p.nameBn, price: String(p.price), originalPrice: String(p.originalPrice ?? ""), imageUrl: p.imageUrl ?? "", categoryId: p.categoryId ?? "", brandId: p.brandId ?? "", stock: String(p.stock), sku: p.sku ?? "", descriptionEn: p.descriptionEn ?? "", descriptionBn: p.descriptionBn ?? "", isFeatured: p.isFeatured, isAffiliate: p.isAffiliate, costPrice: String(p.costPrice ?? "") });
    setEditingId(p.id);
    setShowDialog(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...form, price: parseFloat(form.price), originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined, stock: parseInt(form.stock), costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined, categoryId: form.categoryId || undefined, brandId: form.brandId || undefined };
    if (editingId) {
      updateProduct.mutate({ id: editingId, data: body as any }, { onSuccess: () => { toast.success("Product updated"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    } else {
      createProduct.mutate({ data: body as any }, { onSuccess: () => { toast.success("Product created"); setShowDialog(false); refetch(); }, onError: () => toast.error("Failed") });
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    deleteProduct.mutate({ id }, { onSuccess: () => { toast.success("Product deleted"); refetch(); }, onError: () => toast.error("Failed") });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Button className="bg-secondary hover:bg-green-700 text-white" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Product</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.nameEn} className="w-10 h-10 rounded object-cover" />}
                    <div>
                      <p className="font-medium">{p.nameEn}</p>
                      <p className="text-xs text-muted-foreground">{p.nameBn}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-primary">৳{Number(p.price).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">{p.rating} ({p.reviewsCount})</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="mr-1"><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-center py-8 text-muted-foreground">No products yet</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="flex items-center px-4 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name (English) *</Label><Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} required className="mt-1" /></div>
              <div><Label>Name (Bengali) *</Label><Input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))} required className="mt-1" /></div>
              <div><Label>Price *</Label><Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number" required className="mt-1" /></div>
              <div><Label>Original Price</Label><Input value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} type="number" className="mt-1" /></div>
              <div><Label>Cost Price</Label><Input value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} type="number" className="mt-1" /></div>
              <div><Label>Stock</Label><Input value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} type="number" className="mt-1" /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="mt-1" /></div>
              <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.categoryId || "none"} onValueChange={v => setForm(f => ({ ...f, categoryId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(categories as any[] ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand</Label>
                <Select value={form.brandId || "none"} onValueChange={v => setForm(f => ({ ...f, brandId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(brands as any[] ?? []).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.nameEn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Description (English)</Label><textarea value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-20 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
              <div className="col-span-2"><Label>Description (Bengali)</Label><textarea value={form.descriptionBn} onChange={e => setForm(f => ({ ...f, descriptionBn: e.target.value }))} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-20 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                <Label htmlFor="isFeatured">Featured Product</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isAffiliate" checked={form.isAffiliate} onChange={e => setForm(f => ({ ...f, isAffiliate: e.target.checked }))} />
                <Label htmlFor="isAffiliate">Affiliate Product</Label>
              </div>
            </div>
            <Button type="submit" className="w-full bg-secondary hover:bg-green-700 text-white" disabled={createProduct.isPending || updateProduct.isPending}>
              {editingId ? "Update Product" : "Create Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
