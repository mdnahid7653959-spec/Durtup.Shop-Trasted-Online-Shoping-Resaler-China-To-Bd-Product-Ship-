import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertTriangle, 
  Percent, 
  ArrowRight, 
  Calculator, 
  RefreshCw, 
  Sliders, 
  ShieldAlert, 
  Check, 
  History, 
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getInMemoryProducts } from "@/utils/mohasagorCache";
import { logAdminActivity } from "@/services/auditLogger";
import { useToast } from "@/hooks/use-toast";

export interface PricingRule {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number; // e.g. 15 for 15% or 100 for ৳100
  scope_type: "all" | "category" | "supplier" | "price_tier";
  scope_value?: string; // category name or supplier name
  min_margin?: number; // minimum profit in BDT
  max_discount?: number; // maximum discount % allowed
  rounding: "none" | "round_9" | "round_10" | "round_50";
  preserve_manual: boolean;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PRICING_RULES: PricingRule[] = [
  {
    id: "rule-mohasagor-standard",
    name: "Mohasagor Standard 20% Markup",
    type: "percentage",
    value: 20,
    scope_type: "supplier",
    scope_value: "Mohasagor",
    min_margin: 50,
    max_discount: 30,
    rounding: "round_9",
    preserve_manual: true,
    priority: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "rule-electronics-margin",
    name: "Electronics Tier Markup (15%)",
    type: "percentage",
    value: 15,
    scope_type: "category",
    scope_value: "Electronics",
    min_margin: 100,
    max_discount: 25,
    rounding: "round_10",
    preserve_manual: true,
    priority: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AdminPricing() {
  const { toast } = useToast();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState<number>(15);
  const [formScopeType, setFormScopeType] = useState<"all" | "category" | "supplier">("all");
  const [formScopeValue, setFormScopeValue] = useState<string>("");
  const [formMinMargin, setFormMinMargin] = useState<number>(50);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number>(30);
  const [formRounding, setFormRounding] = useState<"none" | "round_9" | "round_10" | "round_50">("round_9");
  const [formPreserveManual, setFormPreserveManual] = useState<boolean>(true);
  const [formPriority, setFormPriority] = useState<number>(1);

  // Calculator Sandbox
  const [calcCost, setCalcCost] = useState<number>(500);
  const [selectedCalcRuleId, setSelectedCalcRuleId] = useState<string>("");

  // Bulk Apply Modal
  const [bulkModalRule, setBulkModalRule] = useState<PricingRule | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Load Rules and Products
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Rules from Firestore or local
      const rulesList: PricingRule[] = [];
      try {
        if (db) {
          const snap = await getDocs(collection(db, "pricing_rules"));
          snap.forEach((d) => {
            rulesList.push({ id: d.id, ...d.data() } as PricingRule);
          });
        }
      } catch (e) {}

      if (rulesList.length === 0) {
        const rawLocal = localStorage.getItem("durtup_pricing_rules");
        if (rawLocal) {
          rulesList.push(...JSON.parse(rawLocal));
        } else {
          rulesList.push(...DEFAULT_PRICING_RULES);
          localStorage.setItem("durtup_pricing_rules", JSON.stringify(DEFAULT_PRICING_RULES));
        }
      }

      setRules(rulesList);
      if (rulesList.length > 0 && !selectedCalcRuleId) {
        setSelectedCalcRuleId(rulesList[0].id);
      }

      // 2. Load Catalog Products for simulations
      const prodsMap = new Map<string, any>();
      try {
        const mem = getInMemoryProducts();
        if (mem) {
          mem.forEach((p) => prodsMap.set(String(p.id), p));
        }
      } catch {}

      try {
        if (db) {
          const pSnap = await getDocs(collection(db, "products"));
          pSnap.forEach((d) => prodsMap.set(d.id, { id: d.id, ...d.data() }));
        }
      } catch {}

      setCatalogProducts(Array.from(prodsMap.values()));
    } catch (err) {
      console.error("Pricing load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Rule
  const handleSaveRule = async () => {
    if (!formName.trim()) {
      toast({ title: "Name required", description: "Please enter a rule name", variant: "destructive" });
      return;
    }

    const ruleData: PricingRule = {
      id: editingRule ? editingRule.id : `rule-${Date.now()}`,
      name: formName,
      type: formType,
      value: Number(formValue) || 0,
      scope_type: formScopeType,
      scope_value: formScopeValue,
      min_margin: Number(formMinMargin) || 0,
      max_discount: Number(formMaxDiscount) || 0,
      rounding: formRounding,
      preserve_manual: formPreserveManual,
      priority: Number(formPriority) || 1,
      is_active: editingRule ? editingRule.is_active : true,
      created_at: editingRule ? editingRule.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (db) {
        await setDoc(doc(db, "pricing_rules", ruleData.id), ruleData);
      }
    } catch (e) {
      console.warn("Firestore save rule fallback to local:", e);
    }

    const updated = editingRule 
      ? rules.map(r => r.id === ruleData.id ? ruleData : r)
      : [...rules, ruleData];

    setRules(updated);
    localStorage.setItem("durtup_pricing_rules", JSON.stringify(updated));

    await logAdminActivity({
      action: editingRule ? "UPDATE_PRICING_RULE" : "CREATE_PRICING_RULE",
      entity_type: "price",
      entity_id: ruleData.id,
      entity_name: ruleData.name,
      new_value: ruleData,
      details: `${ruleData.type === "percentage" ? `${ruleData.value}%` : `৳${ruleData.value}`} markup rule saved`,
    });

    toast({
      title: editingRule ? "Rule Updated" : "Rule Created",
      description: `Rule "${ruleData.name}" has been saved.`,
    });

    setIsModalOpen(false);
    setEditingRule(null);
  };

  // Delete Rule
  const handleDeleteRule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete rule "${name}"?`)) return;

    try {
      if (db) {
        await deleteDoc(doc(db, "pricing_rules", id));
      }
    } catch {}

    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    localStorage.setItem("durtup_pricing_rules", JSON.stringify(updated));

    await logAdminActivity({
      action: "DELETE_PRICING_RULE",
      entity_type: "price",
      entity_id: id,
      entity_name: name,
      details: `Rule deleted by administrator`,
    });

    toast({ title: "Rule Deleted", description: `Rule "${name}" was removed.` });
  };

  // Toggle Rule Status
  const handleToggleActive = async (rule: PricingRule) => {
    const updatedRule = { ...rule, is_active: !rule.is_active, updated_at: new Date().toISOString() };
    try {
      if (db) {
        await setDoc(doc(db, "pricing_rules", rule.id), updatedRule);
      }
    } catch {}

    const updated = rules.map(r => r.id === rule.id ? updatedRule : r);
    setRules(updated);
    localStorage.setItem("durtup_pricing_rules", JSON.stringify(updated));

    toast({
      title: updatedRule.is_active ? "Rule Activated" : "Rule Deactivated",
      description: `Rule "${rule.name}" is now ${updatedRule.is_active ? "active" : "inactive"}.`,
    });
  };

  // Calculate Proposed Price for a given cost & rule
  const calculatePrice = (cost: number, rule: PricingRule) => {
    let markup = rule.type === "percentage" ? (cost * rule.value) / 100 : rule.value;
    if (rule.min_margin && markup < rule.min_margin) {
      markup = rule.min_margin;
    }

    let calculated = cost + markup;

    // Apply Rounding
    if (rule.rounding === "round_9") {
      calculated = Math.ceil(calculated / 10) * 10 - 1;
      if (calculated < cost + (rule.min_margin || 0)) {
        calculated += 10;
      }
    } else if (rule.rounding === "round_10") {
      calculated = Math.ceil(calculated / 10) * 10;
    } else if (rule.rounding === "round_50") {
      calculated = Math.ceil(calculated / 50) * 50;
    }

    const margin = calculated - cost;
    const marginPct = cost > 0 ? ((margin / cost) * 100).toFixed(1) : "0";

    return {
      sellingPrice: Math.round(calculated),
      markupAmount: Math.round(margin),
      marginPercentage: marginPct,
    };
  };

  // Active Rule for Sandbox
  const activeCalcRule = rules.find(r => r.id === selectedCalcRuleId) || rules[0];
  const calcResult = activeCalcRule ? calculatePrice(calcCost, activeCalcRule) : null;

  // Affected Products for Bulk Reprice Simulation
  const affectedProducts = useMemo(() => {
    if (!bulkModalRule) return [];
    return catalogProducts
      .filter((p) => {
        if (bulkModalRule.scope_type === "category" && bulkModalRule.scope_value) {
          const pCat = (p.category || p.category_name || "").toLowerCase();
          return pCat.includes(bulkModalRule.scope_value.toLowerCase());
        }
        if (bulkModalRule.scope_type === "supplier" && bulkModalRule.scope_value) {
          const pSup = (p.supplier || p.source || "mohasagor").toLowerCase();
          return pSup.includes(bulkModalRule.scope_value.toLowerCase());
        }
        return true; // "all"
      })
      .slice(0, 100);
  }, [bulkModalRule, catalogProducts]);

  // Execute Bulk Reprice
  const handleExecuteBulkReprice = async () => {
    if (!bulkModalRule || affectedProducts.length === 0) return;
    setIsApplying(true);

    try {
      let count = 0;
      for (const prod of affectedProducts) {
        const cost = Number(prod.purchase_price || prod.cost || prod.originalPrice || prod.price * 0.7);
        const { sellingPrice } = calculatePrice(cost, bulkModalRule);

        // Update in Firestore
        if (db) {
          try {
            await setDoc(doc(db, "products", String(prod.id)), {
              price: sellingPrice,
              pricing_rule_applied: bulkModalRule.id,
              pricing_rule_name: bulkModalRule.name,
              updated_at: new Date().toISOString(),
            }, { merge: true });
            count++;
          } catch {}
        }
      }

      await logAdminActivity({
        action: "BULK_REPRICE_APPLIED",
        entity_type: "price",
        entity_id: bulkModalRule.id,
        entity_name: bulkModalRule.name,
        details: `Bulk repriced ${count} products using rule "${bulkModalRule.name}"`,
      });

      toast({
        title: "Bulk Reprice Completed",
        description: `Successfully repriced ${count} products in the database.`,
      });

      setBulkModalRule(null);
    } catch (err: any) {
      toast({
        title: "Reprice Error",
        description: err.message || "Failed to complete bulk reprice",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormName("");
    setFormType("percentage");
    setFormValue(20);
    setFormScopeType("all");
    setFormScopeValue("");
    setFormMinMargin(50);
    setFormMaxDiscount(30);
    setFormRounding("round_9");
    setFormPreserveManual(true);
    setFormPriority(1);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormValue(rule.value);
    setFormScopeType(rule.scope_type as any);
    setFormScopeValue(rule.scope_value || "");
    setFormMinMargin(rule.min_margin || 50);
    setFormMaxDiscount(rule.max_discount || 30);
    setFormRounding(rule.rounding);
    setFormPreserveManual(rule.preserve_manual);
    setFormPriority(rule.priority);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout title="Pricing & Margin Engine">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Pricing & Markup Engine
              </h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                Production
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated markups, category overrides, profit guardrails, and rounding rules
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={openCreateModal} className="h-8 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Pricing Rule
            </Button>
          </div>
        </div>

        {/* Live Interactive Pricing Calculator Sandbox */}
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Interactive Price Simulator</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">Real-Time Formula</Badge>
            </div>
            <CardDescription className="text-xs">
              Test how supplier costs translate into consumer selling prices with your configured rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label className="text-xs">Supplier Cost (৳)</Label>
                <Input
                  type="number"
                  value={calcCost}
                  onChange={(e) => setCalcCost(Number(e.target.value))}
                  className="h-9 mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Select Pricing Rule</Label>
                <Select value={selectedCalcRuleId} onValueChange={setSelectedCalcRuleId}>
                  <SelectTrigger className="h-9 mt-1 text-xs">
                    <SelectValue placeholder="Select Rule" />
                  </SelectTrigger>
                  <SelectContent>
                    {rules.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        {r.name} ({r.type === "percentage" ? `${r.value}%` : `৳${r.value}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 p-3 rounded-lg bg-card border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Calculated Selling Price</span>
                  <div className="text-xl font-bold text-foreground">
                    ৳{calcResult?.sellingPrice.toLocaleString() || 0}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Profit Margin</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +৳{calcResult?.markupAmount || 0} ({calcResult?.marginPercentage}%)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Rules Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Active Pricing Rules</CardTitle>
              <CardDescription className="text-xs">
                Rules are evaluated in order of priority (Highest priority first)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {rules.length} Rules Configured
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="text-left font-medium py-2.5 px-4">Priority</th>
                    <th className="text-left font-medium py-2.5 px-4">Rule Name</th>
                    <th className="text-left font-medium py-2.5 px-4">Markup</th>
                    <th className="text-left font-medium py-2.5 px-4">Target Scope</th>
                    <th className="text-left font-medium py-2.5 px-4">Rounding</th>
                    <th className="text-left font-medium py-2.5 px-4">Status</th>
                    <th className="text-right font-medium py-2.5 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No pricing rules configured. Click "New Pricing Rule" above to create one.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          #{rule.priority}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{rule.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Min Margin: ৳{rule.min_margin || 0} • Max Disc: {rule.max_discount || 0}%
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-primary">
                          {rule.type === "percentage" ? `+${rule.value}%` : `+৳${rule.value}`}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {rule.scope_type === "all" ? "All Products" : `${rule.scope_type}: ${rule.scope_value}`}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {rule.rounding === "round_9" ? "Ends in 9 (৳..9)" : rule.rounding === "round_10" ? "Nearest 10" : rule.rounding === "round_50" ? "Nearest 50" : "Exact"}
                        </td>
                        <td className="py-3 px-4">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggleActive(rule)}
                          />
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 text-emerald-600"
                            onClick={() => setBulkModalRule(rule)}
                            title="Preview & Apply Bulk Reprice"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                            Apply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => openEditModal(rule)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-rose-500 hover:text-rose-600"
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create / Edit Rule Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingRule ? "Edit Pricing Rule" : "Create Pricing Rule"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure automated pricing, margins, and rounding logic.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs">Rule Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Standard 20% Markup"
                  className="h-8 mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Markup Type</Label>
                  <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage" className="text-xs">Percentage (%)</SelectItem>
                      <SelectItem value="fixed" className="text-xs">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Markup Value</Label>
                  <Input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="h-8 mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Scope Target</Label>
                  <Select value={formScopeType} onValueChange={(v: any) => setFormScopeType(v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Products</SelectItem>
                      <SelectItem value="category" className="text-xs">By Category</SelectItem>
                      <SelectItem value="supplier" className="text-xs">By Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formScopeType !== "all" && (
                  <div>
                    <Label className="text-xs">Scope Value</Label>
                    <Input
                      value={formScopeValue}
                      onChange={(e) => setFormScopeValue(e.target.value)}
                      placeholder="e.g. Electronics or Mohasagor"
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Min Profit Margin (৳)</Label>
                  <Input
                    type="number"
                    value={formMinMargin}
                    onChange={(e) => setFormMinMargin(Number(e.target.value))}
                    className="h-8 mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Rounding Rule</Label>
                  <Select value={formRounding} onValueChange={(v: any) => setFormRounding(v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_9" className="text-xs">Ends in 9 (e.g. 399)</SelectItem>
                      <SelectItem value="round_10" className="text-xs">Nearest 10 (e.g. 400)</SelectItem>
                      <SelectItem value="round_50" className="text-xs">Nearest 50 (e.g. 450)</SelectItem>
                      <SelectItem value="none" className="text-xs">Exact (No rounding)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-medium text-foreground block text-xs">Preserve Manual Pricing</span>
                  <span className="text-[10px] text-muted-foreground">Skip products that were manually locked</span>
                </div>
                <Switch
                  checked={formPreserveManual}
                  onCheckedChange={setFormPreserveManual}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveRule}>
                Save Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Reprice Simulation & Confirmation Dialog */}
        <Dialog open={!!bulkModalRule} onOpenChange={(open) => !open && setBulkModalRule(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Simulate & Apply Bulk Repricing
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review proposed price adjustments before writing changes to the database.
              </DialogDescription>
            </DialogHeader>

            {bulkModalRule && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg bg-muted/40 border text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">Rule: {bulkModalRule.name}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Markup: {bulkModalRule.type === "percentage" ? `+${bulkModalRule.value}%` : `+৳${bulkModalRule.value}`} • Rounding: {bulkModalRule.rounding}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {affectedProducts.length} matching products
                  </Badge>
                </div>

                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/20 text-muted-foreground">
                        <th className="text-left py-2 px-3">Product</th>
                        <th className="text-right py-2 px-3">Current Price</th>
                        <th className="text-right py-2 px-3">Proposed Price</th>
                        <th className="text-right py-2 px-3">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {affectedProducts.slice(0, 15).map((p) => {
                        const cost = Number(p.purchase_price || p.cost || p.originalPrice || p.price * 0.7);
                        const { sellingPrice } = calculatePrice(cost, bulkModalRule);
                        const current = Number(p.price || 0);
                        const delta = sellingPrice - current;

                        return (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-medium text-foreground truncate max-w-[200px]">
                              {p.name}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              ৳{current.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                              ৳{sellingPrice.toLocaleString()}
                            </td>
                            <td className={`py-2 px-3 text-right font-mono font-semibold ${
                              delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-500" : "text-muted-foreground"
                            }`}>
                              {delta > 0 ? `+৳${delta}` : delta < 0 ? `-৳${Math.abs(delta)}` : "0"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setBulkModalRule(null)} disabled={isApplying}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleExecuteBulkReprice} disabled={isApplying} className="gap-1.5">
                {isApplying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Confirm & Apply to Products
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
