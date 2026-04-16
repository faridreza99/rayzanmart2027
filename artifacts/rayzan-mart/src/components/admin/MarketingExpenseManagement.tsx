import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Loader2, DollarSign, Calendar, Tag, FileText } from "lucide-react";
import { useMarketingExpenses, useAddMarketingExpense, useUpdateMarketingExpense, useDeleteMarketingExpense, MarketingExpense } from "@/hooks/useMarketingExpenses";
import { format } from "date-fns";

export const MarketingExpenseManagement = () => {
  const { language, t } = useLanguage();
  const { data: expenses, isLoading } = useMarketingExpenses();
  const addExpense = useAddMarketingExpense();
  const updateExpense = useUpdateMarketingExpense();
  const deleteExpense = useDeleteMarketingExpense();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MarketingExpense | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    category: "Ads",
    notes: "",
  });

  const openAddDialog = () => {
    setEditingExpense(null);
    setFormData({
      title: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      category: "Ads",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (expense: MarketingExpense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      notes: expense.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || formData.amount <= 0) return;

    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({
          id: editingExpense.id,
          ...formData,
        });
      } else {
        await addExpense.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const categories = ["Ads", "Social Media", "Influencer", "Sponsorship", "Content", "Other"];

  if (isLoading) {
    return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{language === "bn" ? "মার্কেটিং খরচ" : "Marketing Expenses"}</h2>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "bn" ? "নতুন খরচ যোগ করুন" : "Add New Expense"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              {language === "bn" ? "মোট খরচ" : "Total Spend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")}{expenses?.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-info/5 border-info/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-info" />
              {language === "bn" ? "এই মাসে খরচ" : "This Month"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")}{expenses?.filter(e => {
                const date = new Date(e.date);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-warning" />
              {language === "bn" ? "মোট ট্রানজেকশন" : "Total Transactions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                <TableHead>{language === "bn" ? "শিরোনাম" : "Title"}</TableHead>
                <TableHead>{language === "bn" ? "ক্যাটাগরি" : "Category"}</TableHead>
                <TableHead className="text-right">{language === "bn" ? "পরিমাণ" : "Amount"}</TableHead>
                <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{format(new Date(expense.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{expense.title}</p>
                      {expense.notes && <p className="text-xs text-muted-foreground">{expense.notes}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-[10px] bg-muted font-medium border">
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {t("currency")}{expense.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteExpense.mutate(expense.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {expenses?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    {language === "bn" ? "কোন মার্কেটিং খরচ পাওয়া যায়নি" : "No marketing expenses found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense 
                ? (language === "bn" ? "মার্কেটিং খরচ আপডেট করুন" : "Update Marketing Expense")
                : (language === "bn" ? "নতুন মার্কেটিং খরচ যোগ করুন" : "Add Marketing Expense")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "শিরোনাম" : "Title"}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === "bn" ? "উদা: ফেসবুক অ্যাড ক্যাম্পেইন" : "e.g. Facebook Ad Campaign"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "পরিমাণ (টাকা)" : "Amount (Taka)"}</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "তারিখ" : "Date"}</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "bn" ? "ক্যাটাগরি" : "Category"}</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{language === "bn" ? "বিবরণ (ঐচ্ছিক)" : "Description (Optional)"}</Label>
              <textarea
                className="w-full p-3 rounded-md border border-input bg-background min-h-[100px]"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={language === "bn" ? "অতিরিক্ত তথ্য..." : "Additional details..."}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={addExpense.isPending || updateExpense.isPending}>
              {addExpense.isPending || updateExpense.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {editingExpense ? t("update") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
