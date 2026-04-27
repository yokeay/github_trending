import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ── Cache ──────────────────────────────────────────────────────
export const gthCache = sqliteTable("gth_cache", {
  key: text("key").primaryKey(),
  data: text("data").notNull(), // JSON string
  expiresAt: integer("expires_at").notNull(), // Unix timestamp (ms)
});

// ── Bookmarks ──────────────────────────────────────────────────
export const gthBookmark = sqliteTable("gth_bookmark", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  language: text("language"),
  stargazersCount: integer("stargazers_count").notNull().default(0),
  avatarUrl: text("avatar_url").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

// ── Audit Log ─────────────────────────────────────────────────
export const gthAuditLog = sqliteTable("gth_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(), // query, view_detail, bookmark, unbookmark
  category: text("category"), // for query actions
  owner: text("owner"),      // for view_detail/bookmark actions
  repo: text("repo"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

// ── User Preferences ──────────────────────────────────────────
export const gthUserPref = sqliteTable("gth_user_pref", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  theme: text("theme").notNull().default("system"),
  locale: text("locale").notNull().default("zh"),
  perPage: integer("per_page").notNull().default(30),
  defaultCategory: text("default_category").notNull().default("trending"),
  defaultDays: integer("default_days").notNull().default(7),
  autoRefresh: integer("auto_refresh", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
});

// Types
export type GthCache = typeof gthCache.$inferSelect;
export type GthBookmark = typeof gthBookmark.$inferSelect;
export type GthAuditLog = typeof gthAuditLog.$inferSelect;
export type GthUserPref = typeof gthUserPref.$inferSelect;
