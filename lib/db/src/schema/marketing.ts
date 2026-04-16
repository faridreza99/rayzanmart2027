import { pgTable, text, boolean, timestamp, uuid, integer, numeric } from "drizzle-orm/pg-core";

export const heroBannersTable = pgTable("hero_banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  titleBn: text("title_bn").notNull(),
  titleEn: text("title_en").notNull(),
  subtitleBn: text("subtitle_bn"),
  subtitleEn: text("subtitle_en"),
  link: text("link"),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const couponsTable = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const siteSettingsTable = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const faqItemsTable = pgTable("faq_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionBn: text("question_bn").notNull(),
  questionEn: text("question_en").notNull(),
  answerBn: text("answer_bn").notNull(),
  answerEn: text("answer_en").notNull(),
  category: text("category"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type HeroBanner = typeof heroBannersTable.$inferSelect;
export type Coupon = typeof couponsTable.$inferSelect;
export type SiteSetting = typeof siteSettingsTable.$inferSelect;
