import { db, usersTable, userSessionsTable, profilesTable, userRolesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(userSessionsTable).values({ userId, token, expiresAt });
  return token;
}

export async function getSessionUser(token: string) {
  if (!token) return null;
  const [session] = await db
    .select()
    .from(userSessionsTable)
    .where(and(eq(userSessionsTable.token, token), gt(userSessionsTable.expiresAt, new Date())));
  if (!session) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) return null;

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));
  const roles = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, user.id));

  return { ...user, profile, roles: roles.map(r => r.role) };
}

export async function requireAuth(req: any, res: any): Promise<any> {
  const token = req.cookies?.["session"] || req.headers.authorization?.replace("Bearer ", "");
  const user = await getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

export async function requireAdmin(req: any, res: any): Promise<any> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (!user.roles.includes("admin")) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}
