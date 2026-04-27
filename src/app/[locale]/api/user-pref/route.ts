import { NextRequest, NextResponse } from 'next/server';
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { gthUserPref } from '@/lib/db/schema';
import { ok, err, ErrorCodes, httpStatus } from '@/lib/api-client';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ locale: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  setRequestLocale(locale);

  const { searchParams } = req.nextUrl;
  const idParam = searchParams.get('id');
  const userId = idParam ? Number(idParam) : 1;

  try {
    const pref = db.select().from(gthUserPref).where(eq(gthUserPref.id, userId)).get();
    if (!pref) {
      // Auto-create default
      db.insert(gthUserPref).values({ id: userId }).run();
      const created = db.select().from(gthUserPref).where(eq(gthUserPref.id, userId)).get();
      return NextResponse.json(ok(created));
    }
    return NextResponse.json(ok(pref));
  } catch (e: unknown) {
    console.error('[GTH] get user pref error:', e);
    return NextResponse.json(err(ErrorCodes.DB_ERROR, 'Failed to fetch user preferences'), {
      status: httpStatus(ErrorCodes.DB_ERROR),
    });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  setRequestLocale(locale);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(ErrorCodes.INVALID_PARAMS, 'Invalid JSON body'), {
      status: httpStatus(ErrorCodes.INVALID_PARAMS),
    });
  }

  const { id, theme, locale: loc, perPage, defaultCategory, defaultDays, autoRefresh } = body;

  const userId = id ? Number(id) : 1;

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (theme !== undefined) updates.theme = theme;
  if (loc !== undefined) updates.locale = loc;
  if (perPage !== undefined) updates.perPage = Number(perPage);
  if (defaultCategory !== undefined) updates.defaultCategory = defaultCategory;
  if (defaultDays !== undefined) updates.defaultDays = Number(defaultDays);
  if (autoRefresh !== undefined) updates.autoRefresh = autoRefresh;

  try {
    const existing = db.select().from(gthUserPref).where(eq(gthUserPref.id, userId)).get();
    if (!existing) {
      db.insert(gthUserPref)
        .values({ id: userId, ...updates })
        .run();
    } else {
      db.update(gthUserPref)
        .set(
          updates as {
            theme?: string;
            locale?: string;
            perPage?: number;
            defaultCategory?: string;
            defaultDays?: number;
            autoRefresh?: boolean;
            updatedAt: number;
          }
        )
        .where(eq(gthUserPref.id, userId))
        .run();
    }
    const updated = db.select().from(gthUserPref).where(eq(gthUserPref.id, userId)).get();
    return NextResponse.json(ok(updated));
  } catch (e: unknown) {
    console.error('[GTH] update user pref error:', e);
    return NextResponse.json(err(ErrorCodes.DB_ERROR, 'Failed to update user preferences'), {
      status: httpStatus(ErrorCodes.DB_ERROR),
    });
  }
}
