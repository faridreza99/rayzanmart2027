import { Router } from "express";
import { query } from "../lib/db-pool.js";
import { authMiddleware, requireAuth, requireAdmin } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(authMiddleware);

// GET /api/website-feedback  — public, only approved, paginated
router.get("/website-feedback", async (req: any, res: any) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.min(50, parseInt((req.query.limit as string) || "12"));
    const offset = (page - 1) * limit;

    const [totalRes, feedbackRes] = await Promise.all([
      query("SELECT COUNT(*) AS cnt FROM website_feedback WHERE is_approved = true", []),
      query(
        `SELECT wf.id, wf.rating, wf.comment, wf.created_at,
                COALESCE(p.name, 'User') AS user_name
         FROM website_feedback wf
         LEFT JOIN profiles p ON p.user_id = wf.user_id
         WHERE wf.is_approved = true
         ORDER BY wf.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    const total = parseInt(totalRes.rows[0].cnt);
    return res.json({ feedback: feedbackRes.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "GET /website-feedback error");
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/website-feedback/stats — public avg rating
router.get("/website-feedback/stats", async (_req: any, res: any) => {
  try {
    const r = await query(
      "SELECT COUNT(*) AS total, COALESCE(AVG(rating),0) AS avg FROM website_feedback WHERE is_approved = true",
      []
    );
    const { total, avg } = r.rows[0];
    return res.json({ total: parseInt(total), avg: parseFloat(parseFloat(avg).toFixed(1)) });
  } catch (err) {
    logger.error({ err }, "GET /website-feedback/stats error");
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/website-feedback/my — authenticated user's own feedback
router.get("/website-feedback/my", requireAuth, async (req: any, res: any) => {
  try {
    const r = await query(
      `SELECT id, rating, comment, is_approved, created_at
       FROM website_feedback WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    return res.json(r.rows);
  } catch (err) {
    logger.error({ err }, "GET /website-feedback/my error");
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/website-feedback/admin — admin: all feedback with user info
router.get("/website-feedback/admin", requireAdmin, async (req: any, res: any) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.min(100, parseInt((req.query.limit as string) || "20"));
    const offset = (page - 1) * limit;

    const [totalRes, feedbackRes] = await Promise.all([
      query("SELECT COUNT(*) AS cnt FROM website_feedback", []),
      query(
        `SELECT wf.id, wf.rating, wf.comment, wf.is_approved, wf.created_at,
                wf.user_id,
                COALESCE(p.name, 'User') AS user_name,
                u.email
         FROM website_feedback wf
         LEFT JOIN profiles p ON p.user_id = wf.user_id
         LEFT JOIN users u ON u.id = wf.user_id
         ORDER BY wf.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    const total = parseInt(totalRes.rows[0].cnt);
    return res.json({ feedback: feedbackRes.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "GET /website-feedback/admin error");
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/website-feedback — authenticated, one per user (or allow many)
router.post("/website-feedback", requireAuth, async (req: any, res: any) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment is required" });
    }

    const r = await query(
      `INSERT INTO website_feedback (user_id, rating, comment)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, rating, comment.trim()]
    );
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    logger.error({ err }, "POST /website-feedback error");
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/website-feedback/:id/approve — admin toggle approval
router.patch("/website-feedback/:id/approve", requireAdmin, async (req: any, res: any) => {
  try {
    const { is_approved } = req.body;
    const r = await query(
      "UPDATE website_feedback SET is_approved = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [Boolean(is_approved), req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Not found" });
    return res.json(r.rows[0]);
  } catch (err) {
    logger.error({ err }, "PATCH /website-feedback/:id/approve error");
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/website-feedback/:id — admin or own user
router.delete("/website-feedback/:id", requireAuth, async (req: any, res: any) => {
  try {
    const isAdminRes = await query(
      "SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1",
      [req.userId]
    );
    const isAdmin = isAdminRes.rows.length > 0;

    const condition = isAdmin
      ? "WHERE id = $1"
      : "WHERE id = $1 AND user_id = $2";
    const params = isAdmin ? [req.params.id] : [req.params.id, req.userId];

    const r = await query(`DELETE FROM website_feedback ${condition} RETURNING id`, params);
    if (!r.rows.length) return res.status(404).json({ error: "Not found or unauthorized" });
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "DELETE /website-feedback/:id error");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
