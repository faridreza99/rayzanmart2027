import { Router } from "express";
import { db, usersTable, profilesTable, ordersTable, productsTable, affiliatesTable, withdrawalsTable, commissionsTable, orderItemsTable } from "@workspace/db";
import { eq, desc, count, sql, gte, lte, and, ilike } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { ListUsersQueryParams, UpdateAffiliateStatusBody, UpdateWithdrawalStatusBody, GetProfitLossQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
  const [totalProducts] = await db.select({ count: count() }).from(productsTable);
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalAffiliates] = await db.select({ count: count() }).from(affiliatesTable);
  const [pendingOrders] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "pending"));
  const [pendingWithdrawals] = await db.select({ count: count() }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "pending"));
  const [todayOrders] = await db.select({ count: count() }).from(ordersTable).where(gte(ordersTable.createdAt, today));
  
  const revenueResult = await db.select({ total: sql<number>`SUM(total::numeric)` }).from(ordersTable);
  const todayRevenueResult = await db.select({ total: sql<number>`SUM(total::numeric)` }).from(ordersTable).where(gte(ordersTable.createdAt, today));

  const recentOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);
  
  const ordersByStatus = await db.select({ status: ordersTable.status, count: count() }).from(ordersTable).groupBy(ordersTable.status);
  
  const topProducts = await db.select({
    productId: orderItemsTable.productId,
    totalSold: sql<number>`SUM(${orderItemsTable.quantity})`,
    revenue: sql<number>`SUM(${orderItemsTable.totalPrice}::numeric)`,
    product: productsTable
  }).from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .groupBy(orderItemsTable.productId, productsTable.id)
    .orderBy(sql`SUM(${orderItemsTable.quantity}) DESC`)
    .limit(5);

  res.json({
    totalOrders: Number(totalOrders.count),
    totalRevenue: Number(revenueResult[0]?.total ?? 0),
    totalProducts: Number(totalProducts.count),
    totalUsers: Number(totalUsers.count),
    totalAffiliates: Number(totalAffiliates.count),
    pendingOrders: Number(pendingOrders.count),
    pendingWithdrawals: Number(pendingWithdrawals.count),
    todayOrders: Number(todayOrders.count),
    todayRevenue: Number(todayRevenueResult[0]?.total ?? 0),
    recentOrders: recentOrders.map(o => ({
      id: o.id, orderNumber: o.orderNumber, userId: o.userId, customerName: o.customerName,
      customerPhone: o.customerPhone, customerEmail: o.customerEmail, shippingAddress: o.shippingAddress,
      city: o.city, district: o.district, subtotal: Number(o.subtotal), deliveryCharge: Number(o.deliveryCharge ?? 0),
      discountAmount: Number(o.discountAmount ?? 0), total: Number(o.total), status: o.status,
      paymentMethod: o.paymentMethod, deliveryType: o.deliveryType, couponCode: o.couponCode,
      trackingNumber: o.trackingNumber, courier: o.courier, affiliateReferralCode: o.affiliateReferralCode,
      pointsEarned: o.pointsEarned ?? 0, pointsRedeemed: o.pointsRedeemed ?? 0,
      pointsDiscountAmount: Number(o.pointsDiscountAmount ?? 0), notes: o.notes,
      createdAt: o.createdAt?.toISOString() ?? new Date().toISOString()
    })),
    ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: Number(s.count) })),
    topProducts: topProducts.map(p => ({
      id: p.product?.id ?? "", nameEn: p.product?.nameEn ?? "", nameBn: p.product?.nameBn ?? "",
      totalSold: Number(p.totalSold ?? 0), revenue: Number(p.revenue ?? 0)
    }))
  });
});

router.get("/admin/users", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { page = 1, limit = 20, search } = params.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) conditions.push(ilike(profilesTable.name, `%${search}%`));

  const query = db.select({ user: usersTable, profile: profilesTable })
    .from(usersTable)
    .leftJoin(profilesTable, eq(profilesTable.userId, usersTable.id));
  
  const [totalResult] = await db.select({ count: count() }).from(usersTable);
  const users = await query.orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);

  res.json({
    users: users.map(({ user, profile }) => ({
      id: user.id, email: user.email,
      profile: profile ? {
        id: profile.id, userId: profile.userId, name: profile.name, email: profile.email,
        phone: profile.phone, avatarUrl: profile.avatarUrl, address: profile.address,
        city: profile.city, district: profile.district, loyaltyPoints: parseInt(profile.loyaltyPoints ?? "0"),
        isBlocked: profile.isBlocked ?? false, dateOfBirth: profile.dateOfBirth, occupation: profile.occupation,
        nid: profile.nid, paymentMethod: profile.paymentMethod, paymentNumber: profile.paymentNumber,
        createdAt: profile.createdAt?.toISOString() ?? new Date().toISOString()
      } : null,
      roles: []
    })),
    total: Number(totalResult.count), page, limit, totalPages: Math.ceil(Number(totalResult.count) / limit)
  });
});

