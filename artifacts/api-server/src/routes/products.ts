import { Router } from "express";
import { db, productsTable, categoriesTable, brandsTable, productVariantsTable, productReviewsTable, wishlistTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { CreateProductBody, ListProductsQueryParams, GetProductParams, CreateProductReviewBody } from "@workspace/api-zod";

const router = Router();

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, limit = 20, categoryId, brandId, search, featured, minPrice, maxPrice, sortBy } = params.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [eq(productsTable.isActive, true), eq(productsTable.visibleOnWebsite, true)];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (brandId) conditions.push(eq(productsTable.brandId, brandId));
  if (search) conditions.push(ilike(productsTable.nameEn, `%${search}%`));
  if (featured) conditions.push(eq(productsTable.isFeatured, true));
  if (minPrice !== undefined) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(productsTable.price, String(maxPrice)));

  let orderBy;
  switch (sortBy) {
    case "price_asc": orderBy = asc(productsTable.price); break;
    case "price_desc": orderBy = desc(productsTable.price); break;
    case "popular": orderBy = desc(productsTable.reviewsCount); break;
    default: orderBy = desc(productsTable.createdAt);
  }

  const [totalResult] = await db.select({ count: count() }).from(productsTable).where(and(...conditions));
  const total = Number(totalResult.count);

  const products = await db.select().from(productsTable).where(and(...conditions)).orderBy(orderBy).limit(limit).offset(offset);

  const mapped = products.map(p => ({
    id: p.id, nameBn: p.nameBn, nameEn: p.nameEn, price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    imageUrl: p.imageUrl, galleryImages: p.galleryImages as string[] ?? [],
    categoryId: p.categoryId, brandId: p.brandId, brand: p.brand, stock: p.stock ?? 0,
    rating: Number(p.rating ?? 0), reviewsCount: p.reviewsCount ?? 0,
    isFeatured: p.isFeatured ?? false, discountPercent: Number(p.discountPercent ?? 0),
    hasVariants: p.hasVariants ?? false, isActive: p.isActive ?? true, sku: p.sku,
    productStatus: p.productStatus, costPrice: p.costPrice ? Number(p.costPrice) : null,
    isAffiliate: p.isAffiliate ?? false, descriptionBn: p.descriptionBn, descriptionEn: p.descriptionEn,
    createdAt: p.createdAt?.toISOString() ?? new Date().toISOString()
  }));

  res.json({ products: mapped, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const [category] = product.categoryId ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId)) : [null];
  const [brandDetail] = product.brandId ? await db.select().from(brandsTable).where(eq(brandsTable.id, product.brandId)) : [null];
  const variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, id));
  const reviews = await db.select().from(productReviewsTable).where(and(eq(productReviewsTable.productId, id), eq(productReviewsTable.isApproved, true)));

  res.json({
    id: product.id, nameBn: product.nameBn, nameEn: product.nameEn,
    descriptionBn: product.descriptionBn, descriptionEn: product.descriptionEn,
    price: Number(product.price), originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    imageUrl: product.imageUrl, galleryImages: product.galleryImages as string[] ?? [],
    categoryId: product.categoryId, brandId: product.brandId, brand: product.brand,
    stock: product.stock ?? 0, rating: Number(product.rating ?? 0), reviewsCount: product.reviewsCount ?? 0,
    isFeatured: product.isFeatured ?? false, discountPercent: Number(product.discountPercent ?? 0),
    hasVariants: product.hasVariants ?? false, isActive: product.isActive ?? true, sku: product.sku,
    productStatus: product.productStatus, costPrice: product.costPrice ? Number(product.costPrice) : null,
    isAffiliate: product.isAffiliate ?? false, createdAt: product.createdAt?.toISOString() ?? new Date().toISOString(),
    category: category ? { id: category.id, nameBn: category.nameBn, nameEn: category.nameEn, slug: category.slug, icon: category.icon, sortOrder: category.sortOrder ?? 0, isActive: category.isActive ?? true, productCount: 0, parentId: category.parentId } : null,
    brandDetail: brandDetail ? { id: brandDetail.id, nameBn: brandDetail.nameBn, nameEn: brandDetail.nameEn, slug: brandDetail.slug, logoUrl: brandDetail.logoUrl, isActive: brandDetail.isActive ?? true, productCount: 0 } : null,
    variants: variants.map(v => ({
      id: v.id, productId: v.productId, nameEn: v.nameEn, nameBn: v.nameBn, sku: v.sku,
      price: v.price ? Number(v.price) : null, stock: v.stock ?? 0, attributes: v.attributes ?? {},
      imageUrl: v.imageUrl, isActive: v.isActive ?? true
    })),
    reviews: reviews.map(r => ({
      id: r.id, productId: r.productId, userId: r.userId, orderId: r.orderId,
      rating: r.rating, comment: r.comment, isApproved: r.isApproved ?? false,
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString()
    }))
  });
});

