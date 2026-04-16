import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "rayzan-mart-secret-key-change-in-production";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    (req as any).userId = null;
    return next();
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    (req as any).userId = null;
    return next();
  }
  (req as any).userId = payload.userId;
  (req as any).userEmail = payload.email;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { query } = await import("../lib/db-pool.js");
  const result = await query("SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1", [userId]);
  if (result.rows.length === 0) return res.status(403).json({ error: "Forbidden" });
  next();
}