router.put("/admin/users/:id/block", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { isBlocked } = req.body;
  if (typeof isBlocked !== "boolean") { res.status(400).json({ error: "isBlocked must be a boolean" }); return; }
  await db.update(profilesTable).set({ isBlocked }).where(eq(profilesTable.userId, id));
  res.json({ success: true });
});

router.get("/admin/affiliates", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const affiliates = await db.select({ aff: affiliatesTable, profile: profilesTable })
    .from(affiliatesTable)
    .leftJoin(profilesTable, eq(profilesTable.userId, affiliatesTable.userId))
    .orderBy(desc(affiliatesTable.createdAt));
  res.json(affiliates.map(({ aff, profile }) => ({
    id: aff.id, userId: aff.userId, referralCode: aff.referralCode, paymentMethod: aff.paymentMethod,
    paymentDetails: aff.paymentDetails, status: aff.status, commissionRate: Number(aff.commissionRate ?? 5),
    tier: aff.tier ?? "bronze", totalClicks: aff.totalClicks ?? 0, totalSales: Number(aff.totalSales ?? 0),
    totalCommission: Number(aff.totalCommission ?? 0), pendingCommission: Number(aff.pendingCommission ?? 0),
    paidCommission: Number(aff.paidCommission ?? 0), availableBalance: Number(aff.availableBalance ?? 0),
    createdAt: aff.createdAt?.toISOString() ?? new Date().toISOString(),
    profile: profile ? {
      id: profile.id, userId: profile.userId, name: profile.name, email: profile.email,
      phone: profile.phone, avatarUrl: profile.avatarUrl, address: profile.address, city: profile.city,
      district: profile.district, loyaltyPoints: parseInt(profile.loyaltyPoints ?? "0"),
      isBlocked: profile.isBlocked ?? false, createdAt: profile.createdAt?.toISOString() ?? new Date().toISOString()
    } : null
  })));
});

router.put("/admin/affiliates/:id/status", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateAffiliateStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  await db.update(affiliatesTable).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(affiliatesTable.id, id));
  res.json({ success: true });
});

router.get("/admin/withdrawals", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const withdrawals = await db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt));
  res.json(withdrawals.map(w => ({
    id: w.id, affiliateId: w.affiliateId, amount: Number(w.amount), method: w.method,
    accountNumber: w.accountNumber, status: w.status, adminNotes: w.adminNotes,
    createdAt: w.createdAt?.toISOString() ?? new Date().toISOString()
  })));
});

router.put("/admin/withdrawals/:id/status", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateWithdrawalStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [withdrawal] = await db.update(withdrawalsTable).set({ status: parsed.data.status, adminNotes: parsed.data.adminNotes, updatedAt: new Date() }).where(eq(withdrawalsTable.id, id)).returning();
  // If approved/completed, credit commission
  if (parsed.data.status === "completed" && withdrawal) {
    const [aff] = await db.select().from(affiliatesTable).where(eq(affiliatesTable.id, withdrawal.affiliateId));
    if (aff) {
      await db.update(affiliatesTable).set({
        paidCommission: String(Number(aff.paidCommission ?? 0) + Number(withdrawal.amount))
      }).where(eq(affiliatesTable.id, aff.id));
    }
  }
  res.json({ success: true });
});

router.get("/admin/profit-loss", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const params = GetProfitLossQueryParams.safeParse(req.query);
  const { startDate, endDate } = params.data ?? {};

  const conditions: any[] = [];
  if (startDate) conditions.push(gte(ordersTable.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(ordersTable.createdAt, new Date(endDate)));

  const rows = await db.execute(sql`
    SELECT 
      DATE(o.created_at) as order_date,
      COALESCE(c.name_en, 'Uncategorized') as category_name,
      SUM(oi.total_price::numeric) as total_sales,
      SUM(COALESCE(p.cost_price::numeric, 0) * oi.quantity) as total_product_cost,
      SUM(o.delivery_charge::numeric) as total_delivery_cost,
      COALESCE(SUM(cm.amount::numeric), 0) as total_commissions,
      SUM(oi.total_price::numeric) - SUM(COALESCE(p.cost_price::numeric, 0) * oi.quantity) - SUM(o.delivery_charge::numeric) - COALESCE(SUM(cm.amount::numeric), 0) as net_profit,
      COUNT(DISTINCT o.id) as order_count
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN commissions cm ON cm.order_id = o.id AND cm.status = 'paid'
    WHERE o.status NOT IN ('cancelled', 'returned')
    GROUP BY DATE(o.created_at), c.name_en
    ORDER BY DATE(o.created_at) DESC
    LIMIT 100
  `);

  res.json((rows.rows as any[]).map(r => ({
    orderDate: r.order_date, categoryName: r.category_name,
    totalSales: Number(r.total_sales ?? 0), totalProductCost: Number(r.total_product_cost ?? 0),
    totalDeliveryCost: Number(r.total_delivery_cost ?? 0), totalCommissions: Number(r.total_commissions ?? 0),
    netProfit: Number(r.net_profit ?? 0), orderCount: Number(r.order_count ?? 0)
  })));
});

export default router;
