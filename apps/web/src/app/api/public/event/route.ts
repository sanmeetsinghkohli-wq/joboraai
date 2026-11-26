import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { flushPersistence } from '@/lib/db/kv';
import { recordEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

/** Anonymous click counters from public pages. Only names on this list are accepted. */
const PUBLIC_EVENTS = new Set(['cv_check_cta']);

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`event:${getClientIp(req)}`, 20, 60_000).allowed) return new NextResponse(null, { status: 204 });
  const body = await req.json().catch(() => ({}));
  if (typeof body?.name === 'string' && PUBLIC_EVENTS.has(body.name)) {
    recordEvent('cv_check_cta');
    await flushPersistence();
  }
  return new NextResponse(null, { status: 204 });
}
