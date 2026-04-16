import { Router } from "express";
import { db, heroBannersTable, couponsTable, siteSettingsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { CreateBannerBody, UpdateBannerBody, CreateCouponBody, ValidateCouponBody } from "@workspace/api-zod";

const router = Router();

// Banners
router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await db.select().from(heroBannersTable).where(eq(heroBannersTable.isActive, true)).orderBy(asc(heroBannersTable.orderIndex));
  res.json(banners.map(b => ({
    id: b.id, imageUrl: b.imageUrl, titleBn: b.titleBn, titleEn: b.titleEn,
    subtitleBn: b.subtitleBn, subtitleEn: b.subtitleEn, link: b.link,
    orderIndex: b.orderIndex ?? 0, isActive: b.isActive ?? true,
    createdAt: b.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

router.post("/banners", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [banner] = await db.insert(heroBannersTable).values(parsed.data).returning();
  res.status(201).json({
    id: banner.id, imageUrl: banner.imageUrl, titleBn: banner.titleBn, titleEn: banner.titleEn,
    subtitleBn: banner.subtitleBn, subtitleEn: banner.subtitleEn, link: banner.link,
    orderIndex: banner.orderIndex ?? 0, isActive: banner.isActive ?? true,
    createdAt: banner.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.put("/banners/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBannerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [banner] = await db.update(heroBannersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(heroBannersTable.id, id)).returning();
  if (!banner) { res.status(404).json({ error: "Banner not found" }); return; }
  res.json({
    id: banner.id, imageUrl: banner.imageUrl, titleBn: banner.titleBn, titleEn: banner.titleEn,
    subtitleBn: banner.subtitleBn, subtitleEn: banner.subtitleEn, link: banner.link,
    orderIndex: banner.orderIndex ?? 0, isActive: banner.isActive ?? true,
    createdAt: banner.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.delete("/banners/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(heroBannersTable).where(eq(heroBannersTable.id, id));
  res.json({ success: true });
});

// Coupons
router.post("/coupons/validate", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { code, orderAmount } = parsed.data;
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code));
  if (!coupon || !coupon.isActive) { res.status(400).json({ error: "Invalid coupon code" }); return; }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) { res.status(400).json({ error: "Coupon expired" }); return; }
  if (coupon.maxUses && (coupon.usedCount ?? 0) >= coupon.maxUses) { res.status(400).json({ error: "Coupon usage limit reached" }); return; }
  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
    res.status(400).json({ error: `Minimum order amount is ${coupon.minOrderAmount} BDT` }); return;
  }
  res.json({
    id: coupon.id, code: coupon.code, type: coupon.type, value: Number(coupon.value),
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    maxUses: coupon.maxUses, usedCount: coupon.usedCount ?? 0, isActive: coupon.isActive ?? true,
    expiresAt: coupon.expiresAt?.toISOString() ?? null, createdAt: coupon.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.get("/coupons", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const coupons = await db.select().from(couponsTable);
  res.json(coupons.map(c => ({
    id: c.id, code: c.code, type: c.type, value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxUses: c.maxUses, usedCount: c.usedCount ?? 0, isActive: c.isActive ?? true,
    expiresAt: c.expiresAt?.toISOString() ?? null, createdAt: c.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

router.post("/coupons", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [coupon] = await db.insert(couponsTable).values({
    code: parsed.data.code, type: parsed.data.type, value: String(parsed.data.value),
    minOrderAmount: parsed.data.minOrderAmount ? String(parsed.data.minOrderAmount) : null,
    maxUses: parsed.data.maxUses, isActive: parsed.data.isActive ?? true,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
  }).returning();
  res.status(201).json({
    id: coupon.id, code: coupon.code, type: coupon.type, value: Number(coupon.value),
    minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    maxUses: coupon.maxUses, usedCount: coupon.usedCount ?? 0, isActive: coupon.isActive ?? true,
    expiresAt: coupon.expiresAt?.toISOString() ?? null, createdAt: coupon.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

// Site Settings
router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, any> = {};
  for (const s of settings) {
    try { result[s.settingKey] = JSON.parse(s.settingValue); } catch { result[s.settingKey] = s.settingValue; }
  }
  res.json(result);
});

router.put("/settings", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const data = req.body;
  for (const [key, value] of Object.entries(data)) {
    const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.settingKey, key));
    if (existing) {
      await db.update(siteSettingsTable).set({ settingValue: JSON.stringify(value), updatedAt: new Date() }).where(eq(siteSettingsTable.settingKey, key));
    } else {
      await db.insert(siteSettingsTable).values({ settingKey: key, settingValue: JSON.stringify(value) });
    }
  }
  res.json({ success: true });
});

export default router;
