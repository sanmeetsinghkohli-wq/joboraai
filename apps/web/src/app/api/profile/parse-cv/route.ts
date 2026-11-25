import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, withUserData } from '../../auth/_lib';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { extractCvText, parseCvWithAi } from '@/lib/cv-parse';
import { auditAts } from '@/lib/career-ops/verify-ats.mjs';
import { textToHtml } from '@/lib/career-ops/cvHtml';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['pdf', 'docx', 'txt'];

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
  const file = form?.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: { message: 'Choose a CV file to upload.' } }, { status: 400 });
  }
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: { message: 'Upload a PDF, DOCX or TXT file.' } }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: { message: 'The file must be between 1 byte and 5 MB.' } }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Cheap signature checks so a renamed file cannot slip through.
  if (ext === 'pdf' && buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json({ error: { message: 'That file is not a valid PDF.' } }, { status: 400 });
  }
  if (ext === 'docx' && buffer.subarray(0, 2).toString('latin1') !== 'PK') {
    return NextResponse.json({ error: { message: 'That file is not a valid Word document.' } }, { status: 400 });
  }

  let text = '';
  try {
    text = (await extractCvText(file.name, buffer)).replace(/\u0000/g, '').trim();
  } catch {
    return NextResponse.json({ error: { message: 'We could not read text from that file.' } }, { status: 422 });
  }
  if (text.length < 80) {
    return NextResponse.json(
      {
        error: {
          message:
            'This file has almost no selectable text. If it is a scanned image, export your CV from Word or Google Docs as a PDF and try again.',
        },
      },
      { status: 422 }
    );
  }

  // Deterministic ATS read of the extracted text (career-ops scorer, no AI).
  const ats = auditAts(textToHtml(text));

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ error: { message: 'CV reading is not set up on this server yet.' } }, { status: 503 });
  }
  try {
    const parsed = await parseCvWithAi(text, key);
    return NextResponse.json({ parsed, ats: { score: ats.score, grade: ats.grade }, characters: text.length });
  } catch {
    return NextResponse.json({ error: { message: 'The AI could not read this CV. Please try again.' } }, { status: 502 });
  }
}

export const POST = withUserData(POST_handler);
