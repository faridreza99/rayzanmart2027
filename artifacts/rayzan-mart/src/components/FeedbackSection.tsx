import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { usePublicFeedback, useFeedbackStats } from "@/hooks/useWebsiteFeedback";
import { useLanguage } from "@/contexts/LanguageContext";

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function FeedbackSection() {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: statsData } = useFeedbackStats();
  const { data } = usePublicFeedback(1, 8);

  const feedbacks = data?.feedback ?? [];
  const total = statsData?.total ?? 0;
  const avg = statsData?.avg ?? 0;

  if (feedbacks.length === 0) return null;

  const visibleCount = typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 3;
  const maxSlide = Math.max(0, feedbacks.length - visibleCount);

  const prev = () => setCurrentSlide((c) => Math.max(0, c - 1));
  const next = () => setCurrentSlide((c) => Math.min(maxSlide, c + 1));

  return (
    <section className="bg-muted/30 py-14">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {language === "bn" ? "গ্রাহকদের মতামত" : "Customer Feedback"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {language === "bn"
                ? "আমাদের গ্রাহকরা কী বলছেন"
                : "What our customers are saying"}
            </p>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-2xl font-bold text-foreground">{avg.toFixed(1)}</span>
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "bn"
                    ? `${total} জন রিভিউ করেছেন`
                    : `Based on ${total} reviews`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out gap-4"
            style={{ transform: `translateX(calc(-${currentSlide * (100 / visibleCount)}% - ${currentSlide * 16 / visibleCount}px))` }}
          >
            {feedbacks.map((item: any) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm flex-shrink-0"
                style={{ width: `calc(${100 / visibleCount}% - ${(visibleCount - 1) * 16 / visibleCount}px)` }}
              >
                <StarDisplay rating={item.rating} />
                <p className="mt-3 text-sm text-foreground leading-relaxed line-clamp-4">
                  "{item.comment}"
                </p>
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <span className="text-secondary font-bold text-xs">
                      {(item.user_name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-BD")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            <button
              onClick={prev}
              disabled={currentSlide === 0}
              className="p-2 rounded-full border border-border bg-card hover:bg-muted transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              disabled={currentSlide >= maxSlide}
              className="p-2 rounded-full border border-border bg-card hover:bg-muted transition disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Link href="/feedback">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              {language === "bn" ? "সব মতামত দেখুন" : "View All Feedback"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
