import { Router } from "express";
import { db, ordersTable, orderItemsTable, productsTable, profilesTable, loyaltyTransactionsTable, affiliatesTable, commissionsTable, couponsTable } from "@workspace/db";
import { eq, and, desc, count, ilike } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { CreateOrderBody, ListOrdersQueryParams, UpdateOrderStatusBody } from "@workspace/api-zod";

const router = Router();

function mapOrder(o: any) {
  return {
    id: o.id, orderNumber: o.orderNumber, userId: o.userId,
    customerName: o.customerName, customerPhone: o.customerPhone, customerEmail: o.customerEmail,
    shippingAddress: o.shippingAddress, city: o.city, district: o.district,
    subtotal: Number(o.subtotal), deliveryCharge: Number(o.deliveryCharge ?? 0),
    discountAmount: Number(o.discountAmount ?? 0), total: Number(o.total),
    status: o.status, paymentMethod: o.paymentMethod, deliveryType: o.deliveryType,
    couponCode: o.couponCode, trackingNumber: o.trackingNumber, courier: o.courier,
    affiliateReferralCode: o.affiliateReferralCode,
    pointsEarned: o.pointsEarned ?? 0, pointsRedeemed: o.pointsRedeemed ?? 0,
    pointsDiscountAmount: Number(o.pointsDiscountAmount ?? 0),
    notes: o.notes, createdAt: o.createdAt?.toISOString() ?? new Date().toISOString()
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const isAdmin = user.roles.includes("admin");
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { page = 1, limit = 20, status } = params.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (!isAdmin) conditions.push(eq(ordersTable.userId, user.id));
  if (status) conditions.push(eq(ordersTable.status, status));

  const [totalResult] = await db.select({ count: count() }).from(ordersTable).where(conditions.length ? and(...conditions) : undefined);
  const total = Number(totalResult.count);
  const orders = await db.select().from(ordersTable).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset);

  res.json({ orders: orders.map(mapOrder), total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const token = req.cookies?.["session"] || req.headers.authorization?.replace("Bearer ", "");
  let userId: string | null = null;
  if (token) {
    try {
      const { getSessionUser } = await import("../lib/auth");
      const user = await getSessionUser(token);
      userId = user?.id ?? null;
    } catch { /* guest order */ }
  }

  const data = parsed.data;
  const deliveryCharge = data.deliveryType === "inside_city" ? 60 : 120;
  
  // Validate items and calculate subtotal
  let subtotal = 0;
  const itemsData: any[] = [];
  for (const item of data.items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) { res.status(400).json({ error: `Product ${item.productId} not found` }); return; }
    const unitPrice = Number(product.price);
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    itemsData.push({ product, item, unitPrice, totalPrice });
  }

  // Coupon discount
  let discountAmount = 0;
  if (data.couponCode) {
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, data.couponCode));
    if (coupon && coupon.isActive) {
      if (coupon.type === "percentage") discountAmount = subtotal * Number(coupon.value) / 100;
      else discountAmount = Number(coupon.value);
      await db.update(couponsTable).set({ usedCount: (coupon.usedCount ?? 0) + 1 }).where(eq(couponsTable.id, coupon.id));
    }
  }

  // Points discount
  let pointsDiscountAmount = 0;
  let pointsRedeemed = 0;
  if (data.pointsToRedeem && userId) {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
    const availablePoints = parseInt(profile?.loyaltyPoints ?? "0");
    pointsRedeemed = Math.min(data.pointsToRedeem, availablePoints);
    pointsDiscountAmount = pointsRedeemed * 0.25; // 0.25 BDT per point
  }

  const total = Math.max(0, subtotal + deliveryCharge - discountAmount - pointsDiscountAmount);
  const orderNumber = `RM${Date.now().toString().slice(-8)}`;
  const pointsEarned = Math.floor(total / 10); // 1 point per 10 BDT

  // Find affiliate
  let affiliateId: string | null = null;
  if (data.affiliateReferralCode) {
    const [aff] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.referralCode, data.affiliateReferralCode));
    if (aff) affiliateId = aff.id;
  }

  const [order] = await db.insert(ordersTable).values({
    orderNumber, userId, customerName: data.customerName, customerPhone: data.customerPhone,
    customerEmail: data.customerEmail, shippingAddress: data.shippingAddress,
    city: data.city, district: data.district,
    subtotal: String(subtotal), deliveryCharge: String(deliveryCharge),
    discountAmount: String(discountAmount), total: String(total),
    status: "pending", paymentMethod: data.paymentMethod, deliveryType: data.deliveryType,
    couponCode: data.couponCode, affiliateReferralCode: data.affiliateReferralCode,
    affiliateId, notes: data.notes,
    pointsEarned, pointsRedeemed, pointsDiscountAmount: String(pointsDiscountAmount)
  }).returning();

  for (const { product, item, unitPrice, totalPrice } of itemsData) {
    await db.insert(orderItemsTable).values({
      orderId: order.id, productId: item.productId, variantId: item.variantId,
      productNameBn: product.nameBn, productNameEn: product.nameEn,
      quantity: item.quantity, unitPrice: String(unitPrice), totalPrice: String(totalPrice)
    });
  }

  // Update loyalty points
  if (userId) {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
    if (profile) {
      let currentPoints = parseInt(profile.loyaltyPoints ?? "0");
      currentPoints = currentPoints - pointsRedeemed + pointsEarned;
      await db.update(profilesTable).set({ loyaltyPoints: String(currentPoints) }).where(eq(profilesTable.userId, userId));
    }
    if (pointsEarned > 0) {
      await db.insert(loyaltyTransactionsTable).values({
        userId, orderId: order.id, points: pointsEarned, type: "earn",
        amount: String(total),
        descriptionBn: `অর্ডার #${orderNumber} থেকে পয়েন্ট অর্জন`,
        descriptionEn: `Points earned from order #${orderNumber}`
      });
    }
  }

  // Handle affiliate commission
  if (affiliateId) {
    const [aff] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.id, affiliateId));
    if (aff) {
      const commissionAmount = total * Number(aff.commissionRate) / 100;
      await db.insert(commissionsTable).values({
        affiliateId, orderId: order.id, amount: String(commissionAmount),
        commissionType: "percentage", status: "pending"
      });
    }
  }

  res.status(201).json(mapOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (!user.roles.includes("admin") && order.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json({
    ...mapOrder(order),
    items: items.map(i => ({
      id: i.id, orderId: i.orderId, productId: i.productId, variantId: i.variantId,
      productNameBn: i.productNameBn, productNameEn: i.productNameEn,
      quantity: i.quantity, unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice),
      variantAttributes: i.variantAttributes
    }))
  });
});

