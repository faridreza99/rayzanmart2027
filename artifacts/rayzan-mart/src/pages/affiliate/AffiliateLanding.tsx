import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, Phone, Loader2, Star } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAffiliateFAQs } from "@/hooks/useFAQs";
import { useTestimonials } from "@/hooks/useTestimonials";
import { useVideoCampaigns } from "@/hooks/useVideoCampaigns";
import { useAffiliatePageContent, getContent } from "@/hooks/useAffiliatePageContent";

const AffiliateLanding = () => {
  const { language } = useLanguage();

  const { data: faqs, isLoading: faqsLoading } = useAffiliateFAQs();
  const { data: testimonials, isLoading: testimonialsLoading } = useTestimonials();
  const { data: videoCampaigns, isLoading: videosLoading } = useVideoCampaigns();
  const { data: pageContent } = useAffiliatePageContent();

  const activeFaqs = faqs?.filter(f => f.is_active) || [];
  const activeTestimonials = testimonials?.filter(t => t.is_active) || [];
  const activeVideos = videoCampaigns?.filter(v => v.is_active) || [];

  const c = (section: string, key: string, fallback: { bn: string; en: string }) => {
    const val = getContent(pageContent, section, key);
    return (language === "bn" ? val.bn : val.en) || (language === "bn" ? fallback.bn : fallback.en);
  };

  const heroBullets = [
    {
      section: "hero",
      key: "bullet_1",
      fallback: { bn: "ফ্রি অ্যাকাউন্ট তৈরি", en: "Free account creation" },
    },
    {
      section: "hero",
      key: "bullet_2",
      fallback: { bn: "পণ্য শেয়ার করে কমিশন আয়", en: "Earn commission by sharing products" },
    },
    {
      section: "hero",
      key: "bullet_3",
      fallback: { bn: "মোবাইল দিয়ে সবকিছু করা সম্ভব", en: "Everything is possible with mobile" },
    },
  ];

  return (
    <MainLayout>
      <div className="bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50 py-16 lg:py-24">
          <div className="container grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up">
              <h1 className="mb-6 text-4xl font-bold leading-tight text-slate-900 lg:text-6xl">
                {c("hero", "headline", {
                  bn: "ঘরে বসে ইনকাম করুন রায়জনমার্ট-এর সাথে",
                  en: "Start Earning from Home with Rayzanmart",
                })}
              </h1>
              <p className="mb-8 text-lg text-slate-600 lg:text-xl">
                {c("hero", "subheadline", {
                  bn: "আপনার মোবাইল বা কম্পিউটার ব্যবহার করেই শুরু করুন সহজ আয়ের যাত্রা—কোনো ইনভেস্টমেন্ট ছাড়াই",
                  en: "Use your mobile or computer to begin your earning journey—no investment required",
                })}
              </p>
              <ul className="mb-10 space-y-4">
                {heroBullets.map((bullet, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <span className="text-lg text-slate-700">
                      {c(bullet.section, bullet.key, bullet.fallback)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button size="lg" className="h-14 px-8 text-lg font-bold btn-bounce">
                  {c("hero", "cta_button", {
                    bn: "এখনই ফ্রি অ্যাকাউন্ট খুলুন",
                    en: "Create Free Account Now",
                  })}
                </Button>
              </Link>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-xl animate-fade-in">
              {videosLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeVideos.length > 0 ? (
                <iframe
                  className="h-full w-full"
                  src={activeVideos[0].video_url?.replace('watch?v=', 'embed/')}
                  title={activeVideos[0].title?.[language] || "Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 italic text-slate-400">
                  Video coming soon...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Success Stories Section */}
        {!testimonialsLoading && activeTestimonials.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {c("success_stories", "heading", {
                    bn: "আমাদের সাথে পথচলা",
                    en: "Stories From Our Community",
                  })}
                </h2>
                <p className="mt-4 text-lg text-slate-500">
                  {c("success_stories", "subheading", {
                    bn: "আমাদের অ্যাফিলিয়েটদের সাফল্যের গল্প",
                    en: "Success stories from our affiliates",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {activeTestimonials.map((t) => {
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
                  const initials = nameStr.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

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
                            {initials}
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
        )}

        {/* Mid CTA Section */}
        <section className="bg-primary py-12 text-primary-foreground">
          <div className="container flex flex-col items-center justify-between gap-8 md:flex-row">
            <h3 className="text-2xl font-bold lg:text-3xl text-white">
              {c("mid_cta", "heading", {
                bn: "আজই আপনার যাত্রা শুরু করুন",
                en: "Start Your Journey Today",
              })}
            </h3>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="font-bold h-12 px-10 btn-bounce">
                {c("mid_cta", "button", {
                  bn: "আজই শুরু করুন",
                  en: "Start Your Journey Today",
                })}
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-slate-50 py-16 lg:py-24">
          <div className="container max-w-3xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">
                {c("faq", "heading", {
                  bn: "সাধারণ জিজ্ঞাসাসমূহ",
                  en: "Frequently Asked Questions",
                })}
              </h2>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              {faqsLoading ? (
                 <div className="flex justify-center">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
              ) : activeFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {activeFaqs.map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border-slate-100">
                      <AccordionTrigger className="text-left text-lg font-semibold text-slate-800 hover:text-primary decoration-primary">
                        {language === "bn" ? faq.question_bn : faq.question_en}
                      </AccordionTrigger>
                      <AccordionContent className="text-base text-slate-600 leading-relaxed">
                        {language === "bn" ? faq.answer_bn : faq.answer_en}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-center text-muted-foreground italic">FAQs coming soon...</p>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 text-center container">
          <div className="bg-gradient-to-r from-orange-500 to-primary py-16 px-6 text-white rounded-3xl shadow-xl">
            <h2 className="mb-4 text-4xl font-bold lg:text-5xl">
              {c("final_cta", "heading", {
                bn: "আজই শুরু করুন আপনার অনলাইন ইনকাম যাত্রা",
                en: "Start Your Online Earning Journey Today",
              })}
            </h2>
            <p className="mb-8 text-lg text-orange-50 opacity-90">
              {c("final_cta", "subtext", {
                bn: "ছোট থেকে শুরু করুন, ধাপে ধাপে শিখুন এবং আপনার ইনকাম বাড়ান",
                en: "Start small, learn step by step, and build your income",
              })}
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="h-14 px-12 text-lg font-bold btn-bounce shadow-lg">
                {c("final_cta", "button", {
                  bn: "আজই শুরু করুন",
                  en: "Start Your Journey Today",
                })}
              </Button>
            </Link>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16 bg-white border-t">
          <div className="container flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                {c("contact", "label", {
                  bn: "জরুরি প্রয়োজনে কল করুন",
                  en: "Call for urgent support",
                })}
              </p>
              <a 
                href={`tel:${c("contact", "phone", { bn: "+8801347195345", en: "+8801347195345" })}`}
                className="text-3xl font-bold text-primary hover:scale-105 transition-transform flex items-center gap-3"
              >
                <Phone className="h-8 w-8" />
                {c("contact", "phone", { bn: "+8801347195345", en: "+8801347195345" })}
              </a>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default AffiliateLanding;
