import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Activity, 
  Search, 
  Download, 
  RefreshCw, 
  Eye, 
  ShieldAlert, 
  Clock, 
  User, 
  Layers, 
  Tag, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  RotateCcw, 
  Wallet, 
  FileText 
} from "lucide-react";
import { getAuditLogs, AuditLogEntry } from "@/services/auditLogger";
import { useToast } from "@/hooks/use-toast";

export default function AdminAuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({
        entity_type: selectedEntityType,
        limitCount: 200,
      });
      setLogs(data);
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntityType]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    toast({
      title: "Logs Refreshed",
      description: "Latest administrative mutations synchronized.",
    });
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) =>
      log.admin_name?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.entity_id?.toLowerCase().includes(q) ||
      log.entity_name?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast({ title: "No logs to export", variant: "destructive" });
      return;
    }

    const headers = ["Timestamp", "Admin Name", "Admin ID", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = filteredLogs.map((log) => [
      `"${log.created_at}"`,
      `"${log.admin_name || ""}"`,
      `"${log.admin_id || ""}"`,
      `"${log.action || ""}"`,
      `"${log.entity_type || ""}"`,
      `"${log.entity_id || ""}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `durtup_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "CSV Exported", description: `Exported ${filteredLogs.length} audit records.` });
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "price": return <DollarSign className="h-3.5 w-3.5 text-emerald-600" />;
      case "product": return <Package className="h-3.5 w-3.5 text-primary" />;
      case "inventory": return <Package className="h-3.5 w-3.5 text-rose-500" />;
      case "order": return <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />;
      case "refund": return <RotateCcw className="h-3.5 w-3.5 text-amber-500" />;
      case "wallet": return <Wallet className="h-3.5 w-3.5 text-purple-600" />;
      case "cms": return <FileText className="h-3.5 w-3.5 text-indigo-600" />;
      default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <AdminLayout title="System Activity & Audit Logs">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Administrative Audit Trail
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                Immutable Ledger
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Append-only audit records of all price modifications, order updates, stock adjustments, and staff actions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-lg border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by admin name, action, or entity ID..."
              className="pl-8 text-xs h-8 bg-muted/30"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Entities</SelectItem>
                <SelectItem value="price" className="text-xs">Pricing & Markups</SelectItem>
                <SelectItem value="product" className="text-xs">Products</SelectItem>
                <SelectItem value="inventory" className="text-xs">Inventory</SelectItem>
                <SelectItem value="order" className="text-xs">Orders</SelectItem>
                <SelectItem value="refund" className="text-xs">Refunds & Returns</SelectItem>
                <SelectItem value="wallet" className="text-xs">Wallet & Referrals</SelectItem>
                <SelectItem value="cms" className="text-xs">CMS & Storefront</SelectItem>
                <SelectItem value="seo" className="text-xs">SEO Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Audit History</CardTitle>
              <CardDescription className="text-xs">
                Chronological ledger of operational mutations
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredLogs.length} Records
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="text-left font-medium py-2.5 px-4">Timestamp</th>
                    <th className="text-left font-medium py-2.5 px-4">Staff / Admin</th>
                    <th className="text-left font-medium py-2.5 px-4">Action</th>
                    <th className="text-left font-medium py-2.5 px-4">Entity</th>
                    <th className="text-left font-medium py-2.5 px-4">Details / Values</th>
                    <th className="text-right font-medium py-2.5 px-4">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading audit trail...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        <ShieldAlert className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
                        No audit records found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id || `${log.created_at}-${log.entity_id}`} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString([], {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {log.admin_name?.charAt(0) || "A"}
                            </span>
                            <span>{log.admin_name || "Admin Staff"}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block ml-6">
                            ID: {log.admin_id}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium capitalize text-foreground">
                            {getEntityIcon(log.entity_type)}
                            <span>{log.entity_type}</span>
                          </div>
                          {log.entity_name && (
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">
                              {log.entity_name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-foreground/90 max-w-[280px] truncate">
                          {log.details || JSON.stringify(log.new_value || "")}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Inspect
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

        {/* Detailed Audit Record Inspector Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Audit Record Details
              </DialogTitle>
              <DialogDescription className="text-xs font-mono">
                Log ID: {selectedLog?.id} • Timestamp: {selectedLog?.created_at}
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-3 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Admin Staff</span>
                    <span className="font-bold text-foreground">{selectedLog.admin_name} ({selectedLog.admin_id})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Action Type</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{selectedLog.action}</Badge>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Entity Target</span>
                    <span className="font-medium text-foreground capitalize">{selectedLog.entity_type}: {selectedLog.entity_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Entity Name</span>
                    <span className="font-medium text-foreground">{selectedLog.entity_name || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold block mb-1">Audit Details / Description:</span>
                  <div className="p-3 rounded-lg border bg-card text-foreground font-mono text-[11px] leading-relaxed">
                    {selectedLog.details || "No textual details attached"}
                  </div>
                </div>

                {selectedLog.new_value && (
                  <div>
                    <span className="text-xs font-semibold block mb-1">Applied Values Payload:</span>
                    <pre className="p-3 rounded-lg bg-muted/60 border font-mono text-[10px] overflow-x-auto text-foreground max-h-40">
                      {JSON.stringify(selectedLog.new_value, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
