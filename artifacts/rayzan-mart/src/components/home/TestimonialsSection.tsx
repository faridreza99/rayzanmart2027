import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTestimonials } from "@/hooks/useTestimonials";

export const TestimonialsSection = () => {
  const { language } = useLanguage();
  const { data: testimonials, isLoading } = useTestimonials();

  const list = testimonials?.filter(t => t.is_active) ?? [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading || list.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {language === "bn" ? "আমাদের সাথে পথচলা" : "Stories From Our Community"}
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            {language === "bn"
              ? "আমাদের অ্যাফিলিয়েটদের সাফল্যের গল্প"
              : "Success stories from our affiliates"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {list.map((t) => {
            const nameStr = typeof t.name === "object"
              ? (t.name[language as "bn" | "en"] || t.name.en || t.name.bn || "")
              : (t.name as string);
            const roleStr = typeof t.role === "object"
              ? (t.role[language as "bn" | "en"] || t.role.en || "")
              : "";
            const storyStr = typeof t.story === "object"
              ? (t.story[language as "bn" | "en"] || t.story.en || "")
              : "";
            const incomeStr = typeof t.income === "object"
              ? (t.income[language as "bn" | "en"] || "")
              : "";

            return (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-slate-700 leading-relaxed flex-1">
                  "{storyStr}"
                </p>

                {incomeStr && (
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {language === "bn" ? "আয়: " : "Income: "}
                    {incomeStr}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={nameStr}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {getInitials(nameStr)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{nameStr}</p>
                    <p className="text-sm text-slate-500">{roleStr}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
