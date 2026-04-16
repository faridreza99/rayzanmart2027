import { Router } from "express";
import { db, affiliatesTable, affiliateCampaignsTable, commissionsTable, withdrawalsTable, affiliatePageContentTable, affiliateTestimonialsTable, profilesTable, userRolesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { ApplyAffiliateBody, CreateAffiliateCampaignBody, RequestWithdrawalBody } from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/\s/g, "").slice(0, 6).padEnd(6, "X");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${suffix}`;
}

function mapAffiliate(a: any) {
  return {
    id: a.id, userId: a.userId, referralCode: a.referralCode, paymentMethod: a.paymentMethod,
    paymentDetails: a.paymentDetails, status: a.status, commissionRate: Number(a.commissionRate ?? 5),
    tier: a.tier ?? "bronze", totalClicks: a.totalClicks ?? 0, totalSales: Number(a.totalSales ?? 0),
    totalCommission: Number(a.totalCommission ?? 0), pendingCommission: Number(a.pendingCommission ?? 0),
    paidCommission: Number(a.paidCommission ?? 0), availableBalance: Number(a.availableBalance ?? 0),
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString()
  };
}

router.post("/affiliates/apply", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const [existing] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.userId, user.id));
  if (existing) { res.status(400).json({ error: "Already applied" }); return; }

  const parsed = ApplyAffiliateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const name = user.profile?.name ?? user.email;
  const referralCode = generateReferralCode(name);

  const [affiliate] = await db.insert(affiliatesTable).values({
    userId: user.id, referralCode, paymentMethod: parsed.data.paymentMethod,
    paymentDetails: parsed.data.paymentDetails, websiteUrl: parsed.data.websiteUrl,
    marketingPlan: parsed.data.marketingPlan, status: "pending"
  }).returning();

  // Add affiliate role
  await db.insert(userRolesTable).values({ userId: user.id, role: "affiliate" }).onConflictDoNothing();

  res.status(201).json(mapAffiliate(affiliate));
});

router.get("/affiliates/me", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [affiliate] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.userId, user.id));
  if (!affiliate) { res.status(404).json({ error: "Not an affiliate" }); return; }
  res.json(mapAffiliate(affiliate));
});

router.get("/affiliates/me/campaigns", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [affiliate] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.userId, user.id));
  if (!affiliate) { res.status(404).json({ error: "Not an affiliate" }); return; }
  const campaigns = await db.select().from(affiliateCampaignsTable).where(eq(affiliateCampaignsTable.affiliateId, affiliate.id));
  res.json(campaigns.map(c => ({
    id: c.id, affiliateId: c.affiliateId, nameBn: c.nameBn, nameEn: c.nameEn, url: c.url,
    status: c.status, clicks: c.clicks ?? 0, conversions: c.conversions ?? 0, earnings: Number(c.earnings ?? 0),
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

router.post("/affiliates/me/campaigns", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [affiliate] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.userId, user.id));
  if (!affiliate) { res.status(404).json({ error: "Not an affiliate" }); return; }
  const parsed = CreateAffiliateCampaignBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [campaign] = await db.insert(affiliateCampaignsTable).values({ affiliateId: affiliate.id, ...parsed.data }).returning();
  res.status(201).json({
    id: campaign.id, affiliateId: campaign.affiliateId, nameBn: campaign.nameBn, nameEn: campaign.nameEn, url: campaign.url,
    status: campaign.status, clicks: campaign.clicks ?? 0, conversions: campaign.conversions ?? 0, earnings: Number(campaign.earnings ?? 0),
    createdAt: campaign.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.get("/affiliates/me/commissions", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [affiliate] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.userId, user.id));
  if (!affiliate) { res.status(404).json({ error: "Not an affiliate" }); return; }
  const commissions = await db.select().from(commissionsTable).where(eq(commissionsTable.affiliateId, affiliate.id)).orderBy(desc(commissionsTable.createdAt));
  res.json(commissions.map(c => ({
    id: c.id, affiliateId: c.affiliateId, orderId: c.orderId, amount: Number(c.amount), commissionType: c.commissionType,
    status: c.status, productNameBn: c.productNameBn, productNameEn: c.productNameEn, productPrice: c.productPrice ? Number(c.productPrice) : null,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

router.get("/affiliates/me/withdrawals", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [affiliate] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.userId, user.id));
  if (!affiliate) { res.status(404).json({ error: "Not an affiliate" }); return; }
  const withdrawals = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.affiliateId, affiliate.id)).orderBy(desc(withdrawalsTable.createdAt));
  res.json(withdrawals.map(w => ({
    id: w.id, affiliateId: w.affiliateId, amount: Number(w.amount), method: w.method,
    accountNumber: w.accountNumber, status: w.status, adminNotes: w.adminNotes,
    createdAt: w.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

router.post("/affiliates/me/withdrawals", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [affiliate] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.userId, user.id));
  if (!affiliate) { res.status(404).json({ error: "Not an affiliate" }); return; }

  const parsed = RequestWithdrawalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, method, accountNumber } = parsed.data;
  if (Number(affiliate.availableBalance) < amount) {
    res.status(400).json({ error: "Insufficient balance" }); return;
  }

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    affiliateId: affiliate.id, amount: String(amount), method, accountNumber, status: "pending"
  }).returning();

  // Deduct from available balance
  await db.update(affiliatesTable).set({
    availableBalance: String(Number(affiliate.availableBalance) - amount)
  }).where(eq(affiliatesTable.id, affiliate.id));

  res.status(201).json({
    id: withdrawal.id, affiliateId: withdrawal.affiliateId, amount: Number(withdrawal.amount),
    method: withdrawal.method, accountNumber: withdrawal.accountNumber, status: withdrawal.status,
    adminNotes: withdrawal.adminNotes, createdAt: withdrawal.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.get("/affiliates/leaderboard", async (_req, res): Promise<void> => {
  const affiliates = await db.select({ aff: affiliatesTable, profile: profilesTable })
    .from(affiliatesTable)
    .leftJoin(profilesTable, eq(profilesTable.userId, affiliatesTable.userId))
    .where(eq(affiliatesTable.status, "active"))
    .orderBy(desc(affiliatesTable.totalSales));

  res.json(affiliates.map((item, idx) => ({
    id: item.aff.id, name: item.profile?.name ?? "Unknown", avatarUrl: item.profile?.avatarUrl ?? null,
    referralCode: item.aff.referralCode, tier: item.aff.tier ?? "bronze",
    totalSales: Number(item.aff.totalSales ?? 0), totalCommission: Number(item.aff.totalCommission ?? 0),
    totalClicks: item.aff.totalClicks ?? 0, rank: idx + 1
  })));
});

router.get("/affiliates/page-content", async (_req, res): Promise<void> => {
  const content = await db.select().from(affiliatePageContentTable).where(eq(affiliatePageContentTable.isActive, true));
  res.json(content.map(c => ({
    id: c.id, section: c.section, key: c.key, isActive: c.isActive ?? true,
    value: (() => { try { return JSON.parse(c.value); } catch { return { bn: c.value, en: c.value }; } })()
  })));
});

router.get("/affiliates/testimonials", async (_req, res): Promise<void> => {
  const testimonials = await db.select().from(affiliateTestimonialsTable).where(eq(affiliateTestimonialsTable.isActive, true));
  res.json(testimonials.map(t => ({
    id: t.id, name: t.name, roleBn: t.roleBn, roleEn: t.roleEn, contentBn: t.contentBn, contentEn: t.contentEn,
    avatarUrl: t.avatarUrl, rating: t.rating ?? 5, isActive: t.isActive ?? true
  })));
});

export default router;
