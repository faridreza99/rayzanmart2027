/**
 * Generic database proxy route.
 * Translates frontend QueryBuilder requests into PostgreSQL queries.
 *
 * URL pattern: /api/db/:table
 * Methods: GET (SELECT), POST (INSERT), PUT (UPDATE), PATCH (UPSERT), DELETE
 *
 * Query params for SELECT:
 *   _select=col1,col2    — columns to select
 *   _order=col:asc,...   — ORDER BY
 *   _limit=N             — LIMIT
 *   _conflict=col        — ON CONFLICT column (for PATCH/upsert)
 *   col=val              — WHERE col = val
 *   col__is=null         — WHERE col IS NULL
 *   col__gte=val         — WHERE col >= val
 *   col__lte=val         — WHERE col <= val
 *   col__gt=val          — WHERE col > val
 *   col__lt=val          — WHERE col < val
 *   col__in=a,b,c        — WHERE col IN (...)
 *   col__ilike=pattern   — WHERE col ILIKE pattern
 *   col__not_null=1      — WHERE col IS NOT NULL
 *   __or_N=col.eq.val    — OR filters
 */

import { Router } from "express";
import { query } from "../lib/db-pool.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ── In-memory response cache for public read-heavy tables ─────────────────
const CACHE_TTL_MS = 30_000; // 30s cache for public data
const STATIC_CACHE_TABLES = new Set(["site_settings", "categories", "brands", "hero_banners", "faq_items", "affiliate_page_content", "affiliate_testimonials", "affiliate_video_campaigns"]);
const responseCache = new Map<string, { data: any; expiresAt: number }>();

function getCacheKey(table: string, params: Record<string, string>): string {
  return `${table}:${JSON.stringify(params)}`;
}

function getFromCache(key: string): any | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { responseCache.delete(key); return null; }
  return entry.data;
}

function setCache(key: string, data: any): void {
  responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  // Prevent unbounded memory: cap at 200 entries
  if (responseCache.size > 200) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
}

// Invalidate cache when a table is mutated
function invalidateTable(table: string): void {
  for (const key of responseCache.keys()) {
    if (key.startsWith(`${table}:`)) responseCache.delete(key);
  }
}

