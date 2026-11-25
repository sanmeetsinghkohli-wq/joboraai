import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applicationsStore, extrasStore, getAuthenticatedUserId, profilesStore, withUserData } from '../auth/_lib';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { generate } from '@/lib/llm';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const Req = z.object({
  message: z.string().trim().min(1, 'Type a question first.').max(3000, 'Keep questions under 3,000 characters.'),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
    .max(8)
    .optional(),
  /** Only jobs come from the browser (they are public listings); personal data is read on the server. */
  context: z.object({ jobs: z.array(z.record(z.any())).max(15).optional() }).passthrough().optional(),
});

/** Pages Copilot may point to. It must never invent other links. */
const PAGES = [
  ['/profile', 'My profile: career profile, CV import, skills, projects'],
  ['/jobs', 'Jobs: live roles, filters, saved roles, job alerts'],
  ['/applications', 'Applications: tracker with 8 stages, dates, reminders'],
  ['/outbox', 'Outbox: emails the user approves before they are sent from their Gmail'],
  ['/cv-studio', 'CV studio: build and export the CV'],
  ['/resume-studio', 'Resume Studio: tailor the CV to a job, compare versions, DOCX export'],
  ['/cover-letters', 'Cover letters'],
  ['/career-ops', 'Career Ops: job triage, tailored CV, cover letter, interview prep, upskilling plan'],
  ['/interview', 'Interview practice with timer, voice and AI scoring'],
  ['/career-growth', 'Learning roadmap'],
  ['/analytics', 'Career analytics from the user’s own tracker'],
  ['/gcc-guide', 'GCC guide: visas, local hiring rules, official links'],
  ['/linkedin', 'LinkedIn profile help'],
] as const;

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, n = 30) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, n) : []);

/** Everything Copilot is allowed to know, read from the server, never from the browser. */
function factSheet(userId: string, jobs: Array<Record<string, any>>): string {
  const p = (profilesStore.get(userId) ?? {}) as Record<string, any>;
  const apps = applicationsStore.get(userId) ?? [];
  const extras = extrasStore.get(userId) ?? {};
  const lines: string[] = ['## Profile (only these facts are known)'];
  const field = (label: string, v: string) => lines.push(`- ${label}: ${v || 'not provided'}`);

  field('Name', str(p.fullName) || [str(p.firstName), str(p.lastName)].filter(Boolean).join(' '));
  field('Target role', str(p.targetRole));
  field('Location', str(p.location));
  field('Education', [str(p.degree), str(p.university), str(p.graduationYear)].filter(Boolean).join(', '));
  field('Skills', list(p.skills).join(', '));
  field('Summary', str(p.summary, 600));
  field('CV uploaded', p.resumeFileName ? 'yes' : 'no');
  for (const key of ['experience', 'projects', 'certifications'] as const) {
    const items = Array.isArray(p[key]) ? p[key].slice(0, 6) : [];
    field(key[0].toUpperCase() + key.slice(1), items.map((x: unknown) => JSON.stringify(x).slice(0, 300)).join(' | '));
  }

  lines.push(`\n## Applications tracked: ${apps.length}`);
  for (const a of apps.slice(0, 15)) {
    const dates = [
      a.appliedOn && `applied ${a.appliedOn}`,
      a.interviewAt && `interview ${a.interviewAt}`,
      a.followUpAt && `follow-up ${a.followUpAt}`,
      a.deadline && `deadline ${a.deadline}`,
    ]
      .filter(Boolean)
      .join(', ');
    lines.push(`- ${str(a.title, 100)} at ${str(a.company, 80)}: ${str(a.status, 30)}${dates ? ` (${dates})` : ''}`);
  }

  const iv = extras.interviews ?? [];
  if (iv.length) {
    const recent = iv.slice(0, 10);
    const avg = recent.reduce((s, i) => s + i.score, 0) / recent.length;
    lines.push(`\n## Interview practice: ${iv.length} scored answers, recent average ${avg.toFixed(1)}/5`);
  }

  lines.push(`\n## Jobs currently loaded on the user's Jobs page (${jobs.length})`);
  for (const j of jobs.slice(0, 15)) {
    const match = typeof j.matchScore === 'number' ? `, skill match ${j.matchScore}%` : '';
    lines.push(`- ${str(j.title, 100)} at ${str(j.company, 80)}, ${str(j.location, 60)} (${str(j.employmentType, 20) || 'type unknown'}${match})`);
  }
  if (!jobs.length) lines.push('- none loaded');
  return lines.join('\n');
}

const SYSTEM = (facts: string) => `You are Jobora Copilot, a careful career assistant for job seekers in the UAE, GCC, MENA and India.

Rules, in priority order:
1. Use ONLY the facts below for anything about the user, their applications, scores or the jobs. If something is not in the facts, say you don't have it and say where in Jobora they can add or find it. Never guess names, companies, dates, salaries, numbers, match percentages or statuses.
2. Never claim you did something (applied, sent an email, saved, searched the web). You only advise; the user acts in the app.
3. General career advice (CV writing, STAR answers, negotiation basics) is fine; say it is general advice. For visas or laws, say rules change and point to /gcc-guide and official sources.
4. Never invent qualifications or experience for the user's CV or letters.
5. Only link to these pages, as markdown links: ${PAGES.map(([h, d]) => `${h} (${d})`).join('; ')}.
6. Be concise: short paragraphs or bullets, under 250 words unless asked for more.

${facts}`;

async function POST_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Please log in to use Copilot.' } }, { status: 401 });

  const rate = checkRateLimit(`copilot:${userId}:${getClientIp(req)}`, 20, 60000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many questions at once. Please wait a moment.' }, retryAfter: rate.retryAfterSeconds },
      { status: 429, headers: getRateLimitHeaders(rate) }
    );
  }

  const parsed = Req.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      { status: 400, headers: getRateLimitHeaders(rate) }
    );
  }
  const { message, history = [], context } = parsed.data;
  const convo = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Copilot'}: ${m.content.slice(0, 1500)}`)
    .join('\n\n');

  try {
    const out = await generate({
      system: SYSTEM(factSheet(userId, context?.jobs ?? [])),
      user: `${convo ? `Earlier in this chat:\n${convo}\n\n` : ''}User's question: ${message}`,
      maxTokens: 900,
      temperature: 0.2,
    });
    return NextResponse.json(
      {
        reply: out.text.trim(),
        suggestedActions: [],
        approvalRequired: null,
        providerMode: 'ai',
        activeModel: out.model,
        timestamp: new Date().toISOString(),
      },
      { headers: getRateLimitHeaders(rate) }
    );
  } catch (e) {
    console.error('[copilot]', (e as Error).message);
    return NextResponse.json(
      { error: { code: 'AI_UNAVAILABLE', message: 'Copilot can’t reach the AI service right now. Please try again in a minute.' } },
      { status: 503, headers: getRateLimitHeaders(rate) }
    );
  }
}

export const POST = withUserData(POST_handler);
