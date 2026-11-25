import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserId, withUserData } from '../../auth/_lib';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { MODES, systemPrompt, type CareerMode } from '@/lib/career-ops/prompts';
import { scanPosting } from '@/lib/career-ops/safety';
import { generate, llmConfigured } from '@/lib/llm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  mode: z.enum(Object.keys(MODES) as [CareerMode, ...CareerMode[]]),
  profile: z.record(z.any()).default({}),
  input: z.string().trim().min(1, 'Add some details first.').max(20000),
});

const LONG_MODES = new Set<CareerMode>(['cv-json', 'evaluate', 'cv', 'interview-prep', 'cover', 'linkedin', 'roadmap', 'document', 'strategy']);

function profileBlock(p: Record<string, any>) {
  const lines = [
    ['Name', p.fullName],
    ['Target role', p.targetRole],
    ['Location', p.location],
    ['Summary', p.summary],
    ['Experience', p.experience],
    ['Education', [p.degree, p.university, p.graduationYear].filter(Boolean).join(', ')],
    ['Skills', Array.isArray(p.skills) ? p.skills.join(', ') : ''],
    ['Projects', Array.isArray(p.projects) ? p.projects.map((x: any) => `${x.name}: ${x.description} [${(x.tech || []).join(', ')}]`).join(' | ') : ''],
    ['Certifications', Array.isArray(p.certifications) ? p.certifications.map((x: any) => [x.name, x.issuer, x.year].filter(Boolean).join(', ')).join(' | ') : ''],
    ['Achievements', Array.isArray(p.achievements) ? p.achievements.join(' | ') : ''],
    ['Languages', Array.isArray(p.languages) ? p.languages.join(', ') : ''],
    ['Career goals', p.careerGoals],
    ['Preferred locations', p.preferredLocations],
    ['Work modes', Array.isArray(p.workModes) ? p.workModes.join(', ') : ''],
    ['Salary expectation', p.salaryExpectation],
  ].filter(([, v]) => v && String(v).trim());
  return lines.length
    ? lines.map(([k, v]) => `${k}: ${String(v).slice(0, 4000)}`).join('\n')
    : '(The candidate has not filled in a profile yet.)';
}

async function POST_handler(req: NextRequest) {
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

  if (!llmConfigured()) {
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
    const out = await generate({
      system: systemPrompt(mode),
      user: `CANDIDATE PROFILE\n${profileBlock(profile)}\n\n<untrusted_input>\n${input}\n</untrusted_input>`,
      maxTokens: mode === 'mock-question' ? 200 : LONG_MODES.has(mode) ? 4000 : 2200,
      json: mode === 'cv-json',
    });
    return NextResponse.json({ text: out.text, flags, model: out.model, provider: out.provider });
  } catch {
    return NextResponse.json(
      { flags, error: { code: 'AI_FAILED', message: 'The AI service did not respond. Please try again.' } },
      { status: 502 }
    );
  }
}

export const POST = withUserData(POST_handler);
