export interface FooterPageItem {
  title_bn: string;
  title_en: string;
  content_bn: string;
  content_en: string;
}

export type FooterPagesSettings = Record<string, FooterPageItem>;

export const FOOTER_PAGE_PATHS = [
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/refund",
  "/shipping",
] as const;

export const FOOTER_PAGES_DEFAULTS: FooterPagesSettings = {
  about: {
    title_bn: "আমাদের সম্পর্কে",
    title_en: "About Us",
    content_bn:
      "আমরা বাংলাদেশভিত্তিক একটি অনলাইন শপিং প্ল্যাটফর্ম।\nআমাদের লক্ষ্য হচ্ছে ন্যায্য দামে মানসম্মত পণ্য দ্রুত ডেলিভারি করা।\nগ্রাহকের আস্থা ও সেরা সার্ভিস আমাদের প্রধান অঙ্গীকার।",
    content_en:
      "We are a Bangladesh-based online shopping platform.\nOur goal is to provide quality products at fair prices with fast delivery.\nCustomer trust and service quality are our top priorities.",
  },
  contact: {
    title_bn: "যোগাযোগ",
    title_en: "Contact Us",
    content_bn:
      "হটলাইন: +880 1234-567890\nইমেইল: support@banglashop.com\nঠিকানা: গুলশান-২, ঢাকা-১২১২, বাংলাদেশ",
    content_en:
      "Hotline: +880 1234-567890\nEmail: support@banglashop.com\nAddress: Gulshan-2, Dhaka-1212, Bangladesh",
  },
  faq: {
    title_bn: "প্রশ্নোত্তর",
    title_en: "FAQ",
    content_bn:
      "প্রশ্ন: ডেলিভারিতে কত সময় লাগে?\nউত্তর: অবস্থানভেদে সাধারণত ২-৫ দিন।\n\nপ্রশ্ন: রিটার্ন করা যাবে?\nউত্তর: পণ্যের ধরন অনুযায়ী রিটার্ন নীতিমালা প্রযোজ্য।",
    content_en:
      "Q: How long does delivery take?\nA: Usually 2-5 days based on location.\n\nQ: Can I return products?\nA: Return eligibility depends on product type and policy.",
  },
  privacy: {
    title_bn: "প্রাইভেসি পলিসি",
    title_en: "Privacy Policy",
    content_bn:
      "আপনার ব্যক্তিগত তথ্য নিরাপদভাবে সংরক্ষণ ও ব্যবহার করা হয়।\nঅর্ডার প্রসেসিং ও সার্ভিস উন্নয়নের জন্য প্রয়োজনীয় ডেটা সংগ্রহ করা হয়।\nআপনার সম্মতি ছাড়া তথ্য তৃতীয় পক্ষের কাছে বিক্রি করা হয় না।",
    content_en:
      "Your personal information is stored and handled securely.\nWe collect necessary data to process orders and improve service.\nWe do not sell your data to third parties without consent.",
  },
  terms: {
    title_bn: "শর্তাবলী",
    title_en: "Terms & Conditions",
    content_bn:
      "এই সাইট ব্যবহার করলে আমাদের শর্তাবলী মেনে নেওয়া হয়েছে বলে গণ্য হবে।\nমূল্য, স্টক ও অফার যেকোনো সময় পরিবর্তিত হতে পারে।\nপ্রতারণামূলক কার্যক্রমের ক্ষেত্রে অ্যাকাউন্ট সীমাবদ্ধ করা হতে পারে।",
    content_en:
      "By using this site, you agree to our terms and conditions.\nPrices, stock, and offers may change at any time.\nAccounts may be restricted in case of fraudulent activity.",
  },
  refund: {
    title_bn: "রিফান্ড পলিসি",
    title_en: "Refund Policy",
    content_bn:
      "বাতিল/রিটার্ন অনুমোদনের পর রিফান্ড প্রক্রিয়া শুরু হয়।\nরিফান্ড সাধারণত ৩-৭ কর্মদিবসের মধ্যে সম্পন্ন হয়।\nপেমেন্ট মাধ্যম অনুযায়ী সময় কম-বেশি হতে পারে।",
    content_en:
      "Refund processing starts after cancellation/return approval.\nRefunds are generally completed within 3-7 business days.\nActual timing may vary by payment method.",
  },
  shipping: {
    title_bn: "শিপিং পলিসি",
    title_en: "Shipping Policy",
    content_bn:
      "অর্ডার নিশ্চিত হওয়ার পর দ্রুত প্রসেসিং শুরু করা হয়।\nডেলিভারি সময় অবস্থান ও কুরিয়ার সার্ভিস অনুযায়ী পরিবর্তিত হতে পারে।\nউৎসব/ছুটির সময় ডেলিভারি সময় কিছুটা বেশি লাগতে পারে।",
    content_en:
      "We start processing quickly after order confirmation.\nDelivery timing may vary by location and courier partner.\nDuring holidays/festivals, delivery may take slightly longer.",
  },
};
