import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

interface FAQRow {
  id: string;
  question_bn: string;
  question_en: string;
  answer_bn: string;
  answer_en: string;
  is_active: boolean;
  sort_order: number;
}

const STATIC_FAQS: FAQRow[] = [
  {
    id: "1",
    question_bn: "অ্যাফিলিয়েট প্রোগ্রাম কীভাবে কাজ করে?",
    question_en: "How does the Affiliate Program work?",
    answer_bn: "আপনি পণ্যের লিংক শেয়ার করে প্রতিটি সফল বিক্রয়ে কমিশন আয় করতে পারেন।",
    answer_en: "You can share product links and earn commission on every successful sale made through your links.",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "2",
    question_bn: "সর্বনিম্ন উত্তোলনের পরিমাণ কত?",
    question_en: "What is the minimum withdrawal amount?",
    answer_bn: "সর্বনিম্ন উত্তোলনের পরিমাণ ৫০০ টাকা।",
    answer_en: "The minimum withdrawal amount is 500 BDT.",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "3",
    question_bn: "ডেলিভারি হতে কত সময় লাগে?",
    question_en: "How long does delivery take?",
    answer_bn: "ঢাকার ভিতরে ১-২ দিন এবং ঢাকার বাইরে ৩-৫ দিন।",
    answer_en: "1-2 days inside Dhaka, 3-5 days outside Dhaka.",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "4",
    question_bn: "আমি কীভাবে আমার অর্ডার ট্র্যাক করব?",
    question_en: "How can I track my order?",
    answer_bn: "অর্ডার কনফার্ম হলে SMS-এ ট্র্যাকিং বিস্তারিত পাবেন।",
    answer_en: "You will receive an SMS with tracking details once your order is confirmed.",
    is_active: true,
    sort_order: 4,
  },
];

export const FAQSection = () => {
  const { language } = useLanguage();

  const { data: faqs } = useQuery<FAQRow[]>({
    queryKey: ["faq-items-public"],
    queryFn: async () => {
      const res = await fetch("/api/db/faq_items?is_active=true&_order=sort_order:asc,created_at:asc");
      if (!res.ok) return STATIC_FAQS;
      const json = await res.json();
      const rows: FAQRow[] = Array.isArray(json) ? json : json?.data ?? [];
      return rows.length > 0 ? rows : STATIC_FAQS;
    },
    staleTime: 5 * 60 * 1000,
  });

  const list = (faqs && faqs.length > 0) ? faqs : STATIC_FAQS;

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