// Cache of JSONB column names per table (fetched once from information_schema)
const jsonbColsCache = new Map<string, Set<string>>();
async function getJsonbCols(table: string): Promise<Set<string>> {
  if (jsonbColsCache.has(table)) return jsonbColsCache.get(table)!;
  const result = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND data_type = 'jsonb'`,
    [table],
  );
  const cols = new Set(result.rows.map((r: any) => r.column_name as string));
  jsonbColsCache.set(table, cols);
  return cols;
}

// Table whitelist for security
const ALLOWED_TABLES = new Set([
  "products", "product_variants", "product_reviews", "product_activity_log",
  "categories", "brands",
  "orders", "order_items",
  "profiles", "user_roles",
  "affiliates", "affiliate_campaigns", "affiliate_clicks", "affiliate_leaderboard",
  "commissions", "commission_rules",
  "coupons",
  "wishlist",
  "site_settings",
  "hero_banners",
  "admin_audit_log",
  "system_notifications",
  "loyalty_transactions",
  "marketing_expenses",
  "faq_items",
  "affiliate_testimonials",
  "affiliate_video_campaigns",
  "affiliate_page_content",
  "withdrawals",
  "vw_profit_loss",
]);

// Tables that require authentication for WRITE operations
// Note: orders and order_items allow unauthenticated INSERT (guest checkout)
const AUTH_REQUIRED = new Set([
  "wishlist", "profiles",
  "commissions", "affiliates", "affiliate_campaigns",
  "system_notifications", "loyalty_transactions", "withdrawals",
]);

// Tables that require admin role for write operations
const ADMIN_WRITE = new Set([
  "products", "product_variants", "categories", "brands", "coupons",
  "commission_rules", "hero_banners", "site_settings", "admin_audit_log",
  "affiliate_testimonials", "affiliate_video_campaigns", "faq_items",
  "affiliate_page_content",
  "marketing_expenses",
]);

router.all("/db/:table", authMiddleware, async (req, res) => {
  const table = req.params.table;

  if (!ALLOWED_TABLES.has(table)) {
    return res.status(403).json({ error: `Table '${table}' is not accessible` });
  }

  const userId = (req as any).userId;
  const isRead = req.method === "GET";

  if (!isRead && ADMIN_WRITE.has(table)) {
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const roleResult = await query("SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1", [userId]);
    if (roleResult.rows.length === 0) {
      // Allow users to update their own profile
      if (table === "profiles" && req.method === "PUT" && (req.query["user_id"] === userId || (req as any).body?.user_id === userId)) {
        // allowed
      } else if (!ADMIN_WRITE.has(table)) {
        // allowed
      } else {
        return res.status(403).json({ error: "Admin access required" });
      }
    }
  }

  if (!isRead && AUTH_REQUIRED.has(table) && !userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const params = req.query as Record<string, string>;

    // Prevent browser-level HTTP caching so mutations always return fresh data
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
      // Serve from cache for static public tables (no auth-sensitive data)
      if (STATIC_CACHE_TABLES.has(table) && !userId) {
        const cacheKey = getCacheKey(table, params);
        const cached = getFromCache(cacheKey);
        if (cached) {
          res.setHeader("X-Cache", "HIT");
          return res.json(cached);
        }
        const result = await handleSelectRaw(table, params, userId);
        setCache(cacheKey, result);
        res.setHeader("X-Cache", "MISS");
        return res.json(result);
      }
      return await handleSelect(table, params, userId, res);
    } else if (req.method === "POST") {
      invalidateTable(table);
      return await handleInsert(table, req.body, userId, res);
    } else if (req.method === "PUT") {
      invalidateTable(table);
      return await handleUpdate(table, req.body, params, userId, res);
    } else if (req.method === "PATCH") {
      invalidateTable(table);
      return await handleUpsert(table, req.body, params, userId, res);
    } else if (req.method === "DELETE") {
      invalidateTable(table);
      return await handleDelete(table, params, userId, res);
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    logger.error({ err, table, method: req.method }, "DB proxy error");
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildWhere(params: Record<string, string>, paramOffset = 1, tableAlias?: string): { clause: string; values: any[]; nextIdx: number } {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = paramOffset;
  const alias = tableAlias ? `${tableAlias}.` : "";

  const specialKeys = new Set(["_select", "_order", "_limit", "_conflict"]);

  for (const [key, val] of Object.entries(params)) {
    if (specialKeys.has(key) || key.startsWith("__or_")) continue;

    if (key.endsWith("__is")) {
      const col = key.slice(0, -4);
      conditions.push(val === "null" ? `${alias}"${col}" IS NULL` : `${alias}"${col}" IS NOT NULL`);
    } else if (key.endsWith("__gte")) {
      conditions.push(`${alias}"${key.slice(0, -5)}" >= $${idx++}`);
      values.push(val);
    } else if (key.endsWith("__lte")) {
      conditions.push(`${alias}"${key.slice(0, -5)}" <= $${idx++}`);
      values.push(val);
    } else if (key.endsWith("__gt")) {
      conditions.push(`${alias}"${key.slice(0, -4)}" > $${idx++}`);
      values.push(val);
    } else if (key.endsWith("__lt")) {
      conditions.push(`${alias}"${key.slice(0, -4)}" < $${idx++}`);
      values.push(val);
    } else if (key.endsWith("__in")) {
      const col = key.slice(0, -4);
      const list = val.split(",").map(v => v.trim());
      const placeholders = list.map(() => `$${idx++}`).join(", ");
      conditions.push(`${alias}"${col}" IN (${placeholders})`);
      values.push(...list);
    } else if (key.endsWith("__ilike")) {
      conditions.push(`${alias}"${key.slice(0, -7)}" ILIKE $${idx++}`);
      values.push(val);
    } else if (key.endsWith("__not_null")) {
      conditions.push(`${alias}"${key.slice(0, -10)}" IS NOT NULL`);
    } else {
      conditions.push(val === "null" ? `${alias}"${key}" IS NULL` : `${alias}"${key}" = $${idx++}`);
      if (val !== "null") values.push(val);
    }
  }

  // OR filters
  for (const [key, val] of Object.entries(params)) {
    if (!key.startsWith("__or_")) continue;
    const parts = val.split(",");
    const orClauses = parts.map(part => {
      const [col, op, ...rest] = part.split(".");
      const v = rest.join(".");
      if (op === "eq") { values.push(v); return `${alias}"${col}" = $${idx++}`; }
      if (op === "ilike") { values.push(v); return `${alias}"${col}" ILIKE $${idx++}`; }
      return "1=1";
    });
    if (orClauses.length) conditions.push(`(${orClauses.join(" OR ")})`);
  }

  return { clause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", values, nextIdx: idx };
}

async function handleSelectRaw(table: string, params: Record<string, string>, userId: string | null): Promise<any[]> {
  const selectParam = params["_select"] || "*";
  const selectCols = buildSelectCols(selectParam, table);
  const { clause, values } = buildWhere(params);

  let sql = `SELECT ${selectCols} FROM "${table}" ${clause}`;

  if (params["_order"]) {
    const orders = params["_order"].split(",").map(o => {
      const [col, dir] = o.split(":");
      return `"${col}" ${dir === "desc" ? "DESC" : "ASC"}`;
    });
    sql += ` ORDER BY ${orders.join(", ")}`;
  }
  if (params["_limit"]) sql += ` LIMIT ${parseInt(params["_limit"], 10)}`;

  const result = await query(sql, values);
  return result.rows;
}

async function handleSelect(table: string, params: Record<string, string>, userId: string | null, res: any) {
  const selectParam = params["_select"] || "*";

  // Route to special join handlers based on table + nested select pattern
  if (table === "vw_profit_loss") return handleProfitLossSelect(params, res);
  if (table === "wishlist") return handleWishlistSelect(params, userId, res);
  if (table === "orders" && selectParam.includes("order_items")) return handleOrdersWithItems(params, res);
  if (table === "products" && selectParam.includes("product_variants")) return handleProductsWithVariants(params, res);
  if (table === "commissions" && selectParam.includes("orders(")) return handleCommissionsWithOrders(params, res);
  if (table === "withdrawals" && selectParam.includes("affiliates(")) return handleWithdrawalsWithAffiliates(params, res);
  if (table === "affiliates" && selectParam.includes("profiles")) return handleAffiliatesWithProfiles(params, res);

  const rows = await handleSelectRaw(table, params, userId);
  return res.json(rows);
}

async function handleOrdersWithItems(params: Record<string, string>, res: any) {
  const { clause, values } = buildWhere(params, 1, "o");
  const orderClause = params["_order"]
    ? `ORDER BY ${params["_order"].split(",").map(o => { const [c, d] = o.split(":"); return `o."${c}" ${d === "desc" ? "DESC" : "ASC"}`; }).join(", ")}`
    : "ORDER BY o.created_at DESC";
  const sql = `
    SELECT o.*,
           COALESCE(json_agg(oi.* ORDER BY oi.created_at) FILTER (WHERE oi.id IS NOT NULL), '[]') AS order_items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    ${clause}
    GROUP BY o.id
    ${orderClause}
    ${params["_limit"] ? `LIMIT ${parseInt(params["_limit"], 10)}` : ""}
  `;
  const result = await query(sql, values);
  return res.json(result.rows);
}

async function handleProductsWithVariants(params: Record<string, string>, res: any) {
  const { clause, values } = buildWhere(params, 1, "p");
  const orderClause = params["_order"]
    ? `ORDER BY ${params["_order"].split(",").map(o => { const [c, d] = o.split(":"); return `p."${c}" ${d === "desc" ? "DESC" : "ASC"}`; }).join(", ")}`
    : "";
  const sql = `
    SELECT p.*,
           COALESCE(json_agg(pv.* ORDER BY pv.created_at) FILTER (WHERE pv.id IS NOT NULL), '[]') AS product_variants
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    ${clause}
    GROUP BY p.id
    ${orderClause}
    ${params["_limit"] ? `LIMIT ${parseInt(params["_limit"], 10)}` : ""}
  `;
  const result = await query(sql, values);
  return res.json(result.rows);
}

async function handleCommissionsWithOrders(params: Record<string, string>, res: any) {
  const { clause, values } = buildWhere(params, 1, "c");
  const sql = `
    SELECT c.*,
           CASE WHEN o.id IS NOT NULL
                THEN json_build_object('order_number', o.order_number)
                ELSE NULL END AS orders
    FROM commissions c
    LEFT JOIN orders o ON o.id = c.order_id
    ${clause}
    ORDER BY c.created_at DESC
    ${params["_limit"] ? `LIMIT ${parseInt(params["_limit"], 10)}` : ""}
  `;
  const result = await query(sql, values);
  return res.json(result.rows);
}

async function handleAffiliatesWithProfiles(params: Record<string, string>, res: any) {
  const { clause, values } = buildWhere(params, 1, "a");
  const sql = `
    SELECT a.*,
           CASE WHEN p.user_id IS NOT NULL
                THEN json_build_object('name', p.name, 'email', p.email, 'phone', p.phone)
                ELSE NULL END AS profiles
    FROM affiliates a
    LEFT JOIN profiles p ON p.user_id = a.user_id
    ${clause}
    ORDER BY a.created_at DESC
    ${params["_limit"] ? `LIMIT ${parseInt(params["_limit"], 10)}` : ""}
  `;
  const result = await query(sql, values);
  return res.json(result.rows);
}

async function handleWithdrawalsWithAffiliates(params: Record<string, string>, res: any) {
  const { clause, values } = buildWhere(params, 1, "w");
  const sql = `
    SELECT w.*,
           json_build_object(
             'id', a.id,
             'referral_code', a.referral_code,
             'profiles', json_build_object('name', p.name, 'email', p.email, 'phone', p.phone)
           ) AS affiliates
    FROM withdrawals w
    LEFT JOIN affiliates a ON a.id = w.affiliate_id
    LEFT JOIN profiles p ON p.user_id = a.user_id
    ${clause}
    ORDER BY w.created_at DESC
    ${params["_limit"] ? `LIMIT ${parseInt(params["_limit"], 10)}` : ""}
  `;
  const result = await query(sql, values);
  return res.json(result.rows);
}

function buildSelectCols(selectStr: string, table: string): string {
  // Handle nested selects like "*, products(*)" - flatten to just "*"
  if (selectStr.includes("(")) return "*";
  if (selectStr === "*") return "*";
  return selectStr.split(",").map(c => {
    c = c.trim();
    if (c === "*") return "*";
    return `"${c}"`;
  }).join(", ");
}

async function handleWishlistSelect(params: Record<string, string>, userId: string | null, res: any) {
  const { clause, values } = buildWhere(params, 1, "w");
  const sql = `
    SELECT w.id, w.user_id, w.product_id, w.created_at,
           row_to_json(p.*) AS products
    FROM wishlist w
    LEFT JOIN products p ON p.id = w.product_id
    ${clause}
  `;
  const result = await query(sql, values);
  return res.json(result.rows);
}

async function handleProfitLossSelect(params: Record<string, string>, res: any) {
  const { clause, values } = buildWhere(params);
  let sql = `SELECT * FROM vw_profit_loss ${clause} ORDER BY order_date DESC`;
  const result = await query(sql, values);
  return res.json(result.rows);
}

function serializeCol(col: string, v: any, jsonbCols: Set<string>): any {
  if (v == null) return v;
  if (jsonbCols.has(col)) {
    if (typeof v === "string") {
      try { JSON.parse(v); return v; } catch { return JSON.stringify(v); }
    }
    return JSON.stringify(v);
  }
  if (typeof v === "object" && !Array.isArray(v)) return JSON.stringify(v);
  return v;
}

function generateOrderNumber(): string {
  const now = Date.now();
  const timePart = now.toString(36).toUpperCase().slice(-6);
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RM${timePart}${randPart}`;
}

