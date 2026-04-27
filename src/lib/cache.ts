// ── SQLite 缓存层 ───────────────────────────────────────────────
// 替代原 server.js 中的内存 Map 缓存

import { db } from './db';
import { gthCache } from './db/schema';
import { eq, lt } from 'drizzle-orm';

const DEFAULT_TTL = Number(process.env.CACHE_TTL) || 5 * 60 * 1000;

export function getCached(key: string): unknown | null {
  try {
    const entry = db.select().from(gthCache).where(eq(gthCache.key, key)).get();

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      // Auto-evict expired
      db.delete(gthCache).where(eq(gthCache.key, key)).run();
      return null;
    }

    return JSON.parse(entry.data);
  } catch {
    return null;
  }
}

export function setCache(key: string, data: unknown, ttl = DEFAULT_TTL): void {
  try {
    const expiresAt = Date.now() + ttl;
    const dataStr = JSON.stringify(data);

    // Upsert
    const existing = db.select().from(gthCache).where(eq(gthCache.key, key)).get();

    if (existing) {
      db.update(gthCache).set({ data: dataStr, expiresAt }).where(eq(gthCache.key, key)).run();
    } else {
      db.insert(gthCache).values({ key, data: dataStr, expiresAt }).run();
    }
  } catch {
    // Cache write failure — non-fatal
  }
}

export function deleteCache(key: string): void {
  try {
    db.delete(gthCache).where(eq(gthCache.key, key)).run();
  } catch {
    // Non-fatal
  }
}

export function clearExpiredCache(): void {
  try {
    db.delete(gthCache).where(lt(gthCache.expiresAt, Date.now())).run();
  } catch {
    // Non-fatal
  }
}
