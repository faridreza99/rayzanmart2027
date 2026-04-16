import { Router } from "express";
import { query } from "../lib/db-pool.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(authMiddleware);

// POST /api/products/:productId/reviews
router.post("/products/:productId/reviews", async (req: any, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment is required" });
    }

    // Check for duplicate
    const existing = await query(
      "SELECT id FROM product_reviews WHERE product_id = $1 AND user_id = $2",
      [productId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "already_reviewed" });
    }

    // Insert review
    const insertResult = await query(
      `INSERT INTO product_reviews (product_id, user_id, rating, comment, is_approved)
       VALUES ($1, $2, $3, $4, false) RETURNING *`,
      [productId, userId, rating, comment.trim()]
    );
    const review = insertResult.rows[0];

    // Recalculate product rating from approved reviews
    const statsResult = await query(
      "SELECT COUNT(*) AS cnt, COALESCE(AVG(rating), 0) AS avg FROM product_reviews WHERE product_id = $1 AND is_approved = true",
      [productId]
    );
    const { cnt, avg } = statsResult.rows[0];
    await query(
      "UPDATE products SET rating = $1, reviews_count = $2 WHERE id = $3",
      [parseFloat(avg).toFixed(1), parseInt(cnt), productId]
    );

    return res.status(201).json({
      id: review.id,
      product_id: review.product_id,
      user_id: review.user_id,
      rating: review.rating,
      comment: review.comment,
      is_approved: review.is_approved,
      created_at: review.created_at,
    });
  } catch (err) {
    logger.error({ err }, "POST /products/:productId/reviews error");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
