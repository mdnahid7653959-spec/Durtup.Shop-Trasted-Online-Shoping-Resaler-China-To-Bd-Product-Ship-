import React, { useState, useEffect, useMemo } from "react";
import { QAQuestion, QAAnswer } from "@/types/productQA";
import {
  getProductQuestions,
  askProductQuestion,
  answerProductQuestion,
  voteHelpfulAnswer,
} from "@/services/productQAService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  MessageCircle,
  Search,
  ThumbsUp,
  CheckCircle2,
  Store,
  ShieldCheck,
  Send,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProductQASectionProps {
  productId: string;
  productName: string;
  productSlug?: string;
  productImage?: string;
  sellerId?: string;
  sellerName?: string;
}

export const ProductQASection: React.FC<ProductQASectionProps> = ({
  productId,
  productName,
  productSlug,
  productImage,
  sellerId,
  sellerName,
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Ask Question Form State
  const [isAskingOpen, setIsAskingOpen] = useState<boolean>(false);
  const [questionText, setQuestionText] = useState<string>("");
  const [askerName, setAskerName] = useState<string>("");
  const [askerContact, setAskerContact] = useState<string>("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState<boolean>(false);

  // Active Reply Form State
  const [replyingQuestionId, setReplyingQuestionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [replierName, setReplierName] = useState<string>("");
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // Helpful Voting tracking
  const [votedAnswerIds, setVotedAnswerIds] = useState<Set<string>>(new Set());

  // Load questions
  const loadQuestions = async () => {
    try {
      const data = await getProductQuestions(productId, false);
      setQuestions(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();

    const handleUpdate = () => loadQuestions();
    window.addEventListener("durtup_qa_updated", handleUpdate);
    return () => window.removeEventListener("durtup_qa_updated", handleUpdate);
  }, [productId]);

  // Auto-fill logged-in user details
  useEffect(() => {
    if (user) {
      setAskerName(profile?.full_name || user.displayName || "");
      setAskerContact(user.email || user.phoneNumber || "");
      setReplierName(profile?.full_name || user.displayName || "");
    }
  }, [user, profile]);

  // Search Filter
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase().trim();
    return questions.filter((item) => {
      const matchQ = item.questionText.toLowerCase().includes(q);
      const matchAns = item.answers?.some((a) => a.answerText.toLowerCase().includes(q));
      return matchQ || matchAns;
    });
  }, [questions, searchQuery]);

  // Handle Ask Question
  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast({ title: "প্রশ্ন লিখুন", description: "অনুগ্রহ করে আপনার প্রশ্নটি লিখুন।", variant: "destructive" });
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const res = await askProductQuestion({
        productId,
        productName,
        productSlug,
        productImage,
        sellerId,
        sellerName,
        questionText: questionText.trim(),
        authorName: askerName.trim() || "সম্মানিত ক্রেতা",
        authorId: user?.uid,
        authorEmail: user?.email || (askerContact.includes("@") ? askerContact : undefined),
        authorPhone: askerContact.match(/\d{11}/) ? askerContact : undefined,
      });

      if (res.success) {
        toast({ title: "প্রশ্ন জমা হয়েছে!", description: res.message });
        setQuestionText("");
        setIsAskingOpen(false);
        await loadQuestions();
      } else {
        toast({ title: "ত্রুটি", description: res.message, variant: "destructive" });
      }
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Handle Answer Submit
  const handleReplySubmit = async (questionId: string) => {
    if (!replyText.trim()) {
      toast({ title: "উত্তর লিখুন", description: "অনুগ্রহ করে আপনার উত্তরটি লিখুন।", variant: "destructive" });
      return;
    }

    setIsSubmittingReply(true);
    try {
      const isStaffOrAdmin = profile?.role === "admin" || profile?.role === "staff";
      const res = await answerProductQuestion({
        questionId,
        answerText: replyText.trim(),
        authorType: isStaffOrAdmin ? "admin" : undefined,
        authorName: replierName.trim() || (isStaffOrAdmin ? "Durtup Official Team" : "ক্রেতা"),
        authorId: user?.uid,
        authorEmail: user?.email,
      });

      if (res.success) {
        toast({ title: "উত্তর প্রকাশিত হয়েছে!", description: res.message });
        setReplyText("");
        setReplyingQuestionId(null);
        await loadQuestions();
      } else {
        toast({ title: "ত্রুটি", description: res.message, variant: "destructive" });
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Vote Helpful
  const handleVote = (questionId: string, answerId: string) => {
    const voterId = user?.uid || "anon_" + Math.random().toString(36).slice(2, 6);
    const res = voteHelpfulAnswer(questionId, answerId, voterId);
    if (res.success) {
      setVotedAnswerIds((prev) => new Set(prev).add(answerId));
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            answers: q.answers.map((a) => (a.id === answerId ? { ...a, helpfulCount: res.newCount } : a)),
          };
        })
      );
      toast({ title: "ধন্যবাদ!", description: "আপনার মূল্যবান মতামত গ্রহণ করা হয়েছে।" });
    } else if (res.alreadyVoted) {
      toast({ title: "ইতিমধ্যে ভোট দিয়েছেন", description: "আপনি ইতিমধ্যে এই উত্তরে ভোট দিয়েছেন।" });
    }
  };

  return (
    <div id="product-qa" className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xs my-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-border">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-foreground">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span>পণ্য সংক্রান্ত প্রশ্ন ও উত্তর (Questions & Answers)</span>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            এই পণ্য সম্পর্কে আপনার যেকোনো প্রশ্ন করুন অথবা অন্যদের করা প্রশ্নোত্তর দেখুন
          </p>
        </div>

        <Button
          onClick={() => setIsAskingOpen((prev) => !prev)}
          className="text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm active:scale-95"
        >
          {isAskingOpen ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>ফর্ম বন্ধ করুন</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>প্রশ্ন করুন (Ask Question)</span>
            </>
          )}
        </Button>
      </div>

      {/* Ask Question Expandable Form */}
      {isAskingOpen && (
        <form
          onSubmit={handleAskSubmit}
          className="my-4 sm:my-6 p-4 sm:p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span>সেলার বা ভেরিফাইড ক্রেতাদের কাছে সরাসরি প্রশ্ন করুন</span>
          </div>

          <div>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="পণ্যটির সাইজ, ওয়ারেন্টি, ব্যাটারি বা ডেলিভারি সম্পর্কে যা জানতে চান লিখুন..."
              rows={3}
              className="bg-background text-xs sm:text-sm resize-none"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              * কোনো ফোন নম্বর বা বহিঃসংযোগ লিঙ্ক শেয়ার করবেন না। প্রশ্নের উত্তর এলে আপনি পুশ নোটিফিকেশন পাবেন।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                value={askerName}
                onChange={(e) => setAskerName(e.target.value)}
                placeholder="আপনার নাম (ঐচ্ছিক)"
                className="bg-background text-xs sm:text-sm h-10"
              />
            </div>
            <div>
              <Input
                value={askerContact}
                onChange={(e) => setAskerContact(e.target.value)}
                placeholder="ইমেইল বা মোবাইল নম্বর (নোটিফিকেশনের জন্য)"
                className="bg-background text-xs sm:text-sm h-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAskingOpen(false)}
              className="text-xs"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingQuestion}
              className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
            >
              {isSubmittingQuestion ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>প্রশ্ন জমা দিন</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Search Bar & Stats */}
      {questions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4 sm:my-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রশ্ন বা উত্তর খুঁজুন (যেমন: ব্যাটারি, সাইজ, ওয়ারেন্টি)..."
              className="pl-9 h-10 text-xs sm:text-sm bg-muted/30"
            />
          </div>

          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 self-end sm:self-auto">
            <span>মোট {questions.length}টি প্রশ্ন</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">
              {questions.filter((q) => q.totalAnswers > 0).length}টির উত্তর রয়েছে
            </span>
          </div>
        </div>
      )}

      {/* Questions & Answers List */}
      <div className="space-y-4 sm:space-y-6 pt-2">
        {isLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>প্রশ্নোত্তর লোড হচ্ছে...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-8 sm:py-12 text-center text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl p-4">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs sm:text-sm font-semibold">
              {searchQuery ? "আপনার সার্চ করা শব্দ দিয়ে কোনো প্রশ্নোত্তর পাওয়া যায়নি।" : "এই পণ্য সম্পর্কে এখনো কোনো প্রশ্ন করা হয়নি।"}
            </p>
            {!isAskingOpen && !searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAskingOpen(true)}
                className="mt-3 text-xs font-bold text-primary border-primary/30 hover:bg-primary/5"
              >
                আপনিই প্রথম প্রশ্নকারী হোন!
              </Button>
            )}
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              id={`qa-${q.id}`}
              className="border border-border/80 rounded-xl p-3.5 sm:p-5 bg-card hover:border-primary/30 transition-colors shadow-2xs space-y-3"
            >
              {/* Question Row */}
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  Q
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    {q.questionText}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground/80">{q.authorName}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true, locale: bn })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answers List */}
              <div className="pl-4 sm:pl-8 space-y-2.5 border-l-2 border-primary/20 ml-3 sm:ml-3">
                {(!q.answers || q.answers.length === 0) ? (
                  <div className="text-[11px] text-muted-foreground italic flex items-center justify-between">
                    <span>এখনো কোনো উত্তর দেওয়া হয়নি। সাধারণত ১২ ঘণ্টার মধ্যে সেলার উত্তর দিয়ে থাকেন।</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingQuestionId(replyingQuestionId === q.id ? null : q.id)}
                      className="text-[11px] h-7 px-2 text-primary font-semibold hover:bg-primary/10"
                    >
                      উত্তর দিন
                    </Button>
                  </div>
                ) : (
                  q.answers.map((ans) => {
                    const isVoted = votedAnswerIds.has(ans.id) || (ans.helpfulVoters && user && ans.helpfulVoters.includes(user.uid));

                    return (
                      <div
                        key={ans.id}
                        className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5"
                      >
                        {/* Author Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-foreground">
                              {ans.authorName}
                            </span>

                            {ans.isOfficialStore && (
                              <Badge className="bg-orange-600 text-white text-[9px] px-1.5 py-0 font-extrabold flex items-center gap-0.5">
                                <Store className="w-2.5 h-2.5" />
                                <span>Official Seller</span>
                              </Badge>
                            )}

                            {ans.authorType === "admin" && (
                              <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-extrabold flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>Durtup Team</span>
                              </Badge>
                            )}

                            {ans.isVerifiedBuyer && (
                              <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-extrabold flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>যাচাইকৃত ক্রেতা (Verified Buyer)</span>
                              </Badge>
                            )}
                          </div>

                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(ans.createdAt), { addSuffix: true, locale: bn })}
                          </span>
                        </div>

                        {/* Answer Text */}
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                          {ans.answerText}
                        </p>

                        {/* Helpful voting button */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            onClick={() => handleVote(q.id, ans.id)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full transition-all border",
                              isVoted
                                ? "bg-primary/10 text-primary border-primary/30 font-bold"
                                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted"
                            )}
                          >
                            <ThumbsUp className={cn("w-3 h-3", isVoted && "fill-current")} />
                            <span>উপকারী ({ans.helpfulCount || 0})</span>
                          </button>

                          <button
                            onClick={() => setReplyingQuestionId(replyingQuestionId === q.id ? null : q.id)}
                            className="text-[10px] text-muted-foreground hover:text-primary font-medium"
                          >
                            আরেকটি উত্তর দিন
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Inline Reply Box */}
                {replyingQuestionId === q.id && (
                  <div className="pt-2 space-y-2 animate-in fade-in duration-200">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="আপনার উত্তর লিখুন (সেলার বা অভিজ্ঞ ক্রেতা হিসেবে)..."
                      rows={2}
                      className="text-xs resize-none bg-background"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={replierName}
                        onChange={(e) => setReplierName(e.target.value)}
                        placeholder="আপনার নাম"
                        className="text-xs h-8 max-w-[200px] bg-background"
                      />
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingQuestionId(null)}
                          className="h-8 text-xs"
                        >
                          বাতিল
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReplySubmit(q.id)}
                          disabled={isSubmittingReply}
                          className="h-8 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isSubmittingReply ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>উত্তর দিন</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