router.post("/products", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const [product] = await db.insert(productsTable).values({
    nameBn: data.nameBn, nameEn: data.nameEn,
    descriptionBn: data.descriptionBn, descriptionEn: data.descriptionEn,
    price: String(data.price), originalPrice: data.originalPrice ? String(data.originalPrice) : null,
    imageUrl: data.imageUrl, galleryImages: data.galleryImages ?? [],
    categoryId: data.categoryId, brandId: data.brandId,
    stock: data.stock ?? 0, isFeatured: data.isFeatured ?? false, sku: data.sku,
    costPrice: data.costPrice ? String(data.costPrice) : null,
    isAffiliate: data.isAffiliate ?? false,
    affiliateCommissionType: data.affiliateCommissionType,
    affiliateCommissionValue: data.affiliateCommissionValue ? String(data.affiliateCommissionValue) : null,
    hasVariants: data.hasVariants ?? false,
    productStatus: data.productStatus ?? "active"
  }).returning();

  res.status(201).json({
    id: product.id, nameBn: product.nameBn, nameEn: product.nameEn, price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    imageUrl: product.imageUrl, galleryImages: product.galleryImages as string[] ?? [],
    categoryId: product.categoryId, brandId: product.brandId, brand: product.brand,
    stock: product.stock ?? 0, rating: Number(product.rating ?? 0), reviewsCount: product.reviewsCount ?? 0,
    isFeatured: product.isFeatured ?? false, discountPercent: Number(product.discountPercent ?? 0),
    hasVariants: product.hasVariants ?? false, isActive: product.isActive ?? true, sku: product.sku,
    productStatus: product.productStatus, costPrice: product.costPrice ? Number(product.costPrice) : null,
    isAffiliate: product.isAffiliate ?? false, descriptionBn: product.descriptionBn, descriptionEn: product.descriptionEn,
    createdAt: product.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const [product] = await db.update(productsTable).set({
    nameBn: data.nameBn, nameEn: data.nameEn,
    descriptionBn: data.descriptionBn, descriptionEn: data.descriptionEn,
    price: String(data.price), originalPrice: data.originalPrice ? String(data.originalPrice) : null,
    imageUrl: data.imageUrl, galleryImages: data.galleryImages ?? [],
    categoryId: data.categoryId, brandId: data.brandId,
    stock: data.stock ?? 0, isFeatured: data.isFeatured ?? false, sku: data.sku,
    costPrice: data.costPrice ? String(data.costPrice) : null,
    isAffiliate: data.isAffiliate ?? false, hasVariants: data.hasVariants ?? false,
    productStatus: data.productStatus ?? "active", updatedAt: new Date()
  }).where(eq(productsTable.id, id)).returning();

  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  res.json({
    id: product.id, nameBn: product.nameBn, nameEn: product.nameEn, price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    imageUrl: product.imageUrl, galleryImages: product.galleryImages as string[] ?? [],
    categoryId: product.categoryId, brandId: product.brandId, brand: product.brand,
    stock: product.stock ?? 0, rating: Number(product.rating ?? 0), reviewsCount: product.reviewsCount ?? 0,
    isFeatured: product.isFeatured ?? false, discountPercent: Number(product.discountPercent ?? 0),
    hasVariants: product.hasVariants ?? false, isActive: product.isActive ?? true, sku: product.sku,
    productStatus: product.productStatus, costPrice: product.costPrice ? Number(product.costPrice) : null,
    isAffiliate: product.isAffiliate ?? false, descriptionBn: product.descriptionBn, descriptionEn: product.descriptionEn,
    createdAt: product.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(productsTable).set({ isActive: false }).where(eq(productsTable.id, id));
  res.json({ success: true });
});

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const reviews = await db.select().from(productReviewsTable).where(and(eq(productReviewsTable.productId, id), eq(productReviewsTable.isApproved, true)));
  res.json(reviews.map(r => ({
    id: r.id, productId: r.productId, userId: r.userId, orderId: r.orderId,
    rating: r.rating, comment: r.comment, isApproved: r.isApproved ?? false,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

router.post("/products/:id/reviews", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = CreateProductReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Check for duplicate review
  const existing = await db.select({ id: productReviewsTable.id })
    .from(productReviewsTable)
    .where(and(eq(productReviewsTable.productId, id), eq(productReviewsTable.userId, user.id)));
  if (existing.length > 0) {
    res.status(409).json({ error: "already_reviewed" });
    return;
  }

  const [review] = await db.insert(productReviewsTable).values({
    productId: id, userId: user.id, rating: parsed.data.rating,
    comment: parsed.data.comment, orderId: parsed.data.orderId ?? null
  }).returning();

  // Recalculate product rating + review count from approved reviews
  const allReviews = await db.select({ rating: productReviewsTable.rating })
    .from(productReviewsTable)
    .where(and(eq(productReviewsTable.productId, id), eq(productReviewsTable.isApproved, true)));
  const reviewCount = allReviews.length;
  const avgRating = reviewCount > 0
    ? Number((allReviews.reduce((s, r) => s + Number(r.rating), 0) / reviewCount).toFixed(1))
    : 0;
  await db.update(productsTable)
    .set({ rating: String(avgRating), reviewsCount: reviewCount })
    .where(eq(productsTable.id, id));

  res.status(201).json({
    id: review.id, productId: review.productId, userId: review.userId, orderId: review.orderId,
    rating: review.rating, comment: review.comment, isApproved: review.isApproved ?? false,
    createdAt: review.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

// Wishlist routes
router.get("/me/wishlist", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const items = await db.select({ wl: wishlistTable, product: productsTable })
    .from(wishlistTable)
    .leftJoin(productsTable, eq(wishlistTable.productId, productsTable.id))
    .where(eq(wishlistTable.userId, user.id));
  res.json(items.map(item => ({
    id: item.wl.id, userId: item.wl.userId, productId: item.wl.productId,
    createdAt: item.wl.createdAt?.toISOString() ?? new Date().toISOString(),
    product: item.product ? {
      id: item.product.id, nameBn: item.product.nameBn, nameEn: item.product.nameEn,
      price: Number(item.product.price), originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
      imageUrl: item.product.imageUrl, galleryImages: item.product.galleryImages as string[] ?? [],
      categoryId: item.product.categoryId, brandId: item.product.brandId, brand: item.product.brand,
      stock: item.product.stock ?? 0, rating: Number(item.product.rating ?? 0), reviewsCount: item.product.reviewsCount ?? 0,
      isFeatured: item.product.isFeatured ?? false, discountPercent: Number(item.product.discountPercent ?? 0),
      hasVariants: item.product.hasVariants ?? false, isActive: item.product.isActive ?? true, sku: item.product.sku,
      productStatus: item.product.productStatus, costPrice: item.product.costPrice ? Number(item.product.costPrice) : null,
      isAffiliate: item.product.isAffiliate ?? false, descriptionBn: item.product.descriptionBn, descriptionEn: item.product.descriptionEn,
      createdAt: item.product.createdAt?.toISOString() ?? new Date().toISOString()
    } : null
  })));
});

router.post("/me/wishlist", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const { productId } = req.body;
  if (!productId) { res.status(400).json({ error: "productId required" }); return; }
  const [item] = await db.insert(wishlistTable).values({ userId: user.id, productId }).returning();
  res.status(201).json({ id: item.id, userId: item.userId, productId: item.productId, createdAt: item.createdAt?.toISOString() ?? new Date().toISOString() });
});

router.delete("/me/wishlist/:productId", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, user.id), eq(wishlistTable.productId, productId)));
  res.json({ success: true });
});

export default router;
