import { Link } from "wouter";
import { CheckCircle, DollarSign, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetAffiliatePageContent, useGetAffiliateTestimonials, useGetAffiliateLeaderboard } from "@workspace/api-client-react";

const BENEFITS = [
  { icon: DollarSign, title: "Earn Commission", en: "Earn up to 10% commission on every sale you refer", bn: "প্রতিটি বিক্রয়ে ১০% পর্যন্ত কমিশন অর্জন করুন" },
  { icon: Users, title: "Build Your Network", en: "Share your referral link and grow your income", bn: "আপনার রেফারেল লিংক শেয়ার করুন এবং আয় বাড়ান" },
  { icon: CheckCircle, title: "Fast Withdrawals", en: "Withdraw your earnings anytime via bKash or Nagad", bn: "যেকোনো সময় bKash বা Nagad এ উত্তোলন করুন" },
  { icon: Star, title: "Tier Rewards", en: "Unlock higher commission rates as you grow", bn: "বেশি বিক্রয়ে উচ্চতর কমিশন পান" },
];

export default function AffiliateLandingPage() {
  const { data: testimonials } = useGetAffiliateTestimonials({ query: {} });
  const { data: leaderboard } = useGetAffiliateLeaderboard({ query: {} });

  const topAffiliates = (leaderboard as any[] ?? []).slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary via-green-700 to-green-900 py-24 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-white/70 text-lg mb-3">অ্যাফিলিয়েট প্রোগ্রাম</p>
          <h1 className="text-5xl font-bold mb-6">Earn with RayzanMart</h1>
          <p className="text-xl text-white/80 mb-4">
            Join thousands of Bangladeshis earning income by promoting our products
          </p>
          <p className="text-white/60 mb-10">রাইজান মার্টের পণ্য প্রচার করুন এবং প্রতি বিক্রয়ে কমিশন উপার্জন করুন</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/affiliate/apply">
              <Button className="bg-primary hover:bg-red-700 text-white text-lg px-10 py-3 font-semibold">
                Apply Now — Free
              </Button>
            </Link>
            <Link href="/affiliate/dashboard">
              <Button variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-10 py-3">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-white py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[
            { value: "10%", label: "Max Commission" },
            { value: "1000+", label: "Active Affiliates" },
            { value: "৳50M+", label: "Paid Out" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-white/80 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">Why Join Us?</h2>
        <p className="text-center text-muted-foreground mb-12">কেন আমাদের সাথে যোগ দেবেন?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map(({ icon: Icon, title, en, bn }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-foreground/80 mb-1">{en}</p>
              <p className="text-xs text-muted-foreground">{bn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Affiliates */}
      {topAffiliates.length > 0 && (
        <section className="bg-muted py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">Top Affiliates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topAffiliates.map((aff: any, i: number) => (
                <div key={aff.id} className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                    {aff.avatarUrl ? (
                      <img src={aff.avatarUrl} alt={aff.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-secondary">{i + 1}</span>
                    )}
                  </div>
                  <p className="font-bold text-foreground">{aff.name}</p>
                  <p className="text-xs text-muted-foreground mb-2 capitalize">{aff.tier} tier</p>
                  <p className="text-lg font-bold text-primary">৳{Number(aff.totalCommission).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {(testimonials as any[] ?? []).length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">What Our Affiliates Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(testimonials as any[]).map((t: any) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-3">{t.contentEn}</p>
                <p className="text-muted-foreground text-xs mb-3">{t.contentBn}</p>
                <div>
                  <p className="font-bold text-foreground text-sm">{t.name}</p>
                  {t.roleEn && <p className="text-xs text-muted-foreground">{t.roleEn}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-white/80 mb-8">Join for free. No upfront cost. Start earning today.</p>
          <Link href="/affiliate/apply">
            <Button className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-3 font-semibold">
              Apply for Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
