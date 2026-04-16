import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepageFAQs } from "@/hooks/useFAQs";

export const FAQSection = () => {
  const { language } = useLanguage();
  const { data: faqs, isLoading } = useHomepageFAQs();

  const list = faqs?.filter(f => f.is_active) ?? [];

  if (isLoading || list.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {language === "bn" ? "সাধারণ জিজ্ঞাসাসমূহ" : "Frequently Asked Questions"}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {language === "bn" ? "আপনার কোনো প্রশ্ন থাকলে নিচে দেখতে পারেন" : "Find answers to common questions below"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <Accordion type="single" collapsible className="w-full">
            {list.map((faq, index) => (
              <AccordionItem key={faq.id} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-primary">
                  {language === "bn" ? faq.question_bn : faq.question_en}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed">
                  {language === "bn" ? faq.answer_bn : faq.answer_en}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
