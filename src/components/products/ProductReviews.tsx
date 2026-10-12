import { useState, useEffect } from "react";
import { Star, ThumbsUp, User, MessageSquarePlus, CheckCircle2, Sparkles, X, ShieldCheck, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ProductReviewsProps {
  productId: string;
  ratingAverage?: number;
  ratingCount?: number;
  productName?: string;
}

interface ReviewItem {
  id: string;
  product_id: string;
  rating: number;
  user_name?: string;
  title?: string;
  comment: string;
  created_at: string;
  is_verified?: boolean;
  helpful_count?: number;
}

export function ProductReviews({ productId, ratingAverage, ratingCount, productName }: ProductReviewsProps) {
  const [showReviewsList, setShowReviewsList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [helpfulLiked, setHelpfulLiked] = useState<Record<string, boolean>>({});

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    } else if (user?.email) {
      setName(user.email.split("@")[0]);
    }
  }, [profile, user]);

  const { data: dbReviews = [], refetch } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", { ascending: false })
          .limit(30);

        return (data || []) as ReviewItem[];
      } catch (err) {
        console.warn("Reviews fetch fallback notice:", err);
        return [];
      }
    },
  });

  // Local storage submitted reviews fallback for instant visibility
  const [localReviews, setLocalReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`local_reviews_${productId}`);
      if (raw) {
        setLocalReviews(JSON.parse(raw));
      }
    } catch {}
  }, [productId]);

  const allReviews = [...localReviews, ...dbReviews];
  const displayReviewsList = allReviews;

  // Calculate actual rating average and distribution
  const avgRating = allReviews.length > 0 
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : (ratingAverage || 0);

  const totalReviewsCount = allReviews.length > 0 ? allReviews.length : (ratingCount || 0);

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = displayReviewsList.filter((r) => r.rating === star).length;
    const percentage = displayReviewsList.length > 0 ? (count / displayReviewsList.length) * 100 : 0;
    return { star, count, percentage };
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({ title: "Review required", description: "Please write your review feedback.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      product_id: productId,
      rating,
      user_name: name.trim() || (user ? profile?.full_name || "Verified Customer" : "Customer"),
      title: title.trim() || undefined,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
      is_verified: true,
      helpful_count: 1
    };

    try {
      // 1. Save to Supabase / DB
      try {
        await supabase.from("reviews").insert({
          id: newRev.id,
          product_id: productId,
          user_id: user?.id || `anon-${Date.now()}`,
          user_name: newRev.user_name,
          rating: newRev.rating,
          title: newRev.title,
          comment: newRev.comment,
          is_approved: true,
          created_at: newRev.created_at
        });
      } catch (dbErr) {
        console.warn("Review insert DB notice:", dbErr);
      }

      // 2. Save to Firestore
      try {
        await setDoc(doc(db, "reviews", newRev.id), {
          id: newRev.id,
          product_id: productId,
          user_id: user?.id || `anon-${Date.now()}`,
          user_name: newRev.user_name,
          rating: newRev.rating,
          title: newRev.title || "",
          comment: newRev.comment,
          is_approved: true,
          created_at: newRev.created_at
        }, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore review save error:", fsErr);
      }

      // 3. Save locally for instant persistence
      const updatedLocal = [newRev, ...localReviews];
      setLocalReviews(updatedLocal);
      localStorage.setItem(`local_reviews_${productId}`, JSON.stringify(updatedLocal));
      try {
        const adminRevRaw = localStorage.getItem("enterprise_admin_reviews") || "[]";
        const adminRevs = JSON.parse(adminRevRaw);
        localStorage.setItem("enterprise_admin_reviews", JSON.stringify([newRev, ...adminRevs]));
      } catch {}

      toast({
        title: "Review submitted! ⭐",
        description: "Thank you for sharing your valuable feedback.",
      });

      // Reset form & automatically expand reviews so user sees their new feedback
      setComment("");
      setTitle("");
      setShowForm(false);
      setShowReviewsList(true);
      refetch();
    } catch (err: any) {
      toast({
        title: "Error submitting review",
        description: err.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHelpful = (revId: string) => {
    setHelpfulLiked(prev => ({ ...prev, [revId]: !prev[revId] }));
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6 mt-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            Ratings & Reviews
            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary">
              {totalReviewsCount}
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified ratings and customer experiences
          </p>
        </div>

        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="h-9 px-3.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 shadow-sm rounded-xl"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Submission Form Modal / Box */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-muted/30 to-background border border-primary/20 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Write Product Review
            </span>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Interactive Star Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Overall Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = (hoverRating || rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starVal)}
                    className="p-1 -m-1 text-warning hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 sm:h-7 sm:w-7 transition-colors ${
                        isFilled ? "fill-warning text-warning" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold ml-2 text-foreground">
                {rating === 5 ? "5.0 - Excellent! 🔥" : rating === 4 ? "4.0 - Very Good 👍" : rating === 3 ? "3.0 - Good" : rating === 2 ? "2.0 - Fair" : "1.0 - Poor"}
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Your Name</label>
              <Input
                placeholder="e.g. Nahid Islam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Headline (Optional)</label>
              <Input
                placeholder="e.g. Great quality & fast delivery!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Your Review</label>
            <Textarea
              placeholder="What did you like or dislike about this product? How is the quality and performance?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="text-xs resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-xs h-8 px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {submitting ? "Posting..." : "Post Review"}
            </Button>
          </div>
        </form>
      )}

      {/* Rating Summary Card */}
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-stretch p-4 rounded-xl bg-muted/30 border">
        {/* Big rating number */}
        <div className="flex flex-col items-center justify-center min-w-[130px] pr-0 sm:pr-4 sm:border-r border-border/60">
          <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            {avgRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-0.5 mt-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(avgRating)
                    ? "fill-warning text-warning"
                    : "fill-muted text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground mt-1">
            Based on {totalReviewsCount} reviews
          </span>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 w-full space-y-1.5">
          {distribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground font-semibold">{star}</span>
              <Star className="h-3 w-3 fill-warning text-warning shrink-0" />
              <Progress value={percentage} className="flex-1 h-2 bg-muted rounded-full" />
              <span className="w-7 text-right text-muted-foreground font-medium text-[11px]">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Collapsible Section - Hidden by default for smooth scrolling */}
      {!showReviewsList ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowReviewsList(true)}
            className="w-full group flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/60 hover:border-primary/40 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  Customer Reviews & Feedback
                  <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.2 bg-primary/10 text-primary border-none">
                    {displayReviewsList.length}
                  </Badge>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Click to read buyer feedback and experiences
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
              <span>View Reviews</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-foreground">
                Customer Feedback
              </span>
              <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.2 bg-primary/10 text-primary border-none">
                {displayReviewsList.length}
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReviewsList(false)}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg"
            >
              <span>Hide Reviews</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Reviews list or clean empty state */}
          {displayReviewsList.length === 0 ? (
            <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 p-4">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">No customer reviews yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Be the first to share your experience with this product!</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3">
              {displayReviewsList.map((rev) => {
                const isLiked = helpfulLiked[rev.id];
                const likes = (rev.helpful_count || 0) + (isLiked ? 1 : 0);

                return (
                  <div key={rev.id} className="p-3.5 sm:p-4 rounded-xl bg-muted/20 hover:bg-muted/30 border border-border/40 transition-all space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-bold text-foreground">
                              {rev.user_name || "Verified Customer"}
                            </p>
                            {rev.is_verified && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Verified Purchase
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(rev.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                              i < rev.rating
                                ? "fill-warning text-warning"
                                : "fill-muted text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.title && (
                      <p className="font-bold text-xs sm:text-sm text-foreground">
                        {rev.title}
                      </p>
                    )}

                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {rev.comment}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <span className="text-[10px]">Was this review helpful?</span>
                      <button
                        type="button"
                        onClick={() => toggleHelpful(rev.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors ${
                          isLiked 
                            ? "bg-primary/10 border-primary/30 text-primary font-semibold" 
                            : "bg-background/80 hover:bg-muted border-border/60 text-muted-foreground"
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>Helpful ({likes})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold h-8 rounded-xl border-dashed"
            onClick={() => setShowReviewsList(false)}
          >
            <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
            Hide Reviews
          </Button>
        </div>
      )}
    </div>
  );
}
