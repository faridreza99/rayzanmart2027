import { MainLayout } from "@/components/layout/MainLayout";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { AllProducts } from "@/components/home/AllProducts";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { BestSelling } from "@/components/home/BestSelling";
import { TrustBadges } from "@/components/home/TrustBadges";
import { LoyaltyBanner } from "@/components/home/LoyaltyBanner";
import { FAQSection } from "@/components/home/FAQSection";
import { FloatingWhatsApp } from "@/components/home/FloatingWhatsApp";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import FeedbackSection from "@/components/FeedbackSection";

const Index = () => {
  // Track affiliate referrals from URL params


  return (
    <MainLayout>
      <FlashSaleBanner />
      <HeroBanner />
      <CategoryGrid />
      <FeaturedProducts />
      <BestSelling />
      <LoyaltyBanner />
      <AllProducts />
      <TrustBadges />
      <TestimonialsSection />
      <FeedbackSection />
      <CTASection />
      <FAQSection />
      <FloatingWhatsApp />
    </MainLayout>
  );
};

export default Index;
