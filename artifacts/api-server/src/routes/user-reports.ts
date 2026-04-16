/**
 * User Report API — Admin only
 * Provides aggregated user, affiliate, and loyalty data.
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../lib/db-pool.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(authMiddleware);

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const userId = (req as any).userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return false; }
  const r = await query("SELECT 1 FROM user_roles WHERE user_id=$1 AND role='admin'", [userId]);
  if (r.rows.length === 0) { res.status(403).json({ error: "Admin access required" }); return false; }
  return true;
}

// GET /api/user-reports/summary
router.get("/user-reports/summary", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const [affiliateR, loyaltyR, userCountR, pendingR] = await Promise.all([
      query(`
        SELECT
          COALESCE(SUM(paid_commission),0)    AS total_paid_commission,
          COALESCE(SUM(total_commission),0)   AS total_earned_commission,
          COUNT(*)                            AS total_affiliates
        FROM affiliates
        WHERE status IN ('active','approved')
      `),
      query(`
        SELECT
          COALESCE(SUM(CASE WHEN type='earn'   THEN points ELSE 0 END),0) AS total_points_earned,
          COALESCE(SUM(CASE WHEN type='redeem' THEN points ELSE 0 END),0) AS total_points_redeemed,
          COALESCE(SUM(CASE WHEN type='earn'   THEN amount ELSE 0 END),0) AS total_amount_earned,
          COUNT(DISTINCT user_id) AS users_with_loyalty
        FROM loyalty_transactions
      `),
      query(`SELECT COUNT(*) AS total_users FROM users`),
      query(`
        SELECT COALESCE(SUM(pending_commission),0) AS total_pending_commission
        FROM affiliates
        WHERE status IN ('active','approved')
      `),
    ]);

    res.json({
      affiliate: {
        ...affiliateR.rows[0],
        total_pending_commission: pendingR.rows[0].total_pending_commission,
      },
      loyalty: loyaltyR.rows[0],
      total_users: userCountR.rows[0].total_users,
    });
  } catch (err) {
    logger.error({ err }, "user-reports/summary error");
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/user-reports/users
router.get("/user-reports/users", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const page    = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit   = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));
    const offset  = (page - 1) * limit;
    const search  = (req.query.search  as string) || "";
    const dateFrom= (req.query.date_from as string) || "";
    const dateTo  = (req.query.date_to  as string) || "";

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR u.email ILIKE $${idx} OR p.phone ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (dateFrom) { conditions.push(`u.created_at >= $${idx}`); params.push(dateFrom); idx++; }
    if (dateTo)   { conditions.push(`u.created_at <= $${idx}`); params.push(dateTo + "T23:59:59Z"); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const usersSQL = `
      SELECT
        u.id,
        u.email,
        u.created_at,
        u.email_confirmed,
        p.name,
        p.phone,
        COALESCE(p.is_blocked, false)          AS is_blocked,
        COALESCE(p.loyalty_points, 0)          AS loyalty_points,
        COALESCE(a.total_commission, 0)        AS affiliate_total_commission,
        COALESCE(a.paid_commission, 0)         AS affiliate_paid_commission,
        COALESCE(a.pending_commission, 0)      AS affiliate_pending_commission,
        a.referral_code,
        a.status                               AS affiliate_status,
        COALESCE(lt.total_earned, 0)           AS loyalty_total_earned,
        COALESCE(lt.total_redeemed, 0)         AS loyalty_total_redeemed,
        COALESCE(lt.amount_earned, 0)          AS loyalty_amount_earned,
        COALESCE(ll.login_count, 0)            AS login_count,
        ll.last_login,
        COALESCE(ord.total_orders, 0)          AS total_orders,
        COALESCE(ord.total_spent, 0)           AS total_spent,
        (u.plain_password IS NOT NULL)         AS has_plain_password
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN affiliates a ON a.user_id = u.id
      LEFT JOIN (
        SELECT
          user_id,
          SUM(CASE WHEN type='earn'   THEN points ELSE 0 END) AS total_earned,
          SUM(CASE WHEN type='redeem' THEN points ELSE 0 END) AS total_redeemed,
          SUM(CASE WHEN type='earn'   THEN amount ELSE 0 END) AS amount_earned
        FROM loyalty_transactions GROUP BY user_id
      ) lt ON lt.user_id = u.id
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*)               AS login_count,
          MAX(created_at)        AS last_login
        FROM user_login_logs WHERE event_type='login'
        GROUP BY user_id
      ) ll ON ll.user_id = u.id
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*)               AS total_orders,
          COALESCE(SUM(total),0) AS total_spent
        FROM orders
        GROUP BY user_id
      ) ord ON ord.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(limit, offset);

    const countSQL = `
      SELECT COUNT(*) AS total
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ${where}
    `;

    const [usersResult, countResult] = await Promise.all([
      query(usersSQL, params),
      query(countSQL, params.slice(0, -2)),
    ]);

    res.json({
      users: usersResult.rows.map((u: any) => ({ ...u, password: "••••••••" })),
      total: parseInt(countResult.rows[0].total, 10),
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "user-reports/users error");
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/user-reports/users/:userId/password — admin changes a user's password
router.put("/user-reports/users/:userId/password", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { userId } = req.params;
    const { password } = req.body;
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" });
    }
    const userCheck = await query("SELECT id FROM users WHERE id=$1", [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const hash = await bcrypt.hash(password, 10);
    await query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [hash, userId]);
    logger.info({ userId }, "Admin changed user password");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "user-reports/change-password error");
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/user-reports/users/:userId/password — admin only, returns plain_password
router.get("/user-reports/users/:userId/password", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { userId } = req.params;
    const result = await query("SELECT plain_password FROM users WHERE id=$1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ plain_password: result.rows[0].plain_password || null });
  } catch (err) {
    logger.error({ err }, "user-reports/password error");
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/user-reports/login-logs/:userId
router.get("/user-reports/login-logs/:userId", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { userId } = req.params;
    const result = await query(
      `SELECT id, event_type, ip_address, user_agent, created_at
       FROM user_login_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    logger.error({ err }, "user-reports/login-logs error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
