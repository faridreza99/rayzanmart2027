import { pgTable, text, boolean, timestamp, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const affiliatesTable = pgTable("affiliates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  referralCode: text("referral_code").notNull().unique(),
  paymentMethod: text("payment_method").notNull(),
  paymentDetails: text("payment_details"),
  websiteUrl: text("website_url"),
  marketingPlan: text("marketing_plan"),
  status: text("status").default("pending"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).default("5"),
  tier: text("tier").default("bronze"),
  totalClicks: integer("total_clicks").default(0),
  totalSales: numeric("total_sales", { precision: 12, scale: 2 }).default("0"),
  totalCommission: numeric("total_commission", { precision: 12, scale: 2 }).default("0"),
  pendingCommission: numeric("pending_commission", { precision: 12, scale: 2 }).default("0"),
  paidCommission: numeric("paid_commission", { precision: 12, scale: 2 }).default("0"),
  availableBalance: numeric("available_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const affiliateCampaignsTable = pgTable("affiliate_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  url: text("url").notNull(),
  status: text("status").default("active"),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  earnings: numeric("earnings", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const commissionsTable = pgTable("commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id").notNull().references(() => affiliatesTable.id),
  orderId: uuid("order_id"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  commissionType: text("commission_type").default("percentage"),
  status: text("status").default("pending"),
  productId: uuid("product_id"),
  productNameBn: text("product_name_bn"),
  productNameEn: text("product_name_en"),
  productPrice: numeric("product_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const withdrawalsTable = pgTable("withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id").notNull().references(() => affiliatesTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull(),
  accountNumber: text("account_number").notNull(),
  status: text("status").default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const affiliatePageContentTable = pgTable("affiliate_page_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  section: text("section").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull().default('{"bn": "", "en": ""}'),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const affiliateTestimonialsTable = pgTable("affiliate_testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  roleBn: text("role_bn"),
  roleEn: text("role_en"),
  contentBn: text("content_bn").notNull(),
  contentEn: text("content_en").notNull(),
  avatarUrl: text("avatar_url"),
  rating: integer("rating").default(5),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertAffiliateSchema = createInsertSchema(affiliatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type Affiliate = typeof affiliatesTable.$inferSelect;
export type AffiliateCampaign = typeof affiliateCampaignsTable.$inferSelect;
export type Commission = typeof commissionsTable.$inferSelect;
export type Withdrawal = typeof withdrawalsTable.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
