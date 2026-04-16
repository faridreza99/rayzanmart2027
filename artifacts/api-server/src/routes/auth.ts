import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../lib/db-pool.js";
import { generateToken, verifyToken, authMiddleware, requireAuth } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, and name are required" });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "User already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Always auto-confirm — no email verification step required
    const userResult = await query(
      `INSERT INTO users (email, password_hash, email_confirmed, verification_token, verification_token_expires)
       VALUES ($1, $2, TRUE, NULL, NULL) RETURNING id, email, email_confirmed`,
      [email.toLowerCase(), hash]
    );
    const user = userResult.rows[0];

    // Create profile
    await query(
      "INSERT INTO profiles (user_id, name, email, phone) VALUES ($1, $2, $3, $4)",
      [user.id, name, email.toLowerCase(), phone || null]
    );

    // Affiliate registration flow
    if (role === "affiliate") {
      // Assign both customer and affiliate roles
      await query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'customer') ON CONFLICT DO NOTHING", [user.id]);
      await query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'affiliate') ON CONFLICT DO NOTHING", [user.id]);

      // Generate unique referral code
      const referralCode = `AFF${Date.now().toString(36).toUpperCase()}`;

      // Create affiliate record with pending status
      await query(
        `INSERT INTO affiliates (user_id, referral_code, payment_method, status)
         VALUES ($1, $2, 'bank_transfer', 'pending')`,
        [user.id, referralCode]
      );

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, name).catch(err => logger.warn({ err }, "Failed to send welcome email"));

      // Do NOT issue session — user must wait for admin approval
      return res.status(201).json({
        affiliate_pending: true,
        user: { id: user.id, email: user.email },
        message: "Your affiliate application has been submitted and is pending admin approval. You will receive an email once approved.",
      });
    }

    // Normal customer registration
    await query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'customer') ON CONFLICT DO NOTHING",
      [user.id]
    );

    // Send welcome email (blocking so errors are logged)
    try {
      await sendWelcomeEmail(email, name);
    } catch (err) {
      logger.warn({ err }, "Failed to send welcome email");
    }

    // Auto-login: return a JWT token so user is immediately logged in
    const token = generateToken(user.id, user.email);
    res.status(201).json({
      user: { id: user.id, email: user.email, email_confirmed: true },
      session: { access_token: token, user: { id: user.id, email: user.email, email_confirmed: true } },
      message: "Account created successfully.",
    });
  } catch (err: any) {
    logger.error({ err }, "register error");
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const result = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }
    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid login credentials" });

    if (!user.email_confirmed) {
      return res.status(401).json({ error: "Email not confirmed" });
    }

    // Check if blocked
    const profileRes = await query("SELECT is_blocked FROM profiles WHERE user_id = $1", [user.id]);
    if (profileRes.rows[0]?.is_blocked) {
      return res.status(403).json({ error: "Account is blocked" });
    }

    // Check affiliate status — block login if pending or rejected
    const rolesRes = await query("SELECT role FROM user_roles WHERE user_id = $1", [user.id]);
    const roles = rolesRes.rows.map((r: any) => r.role);
    if (roles.includes("affiliate")) {
      const affRes = await query("SELECT status FROM affiliates WHERE user_id = $1", [user.id]);
      const affStatus = affRes.rows[0]?.status;
      if (affStatus === "pending") {
        return res.status(403).json({ error: "AFFILIATE_PENDING" });
      }
      if (affStatus === "rejected") {
        return res.status(403).json({ error: "AFFILIATE_REJECTED" });
      }
    }

    const token = generateToken(user.id, user.email);
    // Record login event for user report module (non-blocking)
    query(
      "INSERT INTO user_login_logs (user_id, event_type, ip_address, user_agent) VALUES ($1, 'login', $2, $3)",
      [user.id, req.ip || null, req.headers["user-agent"] || null]
    ).catch(() => {});
    res.json({
      session: {
        user: { id: user.id, email: user.email, email_confirmed: user.email_confirmed },
        access_token: token,
      },
    });
  } catch (err: any) {
    logger.error({ err }, "login error");
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/logout
router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

// GET /auth/me — returns current user info from token
router.get("/auth/me", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await query(
      `SELECT u.id, u.email, u.email_confirmed,
              p.name, p.phone, p.avatar_url, p.address, p.city, p.district,
              p.is_blocked, p.loyalty_points
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const u = result.rows[0];

    const rolesRes = await query("SELECT role FROM user_roles WHERE user_id = $1", [userId]);
    const roles = rolesRes.rows.map((r: any) => r.role);

    res.json({ id: u.id, email: u.email, email_confirmed: u.email_confirmed, name: u.name, phone: u.phone, avatar_url: u.avatar_url, address: u.address, city: u.city, district: u.district, is_blocked: u.is_blocked, loyalty_points: u.loyalty_points, roles });
  } catch (err: any) {
    logger.error({ err }, "me error");
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/resend-verification
router.post("/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query("SELECT * FROM users WHERE email = $1", [email?.toLowerCase()]);
    if (result.rows.length === 0) return res.json({ message: "If that email exists, a verification link was sent." });
    const user = result.rows[0];
    if (user.email_confirmed) return res.json({ message: "Email already confirmed" });

    const token = uuidv4();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query("UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3", [token, expiry, user.id]);

    sendVerificationEmail(email, token).catch(err => logger.warn({ err }, "resend email failed"));
    res.json({ message: "Verification email sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/admin/confirm-email — admin manually confirms a user's email
router.post("/auth/admin/confirm-email", requireAuth, async (req, res) => {
  try {
    const adminId = (req as any).userId;
    const adminRoles = await query("SELECT role FROM user_roles WHERE user_id = $1", [adminId]);
    const isAdmin = adminRoles.rows.some((r: any) => r.role === "admin");
    if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });

    const result = await query(
      "UPDATE users SET email_confirmed = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE email = $1 RETURNING id, email, email_confirmed",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    logger.info({ email, adminId }, "Admin manually confirmed email");
    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/admin/resend-verification — admin resends verification email to a user
router.post("/auth/admin/resend-verification", requireAuth, async (req, res) => {
  try {
    const adminId = (req as any).userId;
    const adminRoles = await query("SELECT role FROM user_roles WHERE user_id = $1", [adminId]);
    const isAdmin = adminRoles.rows.some((r: any) => r.role === "admin");
    if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });

    const userRes = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userRes.rows[0];
    if (user.email_confirmed) return res.json({ message: "Email already confirmed" });

    const token = uuidv4();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query("UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3", [token, expiry, user.id]);
    sendVerificationEmail(email, token).catch(err => logger.warn({ err }, "admin resend email failed"));
    res.json({ success: true, message: "Verification email sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/admin/users-email-status — get all users with email_confirmed status (admin only)
router.get("/auth/admin/users-email-status", requireAuth, async (req, res) => {
  try {
    const adminId = (req as any).userId;
    const adminRoles = await query("SELECT role FROM user_roles WHERE user_id = $1", [adminId]);
    const isAdmin = adminRoles.rows.some((r: any) => r.role === "admin");
    if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

    const result = await query("SELECT id as user_id, email, email_confirmed FROM users ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/verify-email?token=xxx
router.get("/auth/verify-email", async (req, res) => {
  const appUrl = process.env.APP_URL || "";
  try {
    const { token } = req.query as { token: string };
    if (!token) {
      return res.redirect(`${appUrl}/login?verified=error&reason=missing_token`);
    }
    const result = await query(
      "SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()",
      [token]
    );
    if (result.rows.length === 0) {
      return res.redirect(`${appUrl}/login?verified=error&reason=invalid_or_expired`);
    }
    await query("UPDATE users SET email_confirmed = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1", [result.rows[0].id]);
    return res.redirect(`${appUrl}/login?verified=success`);
  } catch (err: any) {
    logger.error({ err }, "verify-email error");
    return res.redirect(`${appUrl}/login?verified=error&reason=server_error`);
  }
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query("SELECT * FROM users WHERE email = $1", [email?.toLowerCase()]);
    if (result.rows.length === 0) return res.json({ message: "If that email exists, a reset link was sent." });
    const user = result.rows[0];

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await query("UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3", [token, expiry, user.id]);

    sendPasswordResetEmail(email, token).catch(err => logger.warn({ err }, "password reset email failed"));
    res.json({ message: "Password reset email sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "token and password required" });

    const result = await query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: "Invalid or expired reset token" });

    const hash = await bcrypt.hash(password, 10);
    await query("UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2", [hash, result.rows[0].id]);
    res.json({ message: "Password updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /auth/update-password
router.put("/auth/update-password", authMiddleware, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "password required" });

    const hash = await bcrypt.hash(password, 10);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
    res.json({ message: "Password updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /auth/update-email — update current user's email
router.put("/auth/update-email", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    const existing = await query("SELECT id FROM users WHERE email = $1 AND id != $2", [email.toLowerCase(), userId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use by another account" });
    }
    await query("UPDATE users SET email = $1 WHERE id = $2", [email.toLowerCase(), userId]);
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "update-email error");
    res.status(500).json({ error: err.message });
  }
});

// PUT /auth/update-profile — update current user's name and/or avatar
router.put("/auth/update-profile", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { name, avatar_url } = req.body;
    if (!name && avatar_url === undefined) {
      return res.status(400).json({ error: "name or avatar_url required" });
    }
    const sets: string[] = [];
    const vals: any[] = [];
    if (name) { vals.push(name); sets.push(`name = $${vals.length}`); }
    if (avatar_url !== undefined) { vals.push(avatar_url || null); sets.push(`avatar_url = $${vals.length}`); }
    vals.push(userId);
    await query(`UPDATE profiles SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = $${vals.length}`, vals);
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "update-profile error");
    res.status(500).json({ error: err.message });
  }
});

// PUT /auth/change-password — change password (requires current password)
router.put("/auth/change-password", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "current_password and new_password required" });
    }
    const result = await query("SELECT password_hash FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(new_password, 10);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err: any) {
    logger.error({ err }, "change-password error");
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/approve-affiliate — admin approves an affiliate application
router.post("/auth/approve-affiliate", authMiddleware, requireAuth, async (req, res) => {
  try {
    const adminId = (req as any).userId;
    const { affiliate_id } = req.body;
    if (!affiliate_id) return res.status(400).json({ error: "affiliate_id required" });

    // Verify caller is admin
    const adminCheck = await query("SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin'", [adminId]);
    if (adminCheck.rows.length === 0) return res.status(403).json({ error: "Admin access required" });

    // Fetch affiliate + user info
    const result = await query(
      `SELECT a.id, a.referral_code, a.user_id, a.status,
              p.name AS profile_name, p.email AS profile_email,
              u.email AS user_email
       FROM affiliates a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN profiles p ON p.user_id = a.user_id
       WHERE a.id = $1`,
      [affiliate_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Affiliate not found" });

    const aff = result.rows[0];

    // Update affiliate status to active
    await query("UPDATE affiliates SET status = 'active', updated_at = NOW() WHERE id = $1", [affiliate_id]);

    // Assign affiliate role (safe — ON CONFLICT DO NOTHING)
    await query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'affiliate') ON CONFLICT DO NOTHING",
      [aff.user_id]
    );

    // Send approval email (non-blocking)
    const email = aff.profile_email || aff.user_email;
    const name = aff.profile_name || "Affiliate";
    sendAffiliateApprovalEmail(email, name, aff.referral_code).catch((err: any) =>
      logger.warn({ err }, "Failed to send affiliate approval email")
    );

    logger.info({ affiliate_id, user_id: aff.user_id }, "Affiliate approved");
    res.json({ success: true, message: "Affiliate approved and email sent." });
  } catch (err: any) {
    logger.error({ err }, "approve-affiliate error");
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/order-delivered — admin marks order as delivered + sends email
router.post("/auth/order-delivered", authMiddleware, requireAuth, async (req, res) => {
  try {
    const adminId = (req as any).userId;
    const { order_id, tracking_number, courier } = req.body;
    if (!order_id) return res.status(400).json({ error: "order_id required" });

    // Verify caller is admin
    const adminCheck = await query("SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin'", [adminId]);
    if (adminCheck.rows.length === 0) return res.status(403).json({ error: "Admin access required" });

    // Fetch order + buyer info
    const orderResult = await query(
      `SELECT o.id, o.order_number, o.total, o.status, o.user_id,
              o.points_earned, o.points_redeemed,
              u.email AS user_email, p.name AS customer_name, p.email AS profile_email
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN profiles p ON p.user_id = o.user_id
       WHERE o.id = $1`,
      [order_id]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: "Order not found" });

    const order = orderResult.rows[0];

    // Prevent double-crediting if already delivered
    if (order.status === "delivered") {
      return res.json({ success: true, message: "Order already marked as delivered." });
    }

    // Build update
    const updates: string[] = ["status = 'delivered'", "updated_at = NOW()"];
    const vals: any[] = [];
    if (tracking_number) { vals.push(tracking_number); updates.push(`tracking_number = $${vals.length}`); }
    if (courier) { vals.push(courier); updates.push(`courier = $${vals.length}`); }
    vals.push(order_id);
    await query(`UPDATE orders SET ${updates.join(", ")} WHERE id = $${vals.length}`, vals);

    // Credit loyalty points to user on delivery
    const pointsEarned = parseInt(order.points_earned) || 0;
    const orderUserId = order.user_id;
    if (orderUserId && pointsEarned > 0) {
      try {
        // Get loyalty rules for expiry
        const loyaltyResult = await query(
          `SELECT setting_value FROM site_settings WHERE setting_key = 'loyalty_rules' LIMIT 1`
        );
        const rules = loyaltyResult.rows[0]?.setting_value || {};
        const validityDays = rules.points_validity_days || 365;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + validityDays);

        await query(
          `UPDATE profiles SET loyalty_points = loyalty_points + $1 WHERE user_id = $2`,
          [pointsEarned, orderUserId]
        );
        await query(
          `INSERT INTO loyalty_transactions (user_id, order_id, points, type, amount, description_bn, description_en, expires_at)
           VALUES ($1, $2, $3, 'earn', $4, $5, $6, $7)`,
          [
            orderUserId,
            order_id,
            pointsEarned,
            order.total,
            `অর্ডার ${order.order_number} ডেলিভারি সম্পন্ন - ${pointsEarned} পয়েন্ট অর্জিত`,
            `Order ${order.order_number} delivered - ${pointsEarned} points earned`,
            expiresAt.toISOString(),
          ]
        );
        logger.info({ order_id, userId: orderUserId, pointsEarned }, "Loyalty points credited on delivery");
      } catch (e) {
        logger.error({ err: e }, "Failed to credit loyalty points on delivery");
      }
    }

    // Send delivery email (non-blocking)
    const buyerEmail = order.profile_email || order.user_email;
    const buyerName = order.customer_name || "Customer";
    if (buyerEmail) {
      sendOrderDeliveredEmail(buyerEmail, buyerName, order.order_number, order.total).catch((err: any) =>
        logger.warn({ err }, "Failed to send delivery email")
      );
    }

    logger.info({ order_id, buyer: buyerEmail, pointsEarned }, "Order marked delivered");
    res.json({ success: true, message: "Order marked as delivered and notification sent.", points_earned: pointsEarned });
  } catch (err: any) {
    logger.error({ err }, "order-delivered error");
    res.status(500).json({ error: err.message });
  }
});

// Welcome email after registration (no verification needed)
async function sendWelcomeEmail(email: string, name: string) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;
  logger.info({ email }, "Sending welcome email");

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
    subject: "Your Rayzan Mart account is ready",
    text: `Hi ${name},\n\nYour account has been created successfully.\n\nYou can now log in and start shopping at: ${shopUrl}\n\nThank you for joining Rayzan Mart.\n\n-- Rayzan Mart Team`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#f97316;margin-top:0">Rayzan Mart</h2>
        <h3 style="color:#1f2937">Hi ${name}, your account is ready!</h3>
        <p style="color:#374151;line-height:1.6">Your account has been created successfully. You can now log in and start shopping.</p>
        <p style="margin:32px 0">
          <a href="${shopUrl}" style="display:inline-block;padding:12px 28px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold">Start Shopping</a>
        </p>
        <p style="color:#6b7280;font-size:13px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">This is an automated message from Rayzan Mart. Please do not reply to this email.</p>
      </div>
    `,
  });
}

