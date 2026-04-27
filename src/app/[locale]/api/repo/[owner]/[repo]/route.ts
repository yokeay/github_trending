import { NextRequest, NextResponse } from 'next/server';
import { setRequestLocale } from 'next-intl/server';
import { getRepoDetail, getRepoReadme, mapRepo } from '@/lib/github';
import { getCached, setCache } from '@/lib/cache';
import { ok, err, ErrorCodes, httpStatus } from '@/lib/api-client';

interface RouteContext {
  params: Promise<{ locale: string; owner: string; repo: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { locale, owner, repo } = await context.params;
  setRequestLocale(locale);

  if (!owner || !repo) {
    return NextResponse.json(err(ErrorCodes.INVALID_PARAMS, 'owner and repo are required'), {
      status: httpStatus(ErrorCodes.INVALID_PARAMS),
    });
  }

  const cacheKey = `gth_repo:${owner}:${repo}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(ok(cached));
  }

  try {
    const [detailResult, readmeResult] = await Promise.allSettled([
      getRepoDetail(owner, repo),
      getRepoReadme(owner, repo),
    ]);

    let repoData = null;
    let rateLimit = { remaining: '0', limit: '0', reset: '0' };

    if (detailResult?.status === 'fulfilled') {
      repoData = mapRepo(detailResult.value.data);
      rateLimit = detailResult.value.rateLimit;
    }

    const payload = {
      repo: repoData,
      readme: readmeResult?.status === 'fulfilled' ? readmeResult.value.content : null,
      rateLimit,
    };

    if (repoData) {
      setCache(cacheKey, payload);
    }

    return NextResponse.json(ok(payload));
  } catch (e: unknown) {
    const githubErr = e as { status?: number; message?: string };
    console.error('[GTH] getRepoDetail error:', githubErr);

    const status = githubErr.status || 500;
    if (status === 404) {
      return NextResponse.json(
        err(ErrorCodes.RESOURCE_NOT_FOUND, `Repository not found: ${owner}/${repo}`),
        { status: 404 }
      );
    }
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
