import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  BarChart3,
  Bot,
  Database,
  ExternalLink,
  Layers,
  AlertCircle,
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllFAQs,
  saveOrUpdateFAQ,
  deleteFAQ,
  fetchCustomerReports,
  updateReportStatus,
  deleteCustomerReport,
  FAQ_CATEGORIES,
  type FAQItem,
  type CustomerReport
} from "@/services/knowledgeBaseService";

export default function AdminFAQ() {
  const [activeMainTab, setActiveMainTab] = useState<string>("faqs");

  // FAQs State
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem> | null>(null);

  // Customer Reports State
  const [reports, setReports] = useState<CustomerReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilterStatus, setReportFilterStatus] = useState<string>("all");
  const [reportSearchTerm, setReportSearchTerm] = useState<string>("");
  const [viewingReport, setViewingReport] = useState<CustomerReport | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllFAQs();
      setFaqs(data);
    } catch (err) {
      toast.error("FAQ ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const reps = await fetchCustomerReports();
      setReports(reps);
    } catch (err) {
      toast.error("রিপোর্ট ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadData();
    loadReports();
  }, []);

  const handleOpenAdd = () => {
    setEditingFaq({
      id: `faq_${Date.now()}`,
      category: "popular",
      questionBn: "",
      questionEn: "",
      answerBn: "",
      answerEn: "",
      answerType: "text",
      sourceType: "static",
      priority: 10,
      isActive: true,
      requiresAuth: false,
      relatedQuestionIds: [],
      actionButtons: [],
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (faq: FAQItem) => {
    setEditingFaq({ ...faq });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingFaq?.questionBn || !editingFaq?.answerBn) {
      toast.error("অনুগ্রহ করে প্রশ্ন ও উত্তরের বাংলা বিবরণ পূরণ করুন");
      return;
    }

    try {
      const success = await saveOrUpdateFAQ(editingFaq as FAQItem);
      if (success) {
        toast.success("FAQ সফলভাবে সংরক্ষণ করা হয়েছে");
        setIsDialogOpen(false);
        loadData();
      } else {
        toast.error("সংরক্ষণ ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("সংরক্ষণে সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই FAQ টি মুছে ফেলতে চান?")) return;
    try {
      const success = await deleteFAQ(id);
      if (success) {
        toast.success("FAQ মুছে ফেলা হয়েছে");
        loadData();
      } else {
        toast.error("মুছতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("মুছতে সমস্যা হয়েছে");
    }
  };

  const handleToggleActive = async (faq: FAQItem) => {
    const updated = { ...faq, isActive: !faq.isActive };
    const success = await saveOrUpdateFAQ(updated);
    if (success) {
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? updated : f)));
      toast.success(`FAQ ${updated.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে`);
    }
  };

  // Report status update handler
  const handleReportStatusChange = async (reportId: string, newStatus: "pending" | "investigating" | "resolved") => {
    const ok = await updateReportStatus(reportId, newStatus);
    if (ok) {
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)));
      toast.success("রিপোর্ট স্ট্যাটাস আপডেট করা হয়েছে!");
    } else {
      toast.error("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে");
    }
  };

  // Delete customer report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই রিপোর্টটি মুছে ফেলতে চান?")) return;
    const ok = await deleteCustomerReport(reportId);
    if (ok) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (viewingReport?.id === reportId) setViewingReport(null);
      toast.success("রিপোর্ট সফলভাবে মুছে ফেলা হয়েছে");
    } else {
      toast.error("রিপোর্ট ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  // Filtered FAQs
  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      searchTerm.trim() === "" ||
      faq.questionBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.questionEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answerBn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered Customer Reports
  const filteredReports = reports.filter((rep) => {
    const matchesStatus = reportFilterStatus === "all" || rep.status === reportFilterStatus;
    const term = reportSearchTerm.trim().toLowerCase();
    const matchesSearch =
      term === "" ||
      rep.id.toLowerCase().includes(term) ||
      rep.name.toLowerCase().includes(term) ||
      rep.phone.includes(term) ||
      rep.category.toLowerCase().includes(term) ||
      (rep.orderNumber && rep.orderNumber.toLowerCase().includes(term)) ||
      rep.details.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // Stats
  const totalCount = faqs.length;
  const activeCount = faqs.filter((f) => f.isActive).length;
  const dynamicCount = faqs.filter((f) => f.answerType === "dynamic").length;
  const totalClicks = faqs.reduce((sum, f) => sum + (f.clickCount || 0), 0);

  // Report Stats
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const investigatingReports = reports.filter((r) => r.status === "investigating").length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;

  return (
    <AdminLayout title="AI Assistant & FAQ Management">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Bot className="w-6 h-6 text-orange-500" />
              Sigma AI & Customer Care Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              চ্যাটবট প্রশ্ন-উত্তর, লাইভ ডেটা ও গ্রাহকদের জমা দেওয়া অভিযোগ ও রিপোর্ট পরিচালনা করুন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadData();
                loadReports();
              }}
              disabled={loading || loadingReports}
              className="h-9 font-bold"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading || loadingReports ? "animate-spin" : ""}`} /> রিফ্রেশ
            </Button>
            {activeMainTab === "faqs" && (
              <Button
                onClick={handleOpenAdd}
                className="h-9 font-bold bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" /> নতুন FAQ যোগ করুন
              </Button>
            )}
          </div>
        </div>

        {/* Main Tab Switcher */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-11">
            <TabsTrigger value="faqs" className="rounded-lg font-bold text-xs px-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              <span>FAQ ও বট নলেজ বেস</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                {totalCount}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="reports" className="rounded-lg font-bold text-xs px-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>কাস্টমার রিপোর্ট ও অভিযোগ</span>
              {pendingReports > 0 ? (
                <Badge className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] px-1.5 py-0 h-4 ml-1">
                  {pendingReports} নতুন
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                  {totalReports}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ============================================================== */}
          {/* TAB 1: FAQ KNOWLEDGE BASE & BOT FLOW */}
          {/* ============================================================== */}
          <TabsContent value="faqs" className="space-y-6 mt-4">
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">মোট প্রশ্নসমূহ</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center font-bold">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">সক্রিয় প্রশ্ন (Active)</p>
                    <h3 className="text-xl font-black text-emerald-600 mt-1">{activeCount}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">ডায়নামিক ডেটা সোর্স</p>
                    <h3 className="text-xl font-black text-blue-600 mt-1">{dynamicCount}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">মোট ক্লিক ও এনগেজমেন্ট</p>
                    <h3 className="text-xl font-black text-purple-600 mt-1">{totalClicks}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  {/* Category selector */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        selectedCategory === "all"
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      সব ক্যাটাগরি ({totalCount})
                    </button>
                    {FAQ_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                          selectedCategory === cat.id
                            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span>{cat.icon}</span> <span>{cat.nameBn.replace(/^[^\s]+\s*/, "")}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search box */}
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="প্রশ্ন বা উত্তর দিয়ে খুঁজুন..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQs Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-950/60">
                    <TableRow>
                      <TableHead className="w-12 text-center font-bold">ক্রম</TableHead>
                      <TableHead className="font-bold">প্রশ্ন (বাংলা ও ইংরেজি)</TableHead>
                      <TableHead className="w-32 font-bold">ক্যাটাগরি</TableHead>
                      <TableHead className="w-28 font-bold">টাইপ / সোর্স</TableHead>
                      <TableHead className="w-24 text-center font-bold">ক্লিক</TableHead>
                      <TableHead className="w-24 text-center font-bold">স্ট্যাটাস</TableHead>
                      <TableHead className="w-28 text-right font-bold pr-4">একশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
                          লোড হচ্ছে...
                        </TableCell>
                      </TableRow>
                    ) : filteredFaqs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                          কোনো FAQ পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFaqs.map((faq) => {
                        const catObj = FAQ_CATEGORIES.find((c) => c.id === faq.category);

                        return (
                          <TableRow key={faq.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                            <TableCell className="text-center font-bold text-xs text-slate-500">
                              {faq.priority || 10}
                            </TableCell>

                            <TableCell className="max-w-md">
                              <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                                {faq.questionBn}
                              </div>
                              {faq.questionEn && (
                                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {faq.questionEn}
                                </div>
                              )}
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-1 italic">
                                {faq.answerBn}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {catObj?.icon || "📁"} {catObj?.nameBn.replace(/^[^\s]+\s*/, "") || faq.category}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant="secondary"
                                  className={`text-[9px] w-max font-semibold ${
                                    faq.answerType === "dynamic"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  }`}
                                >
                                  {faq.answerType === "dynamic" ? "⚡ Live DB" : "📝 Static"}
                                </Badge>
                                {faq.sourceType && faq.sourceType !== "static" && (
                                  <span className="text-[9px] text-slate-400">{faq.sourceType}</span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-center font-bold text-xs text-purple-600">
                              {faq.clickCount || 0}
                            </TableCell>

                            <TableCell className="text-center">
                              <Switch
                                checked={faq.isActive}
                                onCheckedChange={() => handleToggleActive(faq)}
                              />
                            </TableCell>

                            <TableCell className="text-right pr-4">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(faq)}
                                  className="h-8 w-8 hover:text-orange-600"
                                  title="সম্পাদনা করুন"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(faq.id)}
                                  className="h-8 w-8 hover:text-rose-600"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================== */}
          {/* TAB 2: CUSTOMER REPORTS & COMPLAINTS */}
          {/* ============================================================== */}
          <TabsContent value="reports" className="space-y-6 mt-4">
            {/* Report Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">মোট রিপোর্ট</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalReports}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">অপেক্ষমাণ (Pending)</p>
                    <h3 className="text-xl font-black text-rose-600 mt-1">{pendingReports}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">তদন্তাধীন (In Progress)</p>
                    <h3 className="text-xl font-black text-amber-600 mt-1">{investigatingReports}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">সমাধানকৃত (Resolved)</p>
                    <h3 className="text-xl font-black text-emerald-600 mt-1">{resolvedReports}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search for Reports */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
                    <button
                      type="button"
                      onClick={() => setReportFilterStatus("all")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        reportFilterStatus === "all"
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      সব রিপোর্ট ({totalReports})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilterStatus("pending")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        reportFilterStatus === "pending"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}
                    >
                      অপেক্ষমাণ ({pendingReports})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilterStatus("investigating")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        reportFilterStatus === "investigating"
                          ? "bg-amber-600 text-white"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      তদন্তাধীন ({investigatingReports})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilterStatus("resolved")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        reportFilterStatus === "resolved"
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      সমাধানকৃত ({resolvedReports})
                    </button>
                  </div>

                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="মোবাইল নম্বর, নাম বা আইডি খুঁজুন..."
                      value={reportSearchTerm}
                      onChange={(e) => setReportSearchTerm(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-950/60">
                    <TableRow>
                      <TableHead className="w-24 font-bold">আইডি</TableHead>
                      <TableHead className="w-44 font-bold">গ্রাহকের নাম ও ফোন</TableHead>
                      <TableHead className="w-36 font-bold">ক্যাটাগরি / অর্ডার</TableHead>
                      <TableHead className="font-bold">অভিযোগের বিবরণ</TableHead>
                      <TableHead className="w-28 font-bold">তারিখ</TableHead>
                      <TableHead className="w-36 font-bold">স্ট্যাটাস পরিবর্তন</TableHead>
                      <TableHead className="w-20 text-right font-bold pr-4">একশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingReports ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-500" />
                          রিপোর্ট লোড হচ্ছে...
                        </TableCell>
                      </TableRow>
                    ) : filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                          কোনো গ্রাহক রিপোর্ট পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((rep) => {
                        const cleanPhone = rep.phone.replace(/[^0-9]/g, "");
                        const waLink = `https://wa.me/880${cleanPhone.replace(/^0/, "")}`;
                        const callLink = `tel:${cleanPhone}`;

                        return (
                          <TableRow key={rep.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                            <TableCell className="font-mono text-xs font-black text-rose-600">
                              #{rep.id}
                            </TableCell>

                            <TableCell>
                              <div className="font-bold text-xs text-slate-900 dark:text-white">
                                {rep.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                  {rep.phone}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold transition-colors"
                                  title="WhatsApp-এ চ্যাট করুন"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                                  WhatsApp
                                </a>
                                <a
                                  href={callLink}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold transition-colors"
                                  title="সরাসরি কল দিন"
                                >
                                  <Phone className="w-3 h-3 text-blue-600" />
                                  Call
                                </a>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {rep.category}
                              </Badge>
                              {rep.orderNumber && (
                                <div className="text-[10px] font-mono text-slate-500 mt-1 font-semibold">
                                  {rep.orderNumber}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="max-w-xs">
                              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                {rep.details}
                              </p>
                              <button
                                type="button"
                                onClick={() => setViewingReport(rep)}
                                className="text-[10px] font-bold text-orange-600 hover:underline mt-1 inline-flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" /> সম্পূর্ণ বিবরণ
                              </button>
                            </TableCell>

                            <TableCell className="text-xs text-slate-500">
                              {new Date(rep.createdAt).toLocaleDateString("bn-BD", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                              <div className="text-[10px] text-slate-400">
                                {new Date(rep.createdAt).toLocaleTimeString("bn-BD", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Select
                                value={rep.status}
                                onValueChange={(val: any) => handleReportStatusChange(rep.id, val)}
                              >
                                <SelectTrigger className="h-8 text-xs rounded-lg font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    <span className="text-rose-600 font-bold flex items-center gap-1.5">
                                      <Clock className="w-3 h-3" /> অপেক্ষমাণ
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="investigating">
                                    <span className="text-amber-600 font-bold flex items-center gap-1.5">
                                      <RefreshCw className="w-3 h-3" /> তদন্তাধীন
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="resolved">
                                    <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3 h-3" /> সমাধানকৃত
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell className="text-right pr-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteReport(rep.id)}
                                className="h-8 w-8 hover:text-rose-600"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ============================================================== */}
        {/* MODAL 1: ADD / EDIT FAQ DIALOG */}
        {/* ============================================================== */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editingFaq?.id?.startsWith("faq_") ? "নতুন FAQ তৈরি করুন" : "FAQ সম্পাদনা করুন"}
              </DialogTitle>
              <DialogDescription>
                চ্যাটবটের গাইডেড উত্তর বা লাইভ সিস্টেম ইন্টিগ্রেশনের তথ্য দিন
              </DialogDescription>
            </DialogHeader>

            {editingFaq && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">ক্যাটাগরি</Label>
                    <Select
                      value={editingFaq.category || "popular"}
                      onValueChange={(val) => setEditingFaq({ ...editingFaq, category: val as any })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FAQ_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs">
                            {cat.icon} {cat.nameBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">ডিসপ্লে প্রায়োরিটি (Priority)</Label>
                    <Input
                      type="number"
                      value={editingFaq.priority || 10}
                      onChange={(e) => setEditingFaq({ ...editingFaq, priority: Number(e.target.value) })}
                      className="h-9 text-xs"
                      placeholder="1 - 100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">প্রশ্ন (বাংলা)</Label>
                  <Input
                    value={editingFaq.questionBn || ""}
                    onChange={(e) => setEditingFaq({ ...editingFaq, questionBn: e.target.value })}
                    className="h-9 text-xs font-semibold"
                    placeholder="যেমন: ডেলিভারি চার্জ কত?"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">প্রশ্ন (ইংরেজি - ঐচ্ছিক)</Label>
                  <Input
                    value={editingFaq.questionEn || ""}
                    onChange={(e) => setEditingFaq({ ...editingFaq, questionEn: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="e.g. What is the delivery fee?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">উত্তরের ধরন</Label>
                    <Select
                      value={editingFaq.answerType || "text"}
                      onValueChange={(val: any) => setEditingFaq({ ...editingFaq, answerType: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text" className="text-xs">📝 সাধারণ টেক্সট (Static)</SelectItem>
                        <SelectItem value="dynamic" className="text-xs">⚡ ডায়নামিক ডেটা সোর্স (Live DB)</SelectItem>
                        <SelectItem value="action" className="text-xs">🔘 সরাসরি অ্যাকশন / লিংক</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">ডেটা সোর্স কানেক্টর</Label>
                    <Select
                      value={editingFaq.sourceType || "static"}
                      onValueChange={(val: any) => setEditingFaq({ ...editingFaq, sourceType: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="static" className="text-xs">সাধারণ / স্ট্যাটিক</SelectItem>
                        <SelectItem value="shipping_config" className="text-xs">🚚 লাইভ ডেলিভারি কনফিগারেশন</SelectItem>
                        <SelectItem value="site_contact" className="text-xs">📞 ওয়েবসাইট কন্টাক্ট ও হেল্পলাইন</SelectItem>
                        <SelectItem value="active_coupons" className="text-xs">🎁 চলতি ডিসকাউন্ট কুপনস</SelectItem>
                        <SelectItem value="user_orders" className="text-xs">📦 ইউজারের নিজস্ব অর্ডার ট্র্যাকিং</SelectItem>
                        <SelectItem value="product_finder" className="text-xs">🛍️ প্রোডাক্ট ফাইন্ডার ফ্লো</SelectItem>
                        <SelectItem value="product_compare" className="text-xs">⚖️ প্রোডাক্ট তুলনা ইঞ্জিন</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">উত্তর (বাংলা)</Label>
                  <Textarea
                    value={editingFaq.answerBn || ""}
                    onChange={(e) => setEditingFaq({ ...editingFaq, answerBn: e.target.value })}
                    className="min-h-[100px] text-xs font-mono"
                    placeholder="সঠিক ও ভেরিফাইড উত্তরের বিবরণ লিখুন..."
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">লগইন বাধ্যতামূলক (Requires Login)</Label>
                    <p className="text-[10px] text-slate-500">শুধুমাত্র লগইন করা ইউজারের নিজস্ব ডেটা দেখাবে (যেমন: অর্ডার হিস্টোরি)</p>
                  </div>
                  <Switch
                    checked={editingFaq.requiresAuth || false}
                    onCheckedChange={(checked) => setEditingFaq({ ...editingFaq, requiresAuth: checked })}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                বাতিল
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                সংরক্ষণ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============================================================== */}
        {/* MODAL 2: VIEW FULL REPORT DETAILS DIALOG */}
        {/* ============================================================== */}
        <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center justify-between text-slate-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  রিপোর্ট বিবরণ: #{viewingReport?.id}
                </span>
                <Badge
                  variant="outline"
                  className={
                    viewingReport?.status === "resolved"
                      ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                      : viewingReport?.status === "investigating"
                      ? "border-amber-300 text-amber-600 bg-amber-50"
                      : "border-rose-300 text-rose-600 bg-rose-50"
                  }
                >
                  {viewingReport?.status === "resolved"
                    ? "সমাধানকৃত"
                    : viewingReport?.status === "investigating"
                    ? "তদন্তাধীন"
                    : "অপেক্ষমাণ"}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            {viewingReport && (
              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">গ্রাহকের নাম</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{viewingReport.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">মোবাইল নম্বর</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">{viewingReport.phone}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">ক্যাটাগরি</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingReport.category}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">অর্ডার নম্বর</span>
                    <div className="font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingReport.orderNumber || "উল্লেখ নেই"}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">সমস্যা বা অভিযোগের বিবরণ:</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {viewingReport.details}
                  </div>
                </div>

                {/* Direct Action Buttons for Admin */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <a
                    href={`https://wa.me/880${viewingReport.phone.replace(/[^0-9]/g, "").replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp মেসেজ পাঠান
                  </a>
                  <a
                    href={`tel:${viewingReport.phone.replace(/[^0-9]/g, "")}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    সরাসরি কল দিন
                  </a>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setViewingReport(null)}>
                বন্ধ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
