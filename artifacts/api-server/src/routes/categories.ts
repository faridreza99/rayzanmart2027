import { Router } from "express";
import { db, categoriesTable, brandsTable, productsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { CreateCategoryBody, UpdateCategoryBody, CreateBrandBody, UpdateBrandBody } from "@workspace/api-zod";

const router = Router();

// Categories
router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.isActive, true)).orderBy(categoriesTable.sortOrder);
  const productCounts = await db.select({ categoryId: productsTable.categoryId, count: count() }).from(productsTable).groupBy(productsTable.categoryId);
  const countMap = new Map(productCounts.map(r => [r.categoryId, Number(r.count)]));
  res.json(cats.map(c => ({
    id: c.id, nameBn: c.nameBn, nameEn: c.nameEn, parentId: c.parentId, slug: c.slug, icon: c.icon,
    sortOrder: c.sortOrder ?? 0, isActive: c.isActive ?? true, productCount: countMap.get(c.id) ?? 0
  })));
});

router.post("/categories", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json({ id: cat.id, nameBn: cat.nameBn, nameEn: cat.nameEn, parentId: cat.parentId, slug: cat.slug, icon: cat.icon, sortOrder: cat.sortOrder ?? 0, isActive: cat.isActive ?? true, productCount: 0 });
});

router.put("/categories/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [cat] = await db.update(categoriesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
  res.json({ id: cat.id, nameBn: cat.nameBn, nameEn: cat.nameEn, parentId: cat.parentId, slug: cat.slug, icon: cat.icon, sortOrder: cat.sortOrder ?? 0, isActive: cat.isActive ?? true, productCount: 0 });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(categoriesTable).set({ isActive: false }).where(eq(categoriesTable.id, id));
  res.json({ success: true });
});

// Brands
router.get("/brands", async (_req, res): Promise<void> => {
  const brands = await db.select().from(brandsTable).where(eq(brandsTable.isActive, true));
  const productCounts = await db.select({ brandId: productsTable.brandId, count: count() }).from(productsTable).groupBy(productsTable.brandId);
  const countMap = new Map(productCounts.map(r => [r.brandId, Number(r.count)]));
  res.json(brands.map(b => ({
    id: b.id, nameBn: b.nameBn, nameEn: b.nameEn, slug: b.slug, logoUrl: b.logoUrl, isActive: b.isActive ?? true, productCount: countMap.get(b.id) ?? 0
  })));
});

router.post("/brands", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = CreateBrandBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [brand] = await db.insert(brandsTable).values(parsed.data).returning();
  res.status(201).json({ id: brand.id, nameBn: brand.nameBn, nameEn: brand.nameEn, slug: brand.slug, logoUrl: brand.logoUrl, isActive: brand.isActive ?? true, productCount: 0 });
});

router.put("/brands/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBrandBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [brand] = await db.update(brandsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(brandsTable.id, id)).returning();
  if (!brand) { res.status(404).json({ error: "Brand not found" }); return; }
  res.json({ id: brand.id, nameBn: brand.nameBn, nameEn: brand.nameEn, slug: brand.slug, logoUrl: brand.logoUrl, isActive: brand.isActive ?? true, productCount: 0 });
});

router.delete("/brands/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(brandsTable).set({ isActive: false }).where(eq(brandsTable.id, id));
  res.json({ success: true });
});

export default router;
