/**
 * /api/reports — Financial reporting endpoints
 */
import { Router } from "express";
import { query } from "../lib/db-pool.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// All report endpoints require auth
router.use(authMiddleware);

function dateClause(alias: string, start?: string, end?: string): { sql: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (start) { conditions.push(`DATE(${alias}.created_at) >= $${idx++}`); values.push(start); }
  if (end)   { conditions.push(`DATE(${alias}.created_at) <= $${idx++}`); values.push(end); }
  return { sql: conditions.length ? "WHERE " + conditions.join(" AND ") : "", values };
}

// ─── GET /api/reports/summary ────────────────────────────────────────────────
router.get("/summary", async (req, res) => {
  try {
    const { start, end } = req.query as Record<string, string>;
    const { sql: wh, values } = dateClause("o", start, end);

    const r = await query(`
      SELECT
        COALESCE(SUM(oi.total_price), 0)                                         AS total_sales,
        COALESCE(SUM(p.cost_price * oi.quantity), 0)                             AS total_cost,
        COALESCE(SUM(o.delivery_charge), 0)                                      AS total_delivery,
        COUNT(DISTINCT o.id)                                                     AS total_orders,
        COUNT(DISTINCT CASE WHEN o.affiliate_id IS NOT NULL THEN o.id END)       AS affiliate_orders,
        COUNT(DISTINCT CASE WHEN o.affiliate_id IS NULL THEN o.id END)           AS direct_orders,
        COALESCE(SUM(CASE WHEN o.affiliate_id IS NOT NULL THEN oi.total_price ELSE 0 END), 0) AS affiliate_sales,
        COALESCE(SUM(CASE WHEN o.affiliate_id IS NULL THEN oi.total_price ELSE 0 END), 0)     AS direct_sales
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      ${wh}
      AND o.status NOT IN ('cancelled', 'returned')
    `, values);

    const commR = await query(`
      SELECT COALESCE(SUM(c.amount), 0) AS total_commissions
      FROM commissions c
      JOIN orders o ON o.id = c.order_id
      ${wh.replace("WHERE", "WHERE")}
      ${wh ? "AND" : "WHERE"} c.status IN ('pending', 'approved', 'paid')
    `, values);

    const mktConditions: string[] = [];
    const mktValues: any[] = [];
    let mktIdx = 1;
    if (start) { mktConditions.push(`DATE(me.date) >= $${mktIdx++}`); mktValues.push(start); }
    if (end)   { mktConditions.push(`DATE(me.date) <= $${mktIdx++}`); mktValues.push(end); }
    const marketingR = await query(`
      SELECT COALESCE(SUM(me.amount), 0) AS total_marketing
      FROM marketing_expenses me
      ${mktConditions.length ? "WHERE " + mktConditions.join(" AND ") : ""}
    `, mktValues);

    // Status breakdown
    const statusR = await query(`
      SELECT o.status, COUNT(*) AS cnt, COALESCE(SUM(oi.total_price), 0) AS total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      ${wh}
      GROUP BY o.status
    `, values);

    const s = r.rows[0];
    const totalSales    = Number(s.total_sales);
    const totalCost     = Number(s.total_cost);
    const totalDelivery = Number(s.total_delivery);
    const totalComm     = Number(commR.rows[0].total_commissions);
    const totalMarketing = Number(marketingR.rows[0]?.total_marketing || 0);
    const grossProfit   = totalSales - totalCost;
    const netProfit     = totalSales - totalCost - totalDelivery - totalComm - totalMarketing;

    return res.json({
      total_sales:       totalSales,
      total_cost:        totalCost,
      total_delivery:    totalDelivery,
      total_commissions: totalComm,
      total_marketing:   totalMarketing,
      gross_profit:      grossProfit,
      net_profit:        netProfit,
      profit_margin:     totalSales > 0 ? (netProfit / totalSales) * 100 : 0,
      total_orders:      Number(s.total_orders),
      affiliate_orders:  Number(s.affiliate_orders),
      direct_orders:     Number(s.direct_orders),
      affiliate_sales:   Number(s.affiliate_sales),
      direct_sales:      Number(s.direct_sales),
      avg_order_value:   Number(s.total_orders) > 0 ? totalSales / Number(s.total_orders) : 0,
      order_status:      statusR.rows.map(r => ({ status: r.status, count: Number(r.cnt), total: Number(r.total) })),
    });
  } catch (e) {
    logger.error({ err: e }, "reports/summary error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/reports/daily ──────────────────────────────────────────────────
router.get("/daily", async (req, res) => {
  try {
    const { start, end } = req.query as Record<string, string>;
    const { sql: wh, values } = dateClause("o", start, end);

    const r = await query(`
      SELECT
        DATE(o.created_at)                           AS order_date,
        COALESCE(SUM(oi.total_price), 0)             AS revenue,
        COALESCE(SUM(p.cost_price * oi.quantity), 0) AS cost,
        COALESCE(SUM(o.delivery_charge), 0)          AS delivery,
        COUNT(DISTINCT o.id)                         AS orders
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      ${wh}
      AND o.status NOT IN ('cancelled', 'returned')
      GROUP BY DATE(o.created_at)
      ORDER BY order_date ASC
    `, values);

    const commR = await query(`
      SELECT DATE(o.created_at) AS order_date, COALESCE(SUM(c.amount), 0) AS commissions
      FROM commissions c
      JOIN orders o ON o.id = c.order_id
      ${wh}
      ${wh ? "AND" : "WHERE"} c.status IN ('pending', 'approved', 'paid')
      GROUP BY DATE(o.created_at)
    `, values);

    const commByDate: Record<string, number> = {};
    commR.rows.forEach(cr => { commByDate[String(cr.order_date).split('T')[0]] = Number(cr.commissions); });

    const rows = r.rows.map(row => {
      const dateKey = String(row.order_date).split('T')[0];
      const revenue  = Number(row.revenue);
      const cost     = Number(row.cost);
      const delivery = Number(row.delivery);
      const comm     = commByDate[dateKey] || 0;
      return {
        date:     dateKey,
        revenue,
        cost,
        delivery,
        commissions: comm,
        profit:   revenue - cost - delivery - comm,
        orders:   Number(row.orders),
      };
    });

    return res.json(rows);
  } catch (e) {
    logger.error({ err: e }, "reports/daily error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/reports/affiliates ─────────────────────────────────────────────
router.get("/affiliates", async (req, res) => {
  try {
    const { start, end } = req.query as Record<string, string>;
    const { sql: wh, values } = dateClause("o", start, end);

    const r = await query(`
      SELECT
        a.id,
        a.referral_code,
        COALESCE(pr.name, 'Unknown') AS name,
        COALESCE(pr.email, '')        AS email,
        COUNT(DISTINCT o.id)          AS order_count,
        COALESCE(SUM(oi.total_price), 0) AS total_sales,
        COALESCE(SUM(c.amount), 0)    AS total_commission,
        a.total_clicks
      FROM affiliates a
      LEFT JOIN profiles pr ON pr.user_id = a.user_id
      LEFT JOIN orders o ON o.affiliate_id = a.id
        ${wh ? "AND " + wh.replace("WHERE ", "") : ""}
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN commissions c ON c.order_id = o.id AND c.affiliate_id = a.id
        AND c.status IN ('pending', 'approved', 'paid')
      WHERE a.status IN ('active', 'approved')
      GROUP BY a.id, a.referral_code, pr.name, pr.email, a.total_clicks
      ORDER BY total_sales DESC
      LIMIT 20
    `, values);

    return res.json(r.rows.map(row => ({
      id:               row.id,
      referral_code:    row.referral_code,
      name:             row.name,
      email:            row.email,
      order_count:      Number(row.order_count),
      total_sales:      Number(row.total_sales),
      total_commission: Number(row.total_commission),
      total_clicks:     Number(row.total_clicks),
      conversion_rate:  row.total_clicks > 0 ? (Number(row.order_count) / Number(row.total_clicks)) * 100 : 0,
    })));
  } catch (e) {
    logger.error({ err: e }, "reports/affiliates error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/reports/products ───────────────────────────────────────────────
router.get("/products", async (req, res) => {
  try {
    const { start, end } = req.query as Record<string, string>;
    const { sql: wh, values } = dateClause("o", start, end);

    const r = await query(`
      SELECT
        oi.product_id,
        COALESCE(oi.product_name_en, p.name_en, 'Unknown') AS name_en,
        COALESCE(oi.product_name_bn, p.name_bn, '')         AS name_bn,
        COALESCE(c.name_en, 'Uncategorized')                AS category,
        SUM(oi.quantity)                                    AS total_qty,
        COALESCE(SUM(oi.total_price), 0)                    AS total_sales,
        COALESCE(SUM(p.cost_price * oi.quantity), 0)        AS total_cost,
        COUNT(DISTINCT o.id)                                AS order_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${wh}
      AND o.status NOT IN ('cancelled', 'returned')
      GROUP BY oi.product_id, oi.product_name_en, oi.product_name_bn, p.name_en, p.name_bn, c.name_en
      ORDER BY total_sales DESC
      LIMIT 20
    `, values);

    return res.json(r.rows.map(row => ({
      product_id:   row.product_id,
      name_en:      row.name_en,
      name_bn:      row.name_bn,
      category:     row.category,
      total_qty:    Number(row.total_qty),
      total_sales:  Number(row.total_sales),
      total_cost:   Number(row.total_cost),
      profit:       Number(row.total_sales) - Number(row.total_cost),
      order_count:  Number(row.order_count),
    })));
  } catch (e) {
    logger.error({ err: e }, "reports/products error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
