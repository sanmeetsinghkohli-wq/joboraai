import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserId } from '../../auth/_lib';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { MODES, systemPrompt, type CareerMode } from '@/lib/career-ops/prompts';
import { scanPosting } from '@/lib/career-ops/safety';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  mode: z.enum(Object.keys(MODES) as [CareerMode, ...CareerMode[]]),
  profile: z.record(z.any()).default({}),
  input: z.string().trim().min(1, 'Add some details first.').max(20000),
});

const MODEL = 'qwen/qwen3.8-27b';

function profileBlock(p: Record<string, any>) {
  const lines = [
    ['Name', p.fullName],
    ['Target role', p.targetRole],
    ['Location', p.location],
    ['Summary', p.summary],
    ['Experience', p.experience],
    ['Education', [p.degree, p.university, p.graduationYear].filter(Boolean).join(', ')],
    ['Skills', Array.isArray(p.skills) ? p.skills.join(', ') : ''],
  ].filter(([, v]) => v && String(v).trim());
  return lines.length
    ? lines.map(([k, v]) => `${k}: ${String(v).slice(0, 4000)}`).join('\n')
    : '(The candidate has not filled in a profile yet.)';
}

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  if (!checkRateLimit(`career:${userId}:${getClientIp(req)}`, 20, 60000).allowed) {
    return NextResponse.json({ error: { message: 'Too many requests. Wait a moment.' } }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || 'Invalid request.' } },
      { status: 400 }
    );
  }
  const { mode, profile, input } = parsed.data;

  // Deterministic posting checks run whether or not AI is available.
  const flags = mode === 'evaluate' ? scanPosting(input) : [];

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        flags,
        error: {
          code: 'AI_UNAVAILABLE',
          message: 'AI drafting is not set up on this server yet, so only the automatic checks ran.',
        },
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: mode === 'mock-question' ? 200 : 2200,
        messages: [
          { role: 'system', content: systemPrompt(mode) },
          {
            role: 'user',
            content: `CANDIDATE PROFILE\n${profileBlock(profile)}\n\n<untrusted_input>\n${input}\n</untrusted_input>`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const text: string = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (!text) throw new Error('empty');
    return NextResponse.json({ text, flags, model: MODEL });
  } catch {
    return NextResponse.json(
      { flags, error: { code: 'AI_FAILED', message: 'The AI service did not respond. Please try again.' } },
      { status: 502 }
    );
  }
}
