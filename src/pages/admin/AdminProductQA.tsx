import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { QAQuestion, QAStatus, QAAnalytics } from "@/types/productQA";
import {
  getAllQuestionsForAdmin,
  moderateQuestion,
  deleteQuestion,
  answerProductQuestion,
  getQAAnalytics,
} from "@/services/productQAService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  HelpCircle,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Reply,
  Store,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Loader2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { bn } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AdminProductQA() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [analytics, setAnalytics] = useState<QAAnalytics>({
    totalQuestions: 0,
    pendingQuestions: 0,
    approvedQuestions: 0,
    rejectedQuestions: 0,
    totalAnswers: 0,
    unansweredQuestions: 0,
    responseRate: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<QAStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Reply Dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QAQuestion | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, stats] = await Promise.all([
        getAllQuestionsForAdmin({ status: statusFilter, search: searchQuery }),
        getQAAnalytics(),
      ]);
      setQuestions(list);
      setAnalytics(stats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Moderate Question
  const handleModerate = async (questionId: string, status: QAStatus) => {
    const res = await moderateQuestion(questionId, status, "Admin");
    if (res.success) {
      toast({ title: "সফল", description: res.message });
      loadData();
    }
  };

  // Delete Question
  const handleDelete = async (questionId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত এই প্রশ্নটি মুছে ফেলতে চান?")) return;
    const res = await deleteQuestion(questionId);
    if (res.success) {
      toast({ title: "মুছে ফেলা হয়েছে", description: "প্রশ্নটি সফলভাবে মুছে ফেলা হয়েছে।" });
      loadData();
    }
  };

  // Open Reply Modal
  const openReplyModal = (q: QAQuestion) => {
    setSelectedQuestion(q);
    setReplyText("");
    setReplyDialogOpen(true);
  };

  // Submit Official Reply
  const handleSendReply = async () => {
    if (!selectedQuestion || !replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await answerProductQuestion({
        questionId: selectedQuestion.id,
        answerText: replyText.trim(),
        authorType: "admin",
        authorName: "Durtup Official Team",
      });

      if (res.success) {
        toast({ title: "উত্তর সফল হয়েছে!", description: "অফিসিয়াল উত্তর প্রকাশিত হয়েছে এবং কাস্টমার নোটিফিকেশন পেয়েছে।" });
        setReplyDialogOpen(false);
        loadData();
      } else {
        toast({ title: "ত্রুটি", description: res.message, variant: "destructive" });
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getStatusBadge = (status: QAStatus) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-600 text-white font-bold"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-500 text-white font-bold"><AlertTriangle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="font-bold"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case "spam":
        return <Badge variant="destructive" className="bg-red-700 font-bold">🚫 Spam</Badge>;
    }
  };

  return (
    <AdminLayout title="Product Q&A Management">
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Product Questions & Answers (Q&A)
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Manage, moderate, and answer customer product questions with verified buyer attribution
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-black text-foreground">{analytics.totalQuestions}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Questions</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-black text-amber-600">{analytics.pendingQuestions}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-black text-emerald-600">{analytics.approvedQuestions}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Approved Live</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-black text-blue-600">{analytics.totalAnswers}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Answers</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-black text-orange-600">{analytics.unansweredQuestions}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Unanswered</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-black text-purple-600">{analytics.responseRate}%</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Response Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(["all", "pending", "approved", "rejected", "spam"] as const).map((st) => (
                  <Button
                    key={st}
                    variant={statusFilter === st ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(st)}
                    className="capitalize text-xs h-8"
                  >
                    {st === "all" ? "All Questions" : st}
                  </Button>
                ))}
              </div>

              {/* Search input */}
              <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search question, product, user..."
                    className="pl-8 h-8 text-xs bg-muted/30"
                  />
                </div>
                <Button type="submit" size="sm" className="h-8 text-xs font-semibold">
                  Search
                </Button>
              </form>

            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Product Inquiries ({questions.length})</CardTitle>
            <CardDescription className="text-xs">
              Review customer inquiries, publish clean questions, and provide official store responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 pt-0">
            {isLoading ? (
              <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading inquiries...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm font-semibold">No questions found matching this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground">
                      <th className="p-3 font-semibold">Product</th>
                      <th className="p-3 font-semibold">Question & Customer</th>
                      <th className="p-3 font-semibold">Answers</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                        
                        {/* Product Column */}
                        <td className="p-3 align-top min-w-[180px] max-w-[220px]">
                          <div className="flex items-center gap-2">
                            <img
                              src={q.productImage || "/icon-192.png"}
                              alt={q.productName}
                              className="w-10 h-10 rounded-lg object-contain bg-white border border-border p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <a
                                href={`/product/${q.productSlug || q.productId}#qa-${q.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-xs text-foreground hover:text-primary line-clamp-2 leading-tight flex items-center gap-1"
                              >
                                <span>{q.productName}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                              </a>
                              <span className="text-[10px] text-muted-foreground">ID: {q.productId}</span>
                            </div>
                          </div>
                        </td>

                        {/* Question & Customer Column */}
                        <td className="p-3 align-top min-w-[240px]">
                          <p className="font-semibold text-foreground text-xs leading-snug">
                            "{q.questionText}"
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                            <span className="font-medium text-foreground/80">{q.authorName}</span>
                            {q.authorEmail && <span>• {q.authorEmail}</span>}
                            <span>• {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true, locale: bn })}</span>
                          </div>
                        </td>

                        {/* Answers Column */}
                        <td className="p-3 align-top min-w-[200px]">
                          {q.answers && q.answers.length > 0 ? (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                              {q.answers.map((ans) => (
                                <div key={ans.id} className="p-1.5 rounded bg-muted/60 text-[11px] border border-border/50">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-primary text-[10px]">
                                      {ans.authorName}
                                    </span>
                                    {ans.isVerifiedBuyer && (
                                      <Badge className="bg-emerald-600 text-white text-[8px] px-1 py-0">Buyer ✓</Badge>
                                    )}
                                    {ans.isOfficialStore && (
                                      <Badge className="bg-orange-600 text-white text-[8px] px-1 py-0">Seller ✓</Badge>
                                    )}
                                  </div>
                                  <p className="text-foreground/90 mt-0.5 line-clamp-2">{ans.answerText}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-medium italic">
                              No answers yet
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="p-3 align-top">
                          {getStatusBadge(q.status)}
                        </td>

                        {/* Actions Column */}
                        <td className="p-3 align-top text-right min-w-[160px]">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReplyModal(q)}
                              className="h-7 px-2 text-xs text-primary border-primary/30 hover:bg-primary/5 font-semibold"
                            >
                              <Reply className="w-3 h-3 mr-1" />
                              Reply
                            </Button>

                            {q.status !== "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleModerate(q.id, "approved")}
                                className="h-7 px-2 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}

                            {q.status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleModerate(q.id, "rejected")}
                                className="h-7 px-2 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                                title="Reject"
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(q.id)}
                              className="h-7 px-1.5 text-xs text-red-500 hover:bg-red-50"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Official Reply Modal */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Store className="w-5 h-5 text-primary" />
              <span>Post Official Store Reply</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              This response will appear with the <strong>Official Seller / Team</strong> badge and automatically notify the customer.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/50 border text-xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold">CUSTOMER QUESTION:</span>
                <p className="font-semibold text-foreground">"{selectedQuestion.questionText}"</p>
                <p className="text-[10px] text-muted-foreground">
                  By {selectedQuestion.authorName} on {selectedQuestion.productName}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Official Response
                </label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Dear valued customer, yes this product comes with a 7-day replacement warranty..."
                  rows={4}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyDialogOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendReply}
                  disabled={isSubmittingReply || !replyText.trim()}
                  className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                >
                  {isSubmittingReply ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Post & Notify Customer</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
