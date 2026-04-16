/**
 * RPC route — handles supabase.rpc(fn, args) calls
 */
import { Router } from "express";
import { query } from "../lib/db-pool.js";
import { authMiddleware } from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/rpc/:fn", authMiddleware, async (req, res) => {
  const fn = req.params.fn;
  const args = req.body || {};
  const userId = (req as any).userId;

  try {
    switch (fn) {
      case "brand_has_products": {
        const r = await query("SELECT 1 FROM products WHERE brand = (SELECT name_en FROM brands WHERE id = $1) AND is_active = TRUE LIMIT 1", [args.brand_uuid]);
        return res.json(r.rows.length > 0);
      }

      case "category_has_products": {
        const r = await query("SELECT 1 FROM products WHERE category_id = $1 AND is_active = TRUE LIMIT 1", [args.category_uuid]);
        return res.json(r.rows.length > 0);
      }

      case "count_category_products": {
        const r = await query("SELECT COUNT(*) AS cnt FROM products WHERE category_id = $1", [args.category_uuid]);
        return res.json(Number(r.rows[0].cnt));
      }

      case "get_my_affiliate_id": {
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const r = await query("SELECT id FROM affiliates WHERE user_id = $1 LIMIT 1", [userId]);
        return res.json(r.rows[0]?.id || null);
      }

      case "get_my_profile_id": {
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const r = await query("SELECT id FROM profiles WHERE user_id = $1 LIMIT 1", [userId]);
        return res.json(r.rows[0]?.id || null);
      }

      case "has_role": {
        const r = await query("SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2 LIMIT 1", [args._user_id, args._role]);
        return res.json(r.rows.length > 0);
      }

      case "increment_affiliate_clicks": {
        await query("UPDATE affiliates SET total_clicks = total_clicks + 1 WHERE id = $1", [args.aff_id]);
        return res.json(null);
      }

      case "is_admin": {
        if (!userId) return res.json(false);
        const r = await query("SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1", [userId]);
        return res.json(r.rows.length > 0);
      }

      case "record_affiliate_click": {
        const r = await query("SELECT id FROM affiliates WHERE referral_code ILIKE $1 LIMIT 1", [args.p_referral_code]);
        if (r.rows.length > 0) {
          await query(
            "INSERT INTO affiliate_clicks (affiliate_id, referrer_url, user_agent) VALUES ($1, $2, $3)",
            [r.rows[0].id, args.p_referrer_url || null, args.p_user_agent || null]
          );
          await query("UPDATE affiliates SET total_clicks = total_clicks + 1 WHERE id = $1", [r.rows[0].id]);
        }
        return res.json(null);
      }

      case "get_affiliate_balance": {
        const r = await query(`
          SELECT
            COALESCE(SUM(CASE WHEN status IN ('approved','paid') THEN amount ELSE 0 END), 0) AS total_earned,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_commission
          FROM commissions WHERE affiliate_id = $1
        `, [args.p_affiliate_id]);

        const wr = await query(`
          SELECT
            COALESCE(SUM(CASE WHEN status IN ('approved','completed') THEN amount ELSE 0 END), 0) AS withdrawn,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_withdrawal
          FROM withdrawals WHERE affiliate_id = $1
        `, [args.p_affiliate_id]);

        const totalEarned = Number(r.rows[0].total_earned);
        const pendingCommission = Number(r.rows[0].pending_commission);
        const withdrawn = Number(wr.rows[0].withdrawn);
        const pendingWithdrawal = Number(wr.rows[0].pending_withdrawal);
        return res.json({
          total_earned: totalEarned,
          pending_commission: pendingCommission,
          withdrawn,
          pending_withdrawal: pendingWithdrawal,
          available_balance: Math.max(0, totalEarned - withdrawn - pendingWithdrawal),
        });
      }

      case "get_customer_orders_by_id": {
        const r = await query(
          `SELECT o.*, json_agg(oi.*) AS order_items FROM orders o
           LEFT JOIN order_items oi ON oi.order_id = o.id
           WHERE o.user_id = $1
           GROUP BY o.id
           ORDER BY o.created_at DESC`,
          [args.p_customer_id]
        );
        return res.json(r.rows);
      }

      case "refresh_product_review_summary": {
        const r = await query(
          "SELECT AVG(rating)::DECIMAL(3,2) AS avg_rating, COUNT(*) AS cnt FROM product_reviews WHERE product_id = $1 AND is_approved = TRUE",
          [args.p_product_id]
        );
        await query(
          "UPDATE products SET rating = $1, reviews_count = $2 WHERE id = $3",
          [r.rows[0].avg_rating || 0, r.rows[0].cnt || 0, args.p_product_id]
        );
        return res.json(null);
      }

      default:
        logger.warn({ fn }, "Unknown RPC function");
        return res.status(404).json({ error: `RPC function '${fn}' not found` });
    }
  } catch (err: any) {
    logger.error({ err, fn }, "RPC error");
    res.status(500).json({ error: err.message });
  }
});

export default router;
