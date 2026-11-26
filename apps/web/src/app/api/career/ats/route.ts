import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserId, withUserData } from '../../auth/_lib';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { auditAts } from '@/lib/career-ops/verify-ats.mjs';
import { cvToHtml } from '@/lib/career-ops/cvHtml';
import { textToAtsHtml } from '@/lib/cvAtsHtml';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  source: z.enum(['profile', 'text']),
  text: z.string().max(40000).optional(),
  profile: z.record(z.any()).optional(),
  keywords: z.string().max(2000).optional(),
});

async function POST_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  if (!checkRateLimit(`ats:${userId}:${getClientIp(req)}`, 30, 60000).allowed) {
    return NextResponse.json({ error: { message: 'Too many checks. Wait a moment.' } }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { message: 'Invalid request.' } }, { status: 400 });
  const { source, text, profile, keywords } = parsed.data;

  if (source === 'text' && !text?.trim()) {
    return NextResponse.json({ error: { message: 'Paste your CV text first.' } }, { status: 400 });
  }
  const html = source === 'text' ? textToAtsHtml(text ?? '') : cvToHtml(profile ?? {});
  // The score comes only from career-ops' own scorer; it is never estimated here.
  const result = auditAts(html, { keywords: keywords || undefined });
  return NextResponse.json(result);
}

export const POST = withUserData(POST_handler);
