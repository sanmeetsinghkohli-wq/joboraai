import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, withUserData } from '../../auth/_lib';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { parseCvWithAi } from '@/lib/cv-parse';
import { readCvFile } from '@/lib/cvUpload';
import { llmConfigured } from '@/lib/llm';
import { auditAts } from '@/lib/career-ops/verify-ats.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;


/**
 * Reads an uploaded CV and returns structured profile data for the user to
 * review. Nothing is saved here; the client applies only what the user accepts.
 */
async function POST_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  if (!checkRateLimit(`parse-cv:${userId}:${getClientIp(req)}`, 6, 60000).allowed) {
    return NextResponse.json({ error: { message: 'Too many uploads. Wait a minute and try again.' } }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const upload = await readCvFile(form?.get('file'));
  if ('error' in upload) return NextResponse.json({ error: { message: upload.error } }, { status: upload.status });
  const { text, html } = upload;

  // Deterministic ATS read of the extracted text (career-ops scorer, no AI).
  const ats = auditAts(html);

  if (!llmConfigured()) {
    return NextResponse.json({ error: { message: 'CV reading is not set up on this server yet.' } }, { status: 503 });
  }
  try {
    const parsed = await parseCvWithAi(text);
    return NextResponse.json({ parsed, ats: { score: ats.score, grade: ats.grade }, characters: text.length });
  } catch {
    return NextResponse.json({ error: { message: 'The AI could not read this CV. Please try again.' } }, { status: 502 });
  }
}

export const POST = withUserData(POST_handler);
