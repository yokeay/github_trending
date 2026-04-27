import { NextRequest, NextResponse } from 'next/server';
import { setRequestLocale } from 'next-intl/server';
import { ALL_LABELS } from '@/lib/github';
import { ok } from '@/lib/api-client';

interface RouteContext {
  params: Promise<{ locale: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { locale } = await context.params;
  setRequestLocale(locale);

  const categories = Object.entries(ALL_LABELS).map(([key, label]) => ({
    key,
    label,
  }));

  return NextResponse.json(ok(categories));
}