async function handleInsert(table: string, body: any, userId: string | null, res: any) {
  const rows = Array.isArray(body) ? body : [body];
  const inserted: any[] = [];
  const jsonbCols = await getJsonbCols(table);

  for (const row of rows) {
    // ── Order-specific logic ──────────────────────────────────────────────────
    if (table === "orders") {
      // 1. Always generate a unique order_number (never trust the client value)
      let orderNum = generateOrderNumber();
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await query(
          `SELECT 1 FROM orders WHERE order_number = $1 LIMIT 1`,
          [orderNum]
        );
        if (exists.rows.length === 0) break;
        orderNum = generateOrderNumber();
      }
      row.order_number = orderNum;

      // 2. Total = subtotal − discount − loyalty points discount (delivery paid separately)
      const subtotal = parseFloat(row.subtotal) || 0;
      const discount = parseFloat(row.discount_amount) || 0;
      let pointsRedeemed = parseInt(row.points_redeemed) || 0;
      let pointsDiscount = parseFloat(row.points_discount_amount) || 0;

      // 2a. Server-side loyalty points validation (IMPORTANT: never trust client values)
      if (pointsRedeemed > 0 && row.user_id) {
        try {
          const profileRes = await query(
            `SELECT loyalty_points FROM profiles WHERE user_id = $1 LIMIT 1`,
            [row.user_id],
          );
          const actualUserPoints = parseInt(profileRes.rows[0]?.loyalty_points) || 0;

          // Cap 1: max 50% of user's actual points balance
          const maxByPoints = Math.floor(actualUserPoints * 0.5);
          pointsRedeemed = Math.min(pointsRedeemed, maxByPoints);

          // Cap 2: points discount cannot exceed order subtotal (so total never goes negative)
          const maxAllowedDiscount = Math.floor(subtotal - (parseFloat(row.discount_amount) || 0));
          pointsRedeemed = Math.min(pointsRedeemed, Math.max(0, maxAllowedDiscount));
          pointsDiscount = pointsRedeemed; // 1 point = 1 taka

          row.points_redeemed = pointsRedeemed;
          row.points_discount_amount = pointsDiscount;
        } catch (e) {
          logger.warn({ err: e }, "Could not validate loyalty points; zeroing out");
          row.points_redeemed = 0;
          row.points_discount_amount = 0;
          pointsRedeemed = 0;
          pointsDiscount = 0;
        }
      } else {
        // Unauthenticated or no points to redeem
        row.points_redeemed = 0;
        row.points_discount_amount = 0;
        pointsRedeemed = 0;
        pointsDiscount = 0;
      }

      row.total = Math.max(0, subtotal - discount - pointsDiscount);

      // 3. Calculate points_earned based on loyalty_rules from site_settings
      try {
        const loyaltyResult = await query(
          `SELECT setting_value FROM site_settings WHERE setting_key = 'loyalty_rules' LIMIT 1`
        );
        if (loyaltyResult.rows.length > 0) {
          const rules = loyaltyResult.rows[0].setting_value;
          if (rules?.enabled && rules?.earn_ratio > 0) {
            row.points_earned = Math.floor(row.total / rules.earn_ratio);
          }
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not fetch loyalty_rules for points_earned calculation");
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const cols = Object.keys(row);
    if (cols.length === 0) continue;
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const colStr = cols.map(c => `"${c}"`).join(", ");
    const vals = cols.map(c => serializeCol(c, row[c], jsonbCols));

    const result = await query(
      `INSERT INTO "${table}" (${colStr}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    const insertedRow = result.rows[0];
    inserted.push(insertedRow);

    // ── Post-insert commission_rules: sync is_affiliate on product ───────────
    if (table === "commission_rules" && insertedRow.rule_type === "product" && insertedRow.product_id && insertedRow.is_active !== false) {
      try {
        await query(
          `UPDATE products SET is_affiliate = true, affiliate_commission_type = $1, affiliate_commission_value = $2 WHERE id = $3`,
          [insertedRow.commission_type || "percentage", insertedRow.commission_value || 0, insertedRow.product_id]
        );
        logger.info({ productId: insertedRow.product_id }, "Synced is_affiliate flag after commission rule insert");
      } catch (e) {
        logger.warn({ err: e }, "Failed to sync is_affiliate on commission rule insert");
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Post-insert commission creation for order_items ──────────────────────
    if (table === "order_items" && insertedRow.order_id && insertedRow.product_id) {
      try {
        // 1. Check if the order was placed via an affiliate referral
        //    Only create commission if the order has a valid affiliate_id that is active/approved.
        const orderRes = await query(
          `SELECT o.affiliate_id, o.id AS order_id, o.order_number,
                  a.commission_rate, a.id AS aff_id
           FROM orders o
           JOIN affiliates a ON a.id = o.affiliate_id
           WHERE o.id = $1 AND o.affiliate_id IS NOT NULL AND a.status IN ('active', 'approved')`,
          [insertedRow.order_id]
        );

        if (orderRes.rows.length === 0) {
          // No affiliate on this order — skip commission creation
          logger.debug({ orderId: insertedRow.order_id }, "No active affiliate for order; skipping commission");
        } else {
          const orderInfo = orderRes.rows[0];

          // 2. Get product category for rule matching
          const prodRes = await query(
            `SELECT category_id FROM products WHERE id = $1`,
            [insertedRow.product_id]
          );
          const categoryId = prodRes.rows[0]?.category_id || null;

          // 3. Find the best commission rule (product > category > global)
          const ruleRes = await query(
            `SELECT commission_type, commission_value
             FROM commission_rules
             WHERE is_active = true
               AND (
                 (rule_type = 'product' AND product_id = $1) OR
                 (rule_type = 'category' AND category_id = $2) OR
                 (rule_type = 'global')
               )
             ORDER BY
               CASE rule_type WHEN 'product' THEN 1 WHEN 'category' THEN 2 WHEN 'global' THEN 3 END
             LIMIT 1`,
            [insertedRow.product_id, categoryId]
          );

          // Default to affiliate's commission_rate if no specific rule found
          let commissionType = "percentage";
          let commissionValue = Number(orderInfo.commission_rate) || 0;

          if (ruleRes.rows.length > 0) {
            commissionType = ruleRes.rows[0].commission_type;
            commissionValue = Number(ruleRes.rows[0].commission_value);
          }

          // 4. Calculate commission amount based on type
          const itemTotal = Number(insertedRow.total_price) || 0;
          const qty = Number(insertedRow.quantity) || 1;
          let commissionAmount = 0;
          if (commissionType === "percentage") {
            commissionAmount = (commissionValue / 100) * itemTotal;
          } else {
            // fixed: commissionValue per unit
            commissionAmount = commissionValue * qty;
          }

          if (commissionAmount > 0) {
            // 5. Insert commission record
            await query(
              `INSERT INTO commissions
                 (affiliate_id, order_id, amount, commission_type, status,
                  product_id, product_name_bn, product_name_en, product_price)
               VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)`,
              [
                orderInfo.aff_id,
                insertedRow.order_id,
                commissionAmount.toFixed(2),
                commissionType,
                insertedRow.product_id,
                insertedRow.product_name_bn,
                insertedRow.product_name_en,
                insertedRow.unit_price,
              ]
            );
            // 6. Update affiliate pending and total commission counters atomically
            await query(
              `UPDATE affiliates
               SET total_commission = total_commission + $1,
                   pending_commission = pending_commission + $1,
                   total_sales = total_sales + $2,
                   updated_at = NOW()
               WHERE id = $3`,
              [commissionAmount.toFixed(2), itemTotal.toFixed(2), orderInfo.aff_id]
            );
            logger.info(
              {
                orderId: insertedRow.order_id,
                affiliateId: orderInfo.aff_id,
                amount: commissionAmount,
                commissionType,
                commissionValue,
                itemTotal,
              },
              "Commission created for affiliate order item"
            );
          } else {
            logger.debug(
              { orderId: insertedRow.order_id, affiliateId: orderInfo.aff_id, commissionType, commissionValue, itemTotal },
              "Commission amount is zero; skipping commission insert"
            );
          }
        }
      } catch (e) {
        logger.error({ err: e, orderId: insertedRow.order_id, productId: insertedRow.product_id }, "Failed to create commission for order_item");
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Post-insert loyalty points logic for orders ───────────────────────────
    if (table === "orders") {
      const orderId = insertedRow.id;
      const orderUserId = insertedRow.user_id || null;
      const pointsRedeemed = parseInt(insertedRow.points_redeemed) || 0;

      // Deduct redeemed points from user profile + record transaction
      if (orderUserId && pointsRedeemed > 0) {
        try {
          await query(
            `UPDATE profiles SET loyalty_points = GREATEST(0, loyalty_points - $1) WHERE user_id = $2`,
            [pointsRedeemed, orderUserId]
          );
          await query(
            `INSERT INTO loyalty_transactions (user_id, order_id, points, type, amount, description_bn, description_en)
             VALUES ($1, $2, $3, 'redeem', $4, $5, $6)`,
            [
              orderUserId,
              orderId,
              pointsRedeemed,
              insertedRow.points_discount_amount || 0,
              `অর্ডার ${insertedRow.order_number}-এ ${pointsRedeemed} পয়েন্ট ব্যবহার করা হয়েছে`,
              `${pointsRedeemed} points redeemed on order ${insertedRow.order_number}`,
            ]
          );
          logger.info({ orderId, userId: orderUserId, pointsRedeemed }, "Loyalty points redeemed");
        } catch (e) {
          logger.error({ err: e }, "Failed to deduct loyalty points on order");
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
  }

  invalidateTable(table);
  return res.json(inserted.length === 1 ? inserted[0] : inserted);
}

async function handleUpdate(table: string, body: any, params: Record<string, string>, userId: string | null, res: any) {
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No update data provided" });
  }

  // Remove query-param-only keys from body
  const specialKeys = new Set(["_select", "_order", "_limit", "_conflict"]);
  const updateCols = Object.keys(body).filter(k => !specialKeys.has(k));
  if (updateCols.length === 0) return res.status(400).json({ error: "No fields to update" });

  const jsonbCols = await getJsonbCols(table);
  const sets = updateCols.map((c, i) => `"${c}" = $${i + 1}`).join(", ");
  const setVals = updateCols.map(c => serializeCol(c, body[c], jsonbCols));

  const { clause, values: whereVals } = buildWhere(params, updateCols.length + 1);
  const sql = `UPDATE "${table}" SET ${sets} ${clause} RETURNING *`;
  const result = await query(sql, [...setVals, ...whereVals]);

  // When a product commission rule is updated, sync is_affiliate flag on the product
  if (table === "commission_rules" && result.rows.length > 0) {
    const rule = result.rows[0];
    if (rule.rule_type === "product" && rule.product_id) {
      const isActive = rule.is_active !== false;
      try {
        if (isActive) {
          await query(
            `UPDATE products SET is_affiliate = true, affiliate_commission_type = $1, affiliate_commission_value = $2 WHERE id = $3`,
            [rule.commission_type || "percentage", rule.commission_value || 0, rule.product_id]
          );
        } else {
          // If rule deactivated, check if no other active rules exist before removing flag
          const otherRules = await query(
            `SELECT 1 FROM commission_rules WHERE product_id = $1 AND is_active = true AND id != $2 LIMIT 1`,
            [rule.product_id, rule.id]
          );
          if (otherRules.rows.length === 0) {
            await query(
              `UPDATE products SET is_affiliate = false WHERE id = $1`,
              [rule.product_id]
            );
          }
        }
        logger.info({ productId: rule.product_id, isActive }, "Synced is_affiliate flag after commission rule update");
      } catch (e) {
        logger.warn({ err: e }, "Failed to sync is_affiliate on commission rule update");
      }
    }
  }

  // When order is marked delivered, auto-approve all pending commissions for that order
  if (table === "orders" && body.status === "delivered" && result.rows.length > 0) {
    const orderId = result.rows[0].id;
    try {
      const commResult = await query(
        `UPDATE commissions SET status = 'approved', updated_at = NOW()
         WHERE order_id = $1 AND status = 'pending' RETURNING affiliate_id, amount`,
        [orderId]
      );
      for (const comm of commResult.rows) {
        await query(
          `UPDATE affiliates
           SET pending_commission = GREATEST(0, pending_commission - $1),
               available_balance = COALESCE(available_balance, 0) + $1,
               updated_at = NOW()
           WHERE id = $2`,
          [comm.amount, comm.affiliate_id]
        );
      }
      if (commResult.rows.length > 0) {
        logger.info({ orderId, approved: commResult.rows.length }, "Auto-approved commissions on order delivery");
      }
    } catch (e) {
      logger.warn({ err: e }, "Failed to auto-approve commissions on delivery");
    }
  }

  // When affiliate is approved, send approval email
  if (table === "affiliates" && body.status === "approved" && result.rows.length > 0) {
    const affiliateRow = result.rows[0];
    const userRes = await query(
      `SELECT u.email, p.name FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = $1`,
      [affiliateRow.user_id]
    );
    if (userRes.rows.length > 0) {
      const { email, name } = userRes.rows[0];
      sendAffiliateApprovalEmail(email, name).catch(err =>
        logger.warn({ err }, "Failed to send affiliate approval email")
      );
    }
  }

  invalidateTable(table);
  return res.json(result.rows);
}

async function sendAffiliateApprovalEmail(email: string, name: string) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;
  logger.info({ email }, "Sending affiliate approval email");

  const shopUrl = process.env.APP_URL || "http://localhost";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "Rayzan Mart <rayzanmart@maxtechbd.com>",
    to: email,
    subject: "Your Rayzan Mart Affiliate Account Has Been Approved",
    text: `Hi ${name},\n\nCongratulations! Your affiliate account has been approved by our admin team.\n\nYou can now log in to your affiliate dashboard and start earning commissions.\n\nLogin here: ${shopUrl}\n\nThank you for joining the Rayzan Mart affiliate program.\n\n-- Rayzan Mart Team`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#f97316;margin-top:0">Rayzan Mart</h2>
        <h3 style="color:#1f2937">Congratulations, ${name}!</h3>
        <p style="color:#374151;line-height:1.6">Your affiliate account application has been reviewed and <strong>approved</strong> by our admin team.</p>
        <p style="color:#374151;line-height:1.6">You can now log in to your affiliate dashboard and start earning commissions by promoting our products.</p>
        <p style="margin:32px 0">
          <a href="${shopUrl}" style="display:inline-block;padding:12px 28px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold">Login to Affiliate Dashboard</a>
        </p>
        <p style="color:#6b7280;font-size:13px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">This is an automated message from Rayzan Mart. Please do not reply to this email.</p>
      </div>
    `,
  });
}

async function handleUpsert(table: string, body: any, params: Record<string, string>, userId: string | null, res: any) {
  const rows = Array.isArray(body) ? body : [body];
  const conflictCol = params["_conflict"] || "id";
  const upserted: any[] = [];
  const jsonbCols = await getJsonbCols(table);

  for (const row of rows) {
    const cols = Object.keys(row);
    if (cols.length === 0) continue;
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const colStr = cols.map(c => `"${c}"`).join(", ");
    const setStr = cols.filter(c => c !== conflictCol).map(c => `"${c}" = EXCLUDED."${c}"`).join(", ");
    const vals = cols.map(c => serializeCol(c, row[c], jsonbCols));

    const sql = `INSERT INTO "${table}" (${colStr}) VALUES (${placeholders})
                 ON CONFLICT ("${conflictCol}") DO UPDATE SET ${setStr} RETURNING *`;
    const result = await query(sql, vals);
    upserted.push(result.rows[0]);
  }

  invalidateTable(table);
  return res.json(upserted.length === 1 ? upserted[0] : upserted);
}

async function handleDelete(table: string, params: Record<string, string>, userId: string | null, res: any) {
  const { clause, values } = buildWhere(params);
  if (!clause) return res.status(400).json({ error: "DELETE requires at least one filter" });
  const sql = `DELETE FROM "${table}" ${clause} RETURNING *`;
  const result = await query(sql, values);
  invalidateTable(table);
  return res.json(result.rows);
}

export default router;