// Email helpers (uses nodemailer if SMTP configured, otherwise logs token)
async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.APP_URL || "http://localhost"}/api/auth/verify-email?token=${token}`;
  logger.info({ email, verifyUrl }, "Verification email");

  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

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
    from: process.env.SMTP_FROM || "Rayzan Mart <noreply@rayzanmart.com>",
    to: email,
    subject: "Verify your email - Rayzan Mart",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#f97316;font-size:28px;margin:0">Rayzan Mart</h1>
          <p style="color:#666;margin:4px 0">রায়জান মার্ট</p>
        </div>
        <h2 style="color:#1f2937;font-size:20px">Verify your email address</h2>
        <p style="color:#374151">Thank you for registering! Please verify your email by clicking the button below:</p>
        <p style="color:#374151">ধন্যবাদ! নিচের বাটনে ক্লিক করে আপনার ইমেইল যাচাই করুন:</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">Verify Email / ইমেইল যাচাই করুন</a>
        </div>
        <p style="color:#6b7280;font-size:13px">If the button doesn't work, copy this link:<br><a href="${verifyUrl}" style="color:#f97316;word-break:break-all">${verifyUrl}</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.APP_URL || "http://localhost"}/reset-password?token=${token}`;
  logger.info({ email, resetUrl }, "Password reset email");

  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

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
    from: process.env.SMTP_FROM || "Rayzan Mart <noreply@rayzanmart.com>",
    to: email,
    subject: "পাসওয়ার্ড রিসেট — রায়জান মার্ট",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#f97316">রায়জান মার্ট</h2>
        <p>আপনার পাসওয়ার্ড রিসেট করতে নিচের বাটনে ক্লিক করুন:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">পাসওয়ার্ড রিসেট করুন</a>
        <p style="margin-top:16px;color:#666">অথবা এই লিংকটি কপি করুন: <a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color:#999;font-size:12px">এই লিংকটি ১ ঘণ্টা পর মেয়াদ শেষ হবে।</p>
      </div>
    `,
  });
}

async function sendAffiliateApprovalEmail(email: string, name: string, referralCode: string) {
  const dashboardUrl = `${process.env.APP_URL || "http://localhost"}/affiliate`;
  logger.info({ email, referralCode }, "Affiliate approval email");

  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

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
    from: process.env.SMTP_FROM || "Rayzan Mart <noreply@rayzanmart.com>",
    to: email,
    subject: "🎉 অভিনন্দন! আপনার Affiliate আবেদন অনুমোদিত হয়েছে — রায়জান মার্ট",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#f97316">রায়জান মার্ট</h2>
        <h3>🎉 অভিনন্দন, ${name}!</h3>
        <p>আপনার Affiliate আবেদন সফলভাবে অনুমোদিত হয়েছে।</p>
        <p><strong>আপনার Referral Code:</strong> <span style="font-family:monospace;background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:18px;color:#f97316">${referralCode}</span></p>
        <p>এখন আপনি Affiliate Dashboard-এ লগইন করে আপনার রেফারেল লিংক শেয়ার করতে এবং কমিশন আয় করতে পারবেন।</p>
        <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px">Affiliate Dashboard খুলুন</a>
        <p style="margin-top:24px;color:#999;font-size:12px">এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। উত্তর দেওয়ার প্রয়োজন নেই।</p>
      </div>
    `,
  });
}

