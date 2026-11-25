import { NextRequest, NextResponse } from 'next/server';
import {
  applicationsStore,
  emailConnectionsStore,
  getAuthenticatedUserId,
  gmailTokensStore,
  outboxStore,
  profilesStore,
  withUserData,
  type OutboxItem,
} from '../../auth/_lib';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { EMAIL_RE, accessTokenFor, buildMessage, decryptSecret, gmailConfigured, sendGmail } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

const DAILY_LIMIT = 20;

/**
 * Sends ONE outbox email from the user's connected Gmail. This route is only
 * called when the user presses "Approve & send" on that specific draft.
 */
async function POST_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  if (!checkRateLimit(`outbox-send:${userId}:${getClientIp(req)}`, 10, 60000).allowed) {
    return NextResponse.json({ error: { message: 'Slow down: wait a minute before sending more.' } }, { status: 429 });
  }
  if (!gmailConfigured()) {
    return NextResponse.json({ error: { message: 'Gmail sending is not set up on this server yet.' } }, { status: 503 });
  }
  const stored = gmailTokensStore.get(userId);
  if (!stored?.enc) return NextResponse.json({ error: { message: 'Connect your Gmail first.' } }, { status: 400 });

  const { id } = await req.json().catch(() => ({ id: '' }));
  const items: OutboxItem[] = outboxStore.get(userId) ?? [];
  const item = items.find((i) => i.id === id);
  if (!item) return NextResponse.json({ error: { message: 'Draft not found.' } }, { status: 404 });
  if (item.status === 'sent') return NextResponse.json({ error: { message: 'Already sent.' } }, { status: 409 });
  if (!EMAIL_RE.test(item.to)) return NextResponse.json({ error: { message: 'Add a valid recipient address.' } }, { status: 400 });
  if (!item.subject.trim() || !item.body.trim()) {
    return NextResponse.json({ error: { message: 'Add a subject and a message.' } }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const sentToday = items.filter((i) => i.status === 'sent' && i.sentAt?.startsWith(today)).length;
  if (sentToday >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: { message: `You have sent ${DAILY_LIMIT} emails today. More can go out tomorrow.` } },
      { status: 429 }
    );
  }

  try {
    const accessToken = await accessTokenFor(decryptSecret(stored.enc));
    const profile = profilesStore.get(userId);
    const raw = buildMessage({ from: stored.email, fromName: profile?.fullName, to: item.to, subject: item.subject, body: item.body });
    await sendGmail(accessToken, raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sending failed';
    item.status = 'failed';
    item.error = message.includes('invalid_grant')
      ? 'Gmail access was revoked. Reconnect Gmail in Settings.'
      : 'Gmail did not accept the email. Check the address and try again.';
    outboxStore.set(userId, items);
    console.error('[outbox send]', message);
    return NextResponse.json({ error: { message: item.error }, item }, { status: 502 });
  }

  const now = new Date();
  item.status = 'sent';
  item.sentAt = now.toISOString();
  item.error = undefined;
  outboxStore.set(userId, items);

  const conns = emailConnectionsStore.get(userId);
  if (conns?.length) emailConnectionsStore.set(userId, conns.map((c) => ({ ...c, lastUsedAt: item.sentAt })));

  // Record it on the linked application.
  if (item.applicationId) {
    const apps = (applicationsStore.get(userId) ?? []) as any[];
    const app = apps.find((a) => a.id === item.applicationId);
    if (app) {
      app.timeline = [
        {
          title: item.kind === 'followup' ? 'Follow-up email sent' : 'Email sent',
          timestamp: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: `To ${item.to}: ${item.subject}`,
        },
        ...(app.timeline || []),
      ];
      if (item.kind === 'application' && /^(interested|preparing|saved)$/i.test(app.status)) {
        app.status = 'Applied';
        app.appliedOn = app.appliedOn || now.toISOString().slice(0, 10);
      }
      if (item.kind === 'followup') app.followUpAt = '';
      applicationsStore.set(userId, apps);
    }
  }

  return NextResponse.json({ item });
}

export const POST = withUserData(POST_handler);
