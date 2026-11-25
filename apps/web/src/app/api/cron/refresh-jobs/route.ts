import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Daily Vercel cron: refetches every job board once and saves the shared
 * snapshot, so users rarely wait on the ~40 boards. Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const origin = new URL(req.url).origin;
  const res = await fetch(`${origin}/api/jobs?refresh=1`, { cache: 'no-store' });
  const data = res.ok ? await res.json() : null;
  return NextResponse.json({ ok: res.ok, jobs: data?.total ?? 0 });
}
