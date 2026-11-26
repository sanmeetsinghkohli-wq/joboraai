import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailEnabled } from '@/lib/email';
import { extrasStore, getAuthenticatedUserId, withUserData, type UserExtras } from '../auth/_lib';

export const dynamic = 'force-dynamic';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const text = (max: number) => z.string().trim().max(max);

const Action = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('alert.add'),
    name: text(60).min(1),
    query: text(100).default(''),
    region: text(40).default(''),
    jobType: text(40).default(''),
    techOnly: z.boolean().default(false),
    seenIds: z.array(z.string().max(200)).max(1000).default([]),
  }),
  z.object({ action: z.literal('alert.remove'), id: text(80) }),
  z.object({ action: z.literal('alert.email'), id: text(80), enabled: z.boolean() }),
  z.object({ action: z.literal('alert.seen'), id: text(80), seenIds: z.array(z.string().max(200)).max(1000) }),
  z.object({
    action: z.literal('goals.set'),
    weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    applications: z.number().int().min(0).max(100),
    outreach: z.number().int().min(0).max(100),
    practice: z.number().int().min(0).max(100),
  }),
  z.object({
    action: z.literal('interview.add'),
    role: text(120).default(''),
    question: text(500).min(1),
    score: z.number().min(0).max(10),
    source: z.enum(['practice', 'career-ops']).default('practice'),
  }),
  z.object({ action: z.literal('interview.clear') }),
]);

async function GET_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  return NextResponse.json({ ...(extrasStore.get(userId) ?? {}), emailAlertsAvailable: emailEnabled() });
}

/** Small, validated updates to a user's alerts, weekly goals and interview history. */
async function POST_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  const parsed = Action.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: { message: parsed.error.issues[0]?.message || 'Invalid request.' } }, { status: 400 });
  }
  const a = parsed.data;
  const x: UserExtras = { ...(extrasStore.get(userId) ?? {}) };
  const alerts = x.alerts ?? [];

  switch (a.action) {
    case 'alert.add':
      if (alerts.length >= 10) {
        return NextResponse.json({ error: { message: 'You can keep up to 10 alerts.' } }, { status: 400 });
      }
      x.alerts = [
        { id: `alert-${uid()}`, name: a.name, query: a.query, region: a.region, jobType: a.jobType, techOnly: a.techOnly, seenIds: a.seenIds, createdAt: new Date().toISOString() },
        ...alerts,
      ];
      break;
    case 'alert.remove':
      x.alerts = alerts.filter((al) => al.id !== a.id);
      break;
    case 'alert.email': {
      const target = alerts.find((al) => al.id === a.id);
      if (!target) return NextResponse.json({ error: { message: 'Alert not found.' } }, { status: 404 });
      target.emailEnabled = a.enabled;
      // Start from what is already listed so the first email holds only genuinely new roles.
      if (a.enabled && !target.emailedIds) target.emailedIds = [...target.seenIds];
      x.alerts = alerts;
      break;
    }
    case 'alert.seen': {
      const target = alerts.find((al) => al.id === a.id);
      if (!target) return NextResponse.json({ error: { message: 'Alert not found.' } }, { status: 404 });
      target.seenIds = [...new Set([...a.seenIds, ...target.seenIds])].slice(0, 1000);
      x.alerts = alerts;
      break;
    }
    case 'goals.set':
      x.goals = { weekOf: a.weekOf, applications: a.applications, outreach: a.outreach, practice: a.practice };
      break;
    case 'interview.add':
      x.interviews = [
        { id: `iv-${uid()}`, at: new Date().toISOString(), role: a.role, question: a.question, score: Math.round(a.score * 10) / 10, source: a.source },
        ...(x.interviews ?? []),
      ].slice(0, 200);
      break;
    case 'interview.clear':
      x.interviews = [];
      break;
  }
  extrasStore.set(userId, x);
  return NextResponse.json({ ...x, emailAlertsAvailable: emailEnabled() });
}

export const GET = withUserData(GET_handler);
export const POST = withUserData(POST_handler);
