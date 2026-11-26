import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { auditAts } from '@/lib/career-ops/verify-ats.mjs';
import { textToAtsHtml } from '@/lib/cvAtsHtml';
import { readCvFile } from '@/lib/cvUpload';
import { flushPersistence } from '@/lib/db/kv';
import { recordEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const Pasted = z.object({ text: z.string().max(40000), keywords: z.string().max(2000).optional() });

/**
 * Free CV check for anyone, no account needed. The CV is scored in memory by
 * the deterministic career-ops ATS checker and is never stored or sent to AI.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const minute = checkRateLimit(`cvcheck:m:${ip}`, 5, 60_000);
  const day = checkRateLimit(`cvcheck:d:${ip}`, 40, 86_400_000);
  if (!minute.allowed || !day.allowed) {
    return NextResponse.json(
      { error: { message: 'You have run a lot of checks. Please wait a little and try again.' } },
      { status: 429, headers: getRateLimitHeaders(minute.allowed ? day : minute) }
    );
  }

  let html = '';
  let keywords: string | undefined;
  const type = req.headers.get('content-type') || '';
  if (type.startsWith('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    const upload = await readCvFile(form?.get('file'));
    if ('error' in upload) return NextResponse.json({ error: { message: upload.error } }, { status: upload.status });
    html = upload.html;
    const kw = form?.get('keywords');
    keywords = typeof kw === 'string' ? kw.slice(0, 2000) : undefined;
  } else {
    const parsed = Pasted.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: { message: 'Invalid request.' } }, { status: 400 });
    const text = parsed.data.text.trim();
    keywords = parsed.data.keywords;
    html = textToAtsHtml(text);
    if (text.length < 80) {
      return NextResponse.json({ error: { message: 'Paste your whole CV, including the section headings.' } }, { status: 400 });
    }
  }

  const result = auditAts(html, { keywords: keywords?.trim() || undefined });
  recordEvent('cv_check', type.startsWith('multipart') ? 'upload' : 'paste');
  await flushPersistence();
  return NextResponse.json({ score: result.score, grade: result.grade, issues: result.issues, keywordCoverage: result.keywordCoverage ?? null });
}