router.put("/orders/:id/status", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { status, trackingNumber, courier, notes } = parsed.data;
  const [order] = await db.update(ordersTable).set({
    status, trackingNumber: trackingNumber ?? undefined, courier: courier ?? undefined,
    notes: notes ?? undefined, updatedAt: new Date()
  }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  // Auto-approve commissions for delivered orders
  if (status === "delivered" && order.affiliateId) {
    await db.update(commissionsTable).set({ status: "approved" })
      .where(and(eq(commissionsTable.orderId, id), eq(commissionsTable.status, "pending")));
  }

  res.json(mapOrder(order));
});

router.get("/me/orders", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.id)).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(mapOrder));
});

router.get("/me/profile", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const profile = user.profile;
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json({
    id: profile.id, userId: profile.userId, name: profile.name, email: profile.email,
    phone: profile.phone, avatarUrl: profile.avatarUrl, address: profile.address,
    city: profile.city, district: profile.district, loyaltyPoints: parseInt(profile.loyaltyPoints ?? "0"),
    isBlocked: profile.isBlocked ?? false, dateOfBirth: profile.dateOfBirth,
    occupation: profile.occupation, nid: profile.nid, paymentMethod: profile.paymentMethod,
    paymentNumber: profile.paymentNumber, createdAt: profile.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.put("/me/profile", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const data = req.body;
  const [profile] = await db.update(profilesTable).set({
    name: data.name, phone: data.phone, address: data.address, city: data.city,
    district: data.district, avatarUrl: data.avatarUrl, dateOfBirth: data.dateOfBirth,
    occupation: data.occupation, nid: data.nid, paymentMethod: data.paymentMethod,
    paymentNumber: data.paymentNumber, updatedAt: new Date()
  }).where(eq(profilesTable.userId, user.id)).returning();
  res.json({
    id: profile.id, userId: profile.userId, name: profile.name, email: profile.email,
    phone: profile.phone, avatarUrl: profile.avatarUrl, address: profile.address,
    city: profile.city, district: profile.district, loyaltyPoints: parseInt(profile.loyaltyPoints ?? "0"),
    isBlocked: profile.isBlocked ?? false, dateOfBirth: profile.dateOfBirth,
    occupation: profile.occupation, nid: profile.nid, paymentMethod: profile.paymentMethod,
    paymentNumber: profile.paymentNumber, createdAt: profile.createdAt?.toISOString() ?? new Date().toISOString()
  });
});

router.get("/me/loyalty", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const txns = await db.select().from(loyaltyTransactionsTable).where(eq(loyaltyTransactionsTable.userId, user.id)).orderBy(desc(loyaltyTransactionsTable.createdAt));
  res.json(txns.map(t => ({
    id: t.id, userId: t.userId, orderId: t.orderId, points: t.points, type: t.type,
    amount: Number(t.amount ?? 0), descriptionBn: t.descriptionBn, descriptionEn: t.descriptionEn,
    expiresAt: t.expiresAt?.toISOString() ?? null, createdAt: t.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

export default router;
