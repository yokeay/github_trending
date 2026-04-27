import { NextRequest, NextResponse } from 'next/server';
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { gthBookmark } from '@/lib/db/schema';
import { ok, err, ErrorCodes, httpStatus } from '@/lib/api-client';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ locale: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  setRequestLocale(locale);

  try {
    const bookmarks = db.select().from(gthBookmark).orderBy(gthBookmark.createdAt).all();
    return NextResponse.json(ok(bookmarks));
  } catch (e: unknown) {
    console.error('[GTH] get bookmarks error:', e);
    return NextResponse.json(err(ErrorCodes.DB_ERROR, 'Failed to fetch bookmarks'), {
      status: httpStatus(ErrorCodes.DB_ERROR),
    });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  setRequestLocale(locale);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(ErrorCodes.INVALID_PARAMS, 'Invalid JSON body'), {
      status: httpStatus(ErrorCodes.INVALID_PARAMS),
    });
  }

  const { owner, repo, fullName, description, language, stargazersCount, avatarUrl } =
    body as Record<string, unknown>;

  if (!owner || !repo || !fullName || !avatarUrl) {
    return NextResponse.json(
      err(ErrorCodes.INVALID_PARAMS, 'owner, repo, fullName and avatarUrl are required'),
      { status: httpStatus(ErrorCodes.INVALID_PARAMS) }
    );
  }

  try {
    const existing = db
      .select()
      .from(gthBookmark)
      .where(eq(gthBookmark.owner, owner as string))
      .all()
      .find(b => b.repo === repo);

    if (existing) {
      return NextResponse.json(err(ErrorCodes.INVALID_PARAMS, 'Bookmark already exists'), {
        status: httpStatus(ErrorCodes.INVALID_PARAMS),
      });
    }

    db.insert(gthBookmark)
      .values({
        owner: owner as string,
        repo: repo as string,
        fullName: fullName as string,
        description: (description as string | null) ?? null,
        language: (language as string | null) ?? null,
        stargazersCount: (stargazersCount as number) || 0,
        avatarUrl: avatarUrl as string,
      })
      .run();

    return NextResponse.json(ok({ success: true }), { status: 201 });
  } catch (e: unknown) {
    console.error('[GTH] add bookmark error:', e);
    return NextResponse.json(err(ErrorCodes.DB_ERROR, 'Failed to add bookmark'), {
      status: httpStatus(ErrorCodes.DB_ERROR),
    });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  setRequestLocale(locale);

  const { searchParams } = req.nextUrl;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json(err(ErrorCodes.INVALID_PARAMS, 'owner and repo are required'), {
      status: httpStatus(ErrorCodes.INVALID_PARAMS),
    });
  }

  try {
    db.delete(gthBookmark).where(eq(gthBookmark.owner, owner)).run();
    return NextResponse.json(ok({ success: true }));
  } catch (e: unknown) {
    console.error('[GTH] delete bookmark error:', e);
    return NextResponse.json(err(ErrorCodes.DB_ERROR, 'Failed to delete bookmark'), {
      status: httpStatus(ErrorCodes.DB_ERROR),
    });
  }
}
