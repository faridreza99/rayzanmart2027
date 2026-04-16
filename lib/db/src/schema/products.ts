import { pgTable, text, boolean, timestamp, uuid, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  parentId: uuid("parent_id"),
  slug: text("slug"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  visibleOnWebsite: boolean("visible_on_website").default(true),
  visibleInSearch: boolean("visible_in_search").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const brandsTable = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  visibleOnWebsite: boolean("visible_on_website").default(true),
  visibleInSearch: boolean("visible_in_search").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionBn: text("description_bn"),
  descriptionEn: text("description_en"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  originalPrice: numeric("original_price", { precision: 12, scale: 2 }),
  imageUrl: text("image_url"),
  galleryImages: jsonb("gallery_images").default([]),
  categoryId: uuid("category_id").references(() => categoriesTable.id),
  brandId: uuid("brand_id").references(() => brandsTable.id),
  brand: text("brand"),
  stock: integer("stock").default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  reviewsCount: integer("reviews_count").default(0),
  isFeatured: boolean("is_featured").default(false),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountType: text("discount_type"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true),
  sku: text("sku"),
  hasVariants: boolean("has_variants").default(false),
  variantOptions: jsonb("variant_options"),
  affiliateCommissionType: text("affiliate_commission_type"),
  affiliateCommissionValue: numeric("affiliate_commission_value", { precision: 10, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  isAffiliate: boolean("is_affiliate").default(false),
  productStatus: text("product_status").notNull().default("active"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  visibleOnWebsite: boolean("visible_on_website").default(true).notNull(),
  visibleInSearch: boolean("visible_in_search").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const productVariantsTable = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  nameEn: text("name_en").notNull(),
  nameBn: text("name_bn").notNull(),
  sku: text("sku"),
  price: numeric("price", { precision: 12, scale: 2 }),
  stock: integer("stock").default(0),
  attributes: jsonb("attributes").default({}),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const productReviewsTable = pgTable("product_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id"),
  orderId: uuid("order_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const wishlistTable = pgTable("wishlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBrandSchema = createInsertSchema(brandsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Product = typeof productsTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Brand = typeof brandsTable.$inferSelect;
export type ProductVariant = typeof productVariantsTable.$inferSelect;
export type ProductReview = typeof productReviewsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
