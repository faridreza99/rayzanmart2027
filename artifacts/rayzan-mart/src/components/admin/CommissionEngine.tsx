import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Info, Percent, DollarSign, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCommissionRules, useCreateCommissionRule, useUpdateCommissionRule } from "@/hooks/useAdminSettings";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { EnterpriseConfirmDialog } from "@/components/admin/EnterpriseConfirmDialog";
import { ItemStateIndicator, LastUpdatedIndicator, ItemState } from "@/components/admin/ItemStateIndicator";
import { EnterpriseEmptyState } from "@/components/admin/EnterpriseEmptyState";
import { ValidationMessage } from "@/components/admin/ValidationMessage";
import { validateCommissionPercentage, SYSTEM_LIMITS } from "@/lib/validation-limits";
import { Settings } from "lucide-react";

export const CommissionEngine = () => {
  const { language, t } = useLanguage();
  const { data: rules, isLoading } = useCommissionRules();
  const { data: productsData, isLoading: productsLoading } = useProducts(undefined, true);
  const createRule = useCreateCommissionRule();
  const updateRule = useUpdateCommissionRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    rule: any;
    action: "activate" | "deactivate";
  }>({ open: false, rule: null, action: "activate" });

  const [formData, setFormData] = useState({
    rule_type: "global" as "global" | "category" | "campaign" | "product",
    name_bn: "",
    name_en: "",
    commission_type: "percentage" as "percentage" | "fixed",
    commission_value: 5,
    min_order_amount: 0,
    product_id: "" as string | null,
    is_active: true,
    start_date: "",
    end_date: "",
    priority: 0,
  });

  const resetForm = () => {
    setFormData({
      rule_type: "global",
      name_bn: "",
      name_en: "",
      commission_type: "percentage",
      commission_value: 5,
      min_order_amount: 0,
      product_id: null,
      is_active: true,
      start_date: "",
      end_date: "",
      priority: 0,
    });
    setEditingRule(null);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      rule_type: rule.rule_type,
      name_bn: rule.name_bn,
      name_en: rule.name_en,
      commission_type: rule.commission_type,
      commission_value: rule.commission_value,
      min_order_amount: rule.min_order_amount || 0,
      product_id: rule.product_id || null,
      is_active: rule.is_active,
      start_date: rule.start_date?.split("T")[0] || "",
      end_date: rule.end_date?.split("T")[0] || "",
      priority: rule.priority,
    });
    setDialogOpen(true);
  };

  // Validation for commission value
  const commissionValidation = useMemo(() => {
    if (formData.commission_type === "percentage") {
      return validateCommissionPercentage(formData.commission_value);
    }
    return { isValid: true, hasWarning: false, severity: "info" as const };
  }, [formData.commission_value, formData.commission_type]);

  const handleSave = async () => {
    // Check validation before saving
    if (!commissionValidation.isValid) {
      toast.error(language === "bn" ? "কমিশন মান সীমার মধ্যে নেই" : "Commission value is out of range");
      return;
    }

    try {
      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        category_id: null,
        product_id: formData.rule_type === "product" ? formData.product_id : null,
      };

      if (editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, ...payload });
      } else {
        await createRule.mutateAsync(payload);
      }

      toast.success(t("settingsSaved"));
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleToggleActive = async (rule: any) => {
    // Open confirmation dialog for high-impact action
    setConfirmDialog({
      open: true,
      rule,
      action: rule.is_active ? "deactivate" : "activate",
    });
  };

  const confirmToggleActive = async () => {
    const { rule, action } = confirmDialog;
    if (!rule) return;

    try {
      await updateRule.mutateAsync({ id: rule.id, is_active: action === "activate" });
      toast.success(
        action === "activate"
          ? t("ruleActivatedMessage")
          : t("ruleDeactivatedMessage")
      );
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  const getItemState = (rule: any): ItemState => {
    if (!rule.is_active) return "paused";
    return "active";
  };

  const ruleTypeColors: Record<string, string> = {
    global: "bg-primary",
    category: "bg-info",
    campaign: "bg-warning",
    product: "bg-purple-500",
  };

  if (isLoading) {
    return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <Alert className="border-warning/30 bg-warning/5">
        <Info className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm text-warning">
          {t("commissionEngineHelper")}
        </AlertDescription>
      </Alert>

      {/* Past transactions note */}
      <Alert className="border-muted bg-muted/30">
        <Info className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-xs text-muted-foreground">
          {t("pastTransactionsNote")}
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("commissionRules")}</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addNewRule")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRule ? t("editRule") : t("addNewRule")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("ruleNameBn")}</Label>
                  <Input
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    placeholder="নতুন কমিশন রুল"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ruleNameEn")}</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="New Commission Rule"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("ruleType")}</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(v) => setFormData({ ...formData, rule_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">{t("globalRule")}</SelectItem>
                      <SelectItem value="category">{t("categoryRule")}</SelectItem>
                      <SelectItem value="campaign">{t("campaignRule")}</SelectItem>
                      <SelectItem value="product">{t("productRule")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("commissionType")}</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(v) => setFormData({ ...formData, commission_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{t("percentage")}</SelectItem>
                      <SelectItem value="fixed">{t("fixedAmount")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.rule_type === "product" && (
                <div className="space-y-2">
                  <Label>{t("selectProduct")}</Label>
                  <Select
                    value={formData.product_id || ""}
                    onValueChange={(v) => setFormData({ ...formData, product_id: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("selectProduct")} />
                    </SelectTrigger>
                    <SelectContent>
                      {productsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : productsData && productsData.length > 0 ? (
                        productsData.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {language === "bn" ? (product.name?.bn || product.name?.en || product.id) : (product.name?.en || product.id)}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {language === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("commissionValue")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.commission_value}
                      onChange={(e) => setFormData({ ...formData, commission_value: Number(e.target.value) })}
                      max={formData.commission_type === "percentage" ? SYSTEM_LIMITS.MAX_COMMISSION_PERCENTAGE : undefined}
                      className={!commissionValidation.isValid ? "border-destructive" : commissionValidation.hasWarning ? "border-warning" : ""}
                    />
                    <span>{formData.commission_type === "percentage" ? "%" : t("currency")}</span>
                  </div>
                  {formData.commission_type === "percentage" && (commissionValidation.hasWarning || !commissionValidation.isValid) && (
                    <ValidationMessage validation={commissionValidation} />
                  )}
                  {formData.commission_type === "percentage" && (
                    <p className="text-xs text-muted-foreground">
                      {language === "bn" ? `সর্বোচ্চ: ${SYSTEM_LIMITS.MAX_COMMISSION_PERCENTAGE}%` : `Maximum: ${SYSTEM_LIMITS.MAX_COMMISSION_PERCENTAGE}%`}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("minOrderAmount")}</Label>
                  <Input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              {formData.rule_type === "campaign" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("startDate")}</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("endDate")}</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("priority")}</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">{t("priorityHelper")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
              <Button onClick={handleSave} disabled={createRule.isPending || updateRule.isPending || (formData.rule_type === "product" && !formData.product_id)}>
                {(createRule.isPending || updateRule.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {rules && rules.length > 0 ? (
          rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? "opacity-70 border-muted" : "border-primary/20"}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {rule.commission_type === "percentage" ? (
                        <Percent className="h-5 w-5 text-primary" />
                      ) : (
                        <DollarSign className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {language === "bn" ? rule.name_bn : rule.name_en}
                        </p>
                        <Badge className={ruleTypeColors[rule.rule_type]}>
                          {t((rule.rule_type + "Rule") as any)}
                        </Badge>
                        <ItemStateIndicator state={getItemState(rule)} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rule.commission_value}{rule.commission_type === "percentage" ? "%" : ` ${t("currency")}`}
                        {rule.min_order_amount > 0 && ` | ${t("minOrder")}: ${t("currency")}${rule.min_order_amount}`}
                        {rule.rule_type === "product" && rule.product_id && productsData && (
                          <span className="ml-1 text-xs italic">
                            ({productsData.find(p => p.id === rule.product_id)?.name?.[language === "bn" ? "bn" : "en"] || "..."})
                          </span>
                        )}
                      </p>
                      <LastUpdatedIndicator updatedAt={(rule as any).updated_at || rule.created_at} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent>
              <EnterpriseEmptyState
                icon={Settings}
                title={t("noRulesYet")}
                description={t("noRulesDescription")}
                actionLabel={t("addNewRule")}
                onAction={openNewDialog}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog for Toggle */}
      <EnterpriseConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={t("confirmCommissionChangeTitle")}
        description={t("confirmCommissionChangeDesc")}
        type={confirmDialog.action === "deactivate" ? "warning" : "success"}
        impacts={[
          {
            label: language === "bn" ? "রুল" : "Rule",
            value: confirmDialog.rule
              ? language === "bn"
                ? confirmDialog.rule.name_bn
                : confirmDialog.rule.name_en
              : "",
          },
          {
            label: t("newStatus"),
            value: confirmDialog.action === "activate" ? t("active") : t("paused"),
            type: confirmDialog.action === "activate" ? "positive" : "negative",
          },
        ]}
        adminNote={t("pastTransactionsNote")}
        onConfirm={confirmToggleActive}
      />
    </div>
  );
};