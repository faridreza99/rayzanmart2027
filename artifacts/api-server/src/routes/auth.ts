import { Router } from "express";
import { db, usersTable, profilesTable, userRolesTable, userSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, createSession, requireAuth } from "../lib/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name, phone } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ email, passwordHash }).returning();

  await db.insert(profilesTable).values({ userId: user.id, name, email, phone: phone ?? null });
  await db.insert(userRolesTable).values({ userId: user.id, role: "customer" });

  const token = await createSession(user.id);
  res.cookie("session", token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));
  res.status(201).json({ user: { id: user.id, email: user.email, profile, roles: ["customer"] }, token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = await createSession(user.id);
  res.cookie("session", token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));
  const roles = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, user.id));

  res.json({ user: { id: user.id, email: user.email, profile, roles: roles.map(r => r.role) }, token });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.["session"] || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    await db.delete(userSessionsTable).where(eq(userSessionsTable.token, token));
  }
  res.clearCookie("session");
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  res.json({ id: user.id, email: user.email, profile: user.profile, roles: user.roles });
});

export default router;
