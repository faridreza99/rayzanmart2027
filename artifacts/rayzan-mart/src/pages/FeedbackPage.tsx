import { useState } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePublicFeedback, useFeedbackStats, useSubmitFeedback, useMyFeedback } from "@/hooks/useWebsiteFeedback";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hovered || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: statsData } = useFeedbackStats();
  const { data, isLoading } = usePublicFeedback(page, 10);
  const { data: myFeedbacks } = useMyFeedback();
  const submitMutation = useSubmitFeedback();

  const feedbacks = data?.feedback ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = statsData?.total ?? 0;
  const avg = statsData?.avg ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error(language === "bn" ? "মন্তব্য লিখুন" : "Please write a comment");
      return;
    }
    try {
      await submitMutation.mutateAsync({ rating, comment });
      toast.success(
        language === "bn"
          ? "ফিডব্যাক জমা হয়েছে! অনুমোদনের পর প্রকাশিত হবে।"
          : "Feedback submitted! It will appear after approval."
      );
      setComment("");
      setRating(5);
    } catch {
      toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-r from-secondary to-green-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-white text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">
            {language === "bn" ? "গ্রাহকদের মতামত" : "Customer Feedback"}
          </h1>
          <p className="text-white/80">
            {language === "bn"
              ? "আমাদের সেবা সম্পর্কে আপনার মতামত জানান"
              : "Share your experience with RayzanMart"}
          </p>
          {total > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-3xl font-bold">{avg.toFixed(1)}</span>
              <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              <span className="text-white/70 text-sm">
                {language === "bn" ? `${total} জন রিভিউ` : `${total} reviews`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feedback form */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-4">
              <h2 className="font-bold text-foreground text-lg mb-4">
                {language === "bn" ? "আপনার মতামত দিন" : "Share Your Feedback"}
              </h2>

              {!user ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-4">
                    {language === "bn"
                      ? "ফিডব্যাক দিতে লগইন করুন"
                      : "Please log in to submit feedback"}
                  </p>
                  <a href="/login">
                    <Button className="bg-secondary hover:bg-green-700 text-white">
                      {language === "bn" ? "লগইন করুন" : "Login"}
                    </Button>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {language === "bn" ? "রেটিং" : "Rating"}
                    </label>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {language === "bn" ? "আপনার মন্তব্য" : "Your Comment"}
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        language === "bn"
                          ? "আপনার অভিজ্ঞতা লিখুন..."
                          : "Write your experience..."
                      }
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-secondary hover:bg-green-700 text-white gap-2"
                    disabled={submitMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                    {submitMutation.isPending
                      ? (language === "bn" ? "জমা হচ্ছে..." : "Submitting...")
                      : (language === "bn" ? "জমা দিন" : "Submit")}
                  </Button>
                </form>
              )}

              {/* My submitted feedback */}
              {user && myFeedbacks && myFeedbacks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    {language === "bn" ? "আপনার জমা দেওয়া ফিডব্যাক" : "Your Submitted Feedback"}
                  </h3>
                  <div className="space-y-3">
                    {myFeedbacks.map((f) => (
                      <div key={f.id} className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <StarDisplay rating={f.rating} />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            f.is_approved
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {f.is_approved
                              ? (language === "bn" ? "অনুমোদিত" : "Approved")
                              : (language === "bn" ? "অপেক্ষমান" : "Pending")}
                          </span>
                        </div>
                        <p className="text-xs text-foreground line-clamp-2">{f.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All approved feedback */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-foreground text-lg mb-4">
              {language === "bn" ? "সকল মতামত" : "All Feedback"}
              {total > 0 && (
                <span className="text-muted-foreground font-normal text-sm ml-2">({total})</span>
              )}
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{language === "bn" ? "এখনো কোনো ফিডব্যাক নেই" : "No feedback yet"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((item: any) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                          <span className="text-secondary font-bold text-sm">
                            {(item.user_name || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{item.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString(
                              language === "bn" ? "bn-BD" : "en-BD",
                              { year: "numeric", month: "long", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                      <StarDisplay rating={item.rating} />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">"{item.comment}"</p>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      {language === "bn" ? "আগের" : "Previous"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {language === "bn"
                        ? `${page} / ${totalPages}`
                        : `Page ${page} of ${totalPages}`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      {language === "bn" ? "পরের" : "Next"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
