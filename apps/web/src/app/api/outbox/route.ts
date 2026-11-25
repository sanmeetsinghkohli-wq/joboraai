import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserId, outboxStore, withUserData, type OutboxItem } from '../auth/_lib';
import { EMAIL_RE } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

const Draft = z.object({
  to: z.string().trim().max(254).refine((v) => v === '' || EMAIL_RE.test(v), 'Enter a valid email address.'),
  subject: z.string().trim().max(250),
  body: z.string().max(20000),
  applicationId: z.string().max(100).optional(),
  kind: z.enum(['application', 'outreach', 'followup', 'other']).default('other'),
});

const list = (userId: string): OutboxItem[] => outboxStore.get(userId) ?? [];

async function GET_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  return NextResponse.json({ items: list(userId) });
}

/** Queue a draft for the user's review. Nothing is sent here. */
async function POST_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  const parsed = Draft.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: { message: parsed.error.issues[0]?.message || 'Invalid draft.' } }, { status: 400 });
  }
  const items = list(userId);
  if (items.filter((i) => i.status === 'pending').length >= 50) {
    return NextResponse.json({ error: { message: 'Your outbox already has 50 drafts waiting.' } }, { status: 400 });
  }
  const item: OutboxItem = {
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...parsed.data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  outboxStore.set(userId, [item, ...items].slice(0, 200));
  return NextResponse.json({ item }, { status: 201 });
}

/** Edit a pending draft. */
async function PATCH_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = Draft.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: parsed.error.issues[0]?.message || 'Invalid draft.' } }, { status: 400 });
  }
  const items = list(userId);
  const target = items.find((i) => i.id === body?.id);
  if (!target) return NextResponse.json({ error: { message: 'Draft not found.' } }, { status: 404 });
  if (target.status === 'sent') return NextResponse.json({ error: { message: 'This email was already sent.' } }, { status: 409 });
  Object.assign(target, parsed.data, { status: 'pending', error: undefined });
  outboxStore.set(userId, items);
  return NextResponse.json({ item: target });
}

async function DELETE_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  const items = list(userId);
  outboxStore.set(userId, items.filter((i) => i.id !== id || i.status === 'sent'));
  return NextResponse.json({ success: true });
}

export const GET = withUserData(GET_handler);
export const POST = withUserData(POST_handler);
export const PATCH = withUserData(PATCH_handler);
export const DELETE = withUserData(DELETE_handler);
