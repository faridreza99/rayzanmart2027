import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TestimonialRow {
  id: string;
  name: string;
  role_bn: string;
  role_en: string;
  content_bn: string;
  content_en: string;
  income_bn: string | null;
  income_en: string | null;
  avatar_url: string | null;
  rating: number;
  is_active: boolean;
}

const STATIC_TESTIMONIALS: TestimonialRow[] = [
  {
    id: "1",
    name: "রাহেলা বেগম",
    role_bn: "গৃহিণী, ঢাকা",
    role_en: "Housewife, Dhaka",
    content_bn: "রায়জান মার্টের অ্যাফিলিয়েট প্রোগ্রামে যোগ দিয়ে প্রতি মাসে ১৫,০০০ টাকার বেশি আয় করছি! পরিবারের জন্য বাড়তি আয়ের এই সুযোগ সত্যিই অসাধারণ!",
    content_en: "I joined Rayzan Mart affiliate program and earn over 15,000 BDT monthly. This additional income for my family is truly amazing!",
    income_bn: "১৫,০০০+ টাকা/মাস",
    income_en: "15,000+ BDT/month",
    avatar_url: null,
    rating: 5,
    is_active: true,
  },
  {
    id: "2",
    name: "মোহাম্মদ রাকিব",
    role_bn: "ছাত্র, চট্টগ্রাম",
    role_en: "Student, Chittagong",
    content_bn: "পড়াশোনার পাশাপাশি রায়জান মার্ট থেকে আয় করছি। মাসে গড়ে ৮,০০০-১০,০০০ টাকা পাচ্ছি।",
    content_en: "Earning alongside my studies from Rayzan Mart. Getting 8,000-10,000 BDT monthly on average.",
    income_bn: "৮,০০০-১০,০০০ টাকা/মাস",
    income_en: "8,000-10,000 BDT/month",
    avatar_url: null,
    rating: 5,
    is_active: true,
  },
  {
    id: "3",
    name: "সুমাইয়া আক্তার",
    role_bn: "উদ্যোক্তা, সিলেট",
    role_en: "Entrepreneur, Sylhet",
    content_bn: "রায়জান মার্টের পণ্যের মান অনেক ভালো। কাস্টমাররা সন্তুষ্ট, তাই আমার কমিশনও ভালো আসে।",
    content_en: "Product quality is excellent. Customers are satisfied and my commissions keep growing.",
    income_bn: "১২,০০০+ টাকা/মাস",
    income_en: "12,000+ BDT/month",
    avatar_url: null,
    rating: 5,
    is_active: true,
  },
];

export const TestimonialsSection = () => {
  const { language } = useLanguage();

  const { data: testimonials } = useQuery<TestimonialRow[]>({
    queryKey: ["testimonials-public"],
    queryFn: async () => {
      const res = await fetch("/api/db/affiliate_testimonials?is_active=true&_order=created_at:desc");
      if (!res.ok) return STATIC_TESTIMONIALS;
      const json = await res.json();
      const rows: TestimonialRow[] = Array.isArray(json) ? json : json?.data ?? [];
      return rows.length > 0 ? rows : STATIC_TESTIMONIALS;
    },
    staleTime: 5 * 60 * 1000,
  });

  const list = (testimonials && testimonials.length > 0) ? testimonials : STATIC_TESTIMONIALS;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

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
          {list.map((t) => (
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
                "{language === "bn" ? t.content_bn : t.content_en}"
              </p>

              {(language === "bn" ? t.income_bn : t.income_en) && (
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {language === "bn" ? "আয়: " : "Income: "}
                  {language === "bn" ? t.income_bn : t.income_en}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                {t.avatar_url ? (
                  <img
                    src={t.avatar_url}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {getInitials(t.name)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">
                    {language === "bn" ? t.role_bn : t.role_en}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
