export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  paymentMethod: "bkash" | "nagad" | "bank";
  paymentDetails: string;
  status: "active" | "inactive" | "pending";
  totalClicks: number;
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  commissionRate: number; // percentage
  tier: "bronze" | "silver" | "gold" | "platinum";
  joinedAt: string;
}

export interface Campaign {
  id: string;
  affiliateId: string;
  name: { bn: string; en: string };
  url: string;
  status: "active" | "inactive";
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: string;
}

export interface CommissionHistory {
  id: string;
  affiliateId: string;
  orderId: string;
  amount: number;
  type: "percentage" | "fixed" | "tiered";
  status: "pending" | "approved" | "paid";
  createdAt: string;
}

export const affiliateTiers = {
  bronze: { minSales: 0, rate: 5, name: { bn: "ব্রোঞ্জ", en: "Bronze" } },
  silver: { minSales: 10000, rate: 7, name: { bn: "সিলভার", en: "Silver" } },
  gold: { minSales: 50000, rate: 10, name: { bn: "গোল্ড", en: "Gold" } },
  platinum: { minSales: 100000, rate: 12, name: { bn: "প্ল্যাটিনাম", en: "Platinum" } },
};

export const demoAffiliates: Affiliate[] = [
  {
    id: "2",
    name: "করিম হোসেন",
    email: "affiliate@demo.com",
    phone: "01812345678",
    referralCode: "KARIM2024",
    paymentMethod: "bkash",
    paymentDetails: "01812345678",
    status: "active",
    totalClicks: 1250,
    totalSales: 85600,
    totalCommission: 8560,
    pendingCommission: 1500,
    paidCommission: 7060,
    commissionRate: 10,
    tier: "gold",
    joinedAt: "2023-06-15T00:00:00Z",
  },
  {
    id: "aff-2",
    name: "সালমা বেগম",
    email: "salma@example.com",
    phone: "01723456789",
    referralCode: "SALMA2024",
    paymentMethod: "nagad",
    paymentDetails: "01723456789",
    status: "active",
    totalClicks: 890,
    totalSales: 45200,
    totalCommission: 3164,
    pendingCommission: 800,
    paidCommission: 2364,
    commissionRate: 7,
    tier: "silver",
    joinedAt: "2023-09-20T00:00:00Z",
  },
  {
    id: "aff-3",
    name: "রফিক আহমেদ",
    email: "rafiq@example.com",
    phone: "01634567890",
    referralCode: "RAFIQ2024",
    paymentMethod: "bank",
    paymentDetails: "Dutch Bangla Bank - 1234567890",
    status: "pending",
    totalClicks: 120,
    totalSales: 5800,
    totalCommission: 290,
    pendingCommission: 290,
    paidCommission: 0,
    commissionRate: 5,
    tier: "bronze",
    joinedAt: "2024-01-10T00:00:00Z",
  },
];

export const demoCampaigns: Campaign[] = [
  {
    id: "camp-1",
    affiliateId: "2",
    name: { bn: "ইলেকট্রনিক্স প্রোমো", en: "Electronics Promo" },
    url: "https://banglashop.com/?ref=KARIM2024&utm_source=facebook",
    status: "active",
    clicks: 450,
    conversions: 23,
    earnings: 3450,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "camp-2",
    affiliateId: "2",
    name: { bn: "ফ্যাশন ক্যাম্পেইন", en: "Fashion Campaign" },
    url: "https://banglashop.com/?ref=KARIM2024&utm_source=youtube",
    status: "active",
    clicks: 320,
    conversions: 18,
    earnings: 2160,
    createdAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "camp-3",
    affiliateId: "2",
    name: { bn: "শীতকালীন সেল", en: "Winter Sale" },
    url: "https://banglashop.com/?ref=KARIM2024&utm_source=instagram",
    status: "inactive",
    clicks: 180,
    conversions: 8,
    earnings: 960,
    createdAt: "2023-12-15T00:00:00Z",
  },
];

export const demoCommissionHistory: CommissionHistory[] = [
  {
    id: "comm-1",
    affiliateId: "2",
    orderId: "ORD-001",
    amount: 430,
    type: "percentage",
    status: "paid",
    createdAt: "2024-01-18T00:00:00Z",
  },
  {
    id: "comm-2",
    affiliateId: "2",
    orderId: "ORD-003",
    amount: 460,
    type: "percentage",
    status: "pending",
    createdAt: "2024-01-25T00:00:00Z",
  },
  {
    id: "comm-3",
    affiliateId: "2",
    orderId: "ORD-005",
    amount: 300,
    type: "fixed",
    status: "approved",
    createdAt: "2024-01-20T00:00:00Z",
  },
];