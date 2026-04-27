import { NextRequest, NextResponse } from 'next/server';
import { setRequestLocale } from 'next-intl/server';
import { searchRepos, mapRepo, SIMPLE_CATEGORIES, MULTI_CATEGORIES } from '@/lib/github';
import { getCached, setCache } from '@/lib/cache';
import { ok, err, ErrorCodes, httpStatus } from '@/lib/api-client';
import { db } from '@/lib/db';
import { gthAuditLog } from '@/lib/db/schema';

interface RouteContext {
  params: Promise<{ locale: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  setRequestLocale(locale);

  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category') || 'trending';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const per_page = Math.min(100, Math.max(1, Number(searchParams.get('per_page')) || 30));
  const days = Math.min(365, Math.max(1, Number(searchParams.get('days')) || 7));
  const search = searchParams.get('search') || '';

  // ── 参数校验 ──
  const validCategories = [...Object.keys(SIMPLE_CATEGORIES), ...Object.keys(MULTI_CATEGORIES)];
  if (!validCategories.includes(category)) {
    return NextResponse.json(err(ErrorCodes.CATEGORY_NOT_FOUND, `Unknown category: ${category}`), {
      status: httpStatus(ErrorCodes.CATEGORY_NOT_FOUND),
    });
  }

  // ── 缓存检查 ──
  const cacheKey = `gth_repos:${category}:${days}:${search}:${page}:${per_page}`;
  const cached = getCached(cacheKey);
  if (cached) {
    // 记录查询审计日志（仅在非缓存命中时）
    return NextResponse.json(ok(cached));
  }

  try {
    const result = await searchRepos({ category, page, per_page, days, search });

    const payload = {
      total_count: result.data.total_count,
      items: result.data.items.map(mapRepo),
      rateLimit: result.rateLimit,
    };

    setCache(cacheKey, payload);

    return NextResponse.json(ok(payload));
  } catch (e: unknown) {
    const githubErr = e as { status?: number; message?: string };
    console.error('[GTH] searchRepos error:', githubErr);

    // 审计日志
    try {
      db.insert(gthAuditLog)
        .values({
          action: 'query_error',
          category,
          createdAt: Date.now(),
        })
        .run();
    } catch {
      // Non-fatal
    }

    const status = githubErr.status || 500;
    if (status === 403 || status === 429) {
      return NextResponse.json(
        err(ErrorCodes.RATE_LIMITED, githubErr.message || 'Rate limit exceeded'),
        { status: 429 }
      );
    }

    return NextResponse.json(
      err(ErrorCodes.GITHUB_API_ERROR, githubErr.message || 'GitHub API error'),
      { status: httpStatus(ErrorCodes.GITHUB_API_ERROR) }
    );
  }
}