async function sendOrderDeliveredEmail(email: string, name: string, orderNumber: string, totalAmount: number) {
  const dashboardUrl = `${process.env.APP_URL || "http://localhost"}/dashboard/orders`;
  logger.info({ email, orderNumber }, "Order delivered email");

  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

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
    from: process.env.SMTP_FROM || "Rayzan Mart <noreply@rayzanmart.com>",
    to: email,
    subject: "✅ আপনার পণ্য ডেলিভার হয়েছে — রায়জান মার্ট",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#f97316">রায়জান মার্ট</h2>
        <h3>✅ ${name}, আপনার পণ্য পৌঁছে গেছে!</h3>
        <p>আপনার অর্ডার <strong style="color:#f97316">#${orderNumber}</strong> সফলভাবে ডেলিভার হয়েছে।</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;font-weight:bold">অর্ডার নম্বর</td>
            <td style="padding:8px 12px">#${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:bold">মোট পরিমাণ</td>
            <td style="padding:8px 12px">৳${Number(totalAmount).toLocaleString()}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;font-weight:bold">স্ট্যাটাস</td>
            <td style="padding:8px 12px;color:#16a34a;font-weight:bold">ডেলিভার করা হয়েছে ✅</td>
          </tr>
        </table>
        <p>পণ্যটি পেয়ে সন্তুষ্ট হলে একটি রিভিউ দিন — এটি আমাদের আরও ভালো করতে সাহায্য করবে।</p>
        <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px">আমার অর্ডার দেখুন</a>
        <p style="margin-top:24px;color:#999;font-size:12px">এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। উত্তর দেওয়ার প্রয়োজন নেই।</p>
      </div>
    `,
  });
}

export default router;
