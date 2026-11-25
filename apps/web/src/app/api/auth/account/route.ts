import { NextRequest, NextResponse } from 'next/server';
import {
  applicationsStore,
  clearCookie,
  comparePassword,
  emailConnectionsStore,
  getAuthenticatedUserId,
  profilesStore,
  resumesStore,
  revokeSessions,
  savedJobsStore,
  userJobsStore,
  usersStore,
  withUserData,
} from '../_lib';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Permanently deletes the signed-in user's account and every record stored for
 * them. The password is required again so a left-open session cannot do it.
 */
async function DELETE_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  if (!checkRateLimit(`delete-account:${userId}:${getClientIp(req)}`, 5, 60000).allowed) {
    return NextResponse.json({ error: { message: 'Too many attempts. Wait a minute.' } }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const user = usersStore.get(userId);
  if (!user) return NextResponse.json({ error: { message: 'Account not found.' } }, { status: 404 });
  const ok = await comparePassword(String(body?.password || ''), user.passwordHash);
  if (!ok) return NextResponse.json({ error: { message: 'That password is not right.' } }, { status: 403 });

  // End every session first, then remove each record.
  revokeSessions(userId);
  for (const [id, resume] of [...resumesStore.entries()]) {
    if (resume?.userId === userId) resumesStore.delete(id);
  }
  applicationsStore.delete(userId);
  savedJobsStore.delete(userId);
  userJobsStore.delete(userId);
  emailConnectionsStore.delete(userId);
  profilesStore.delete(userId);
  usersStore.delete(user.email);
  // Keep a marker with no personal data so any copied session token for this id
  // fails verification (its version no longer matches).
  usersStore.set(userId, { id: userId, deleted: true, tokenVersion: -1 } as any);

  const res = NextResponse.json({ success: true });
  clearCookie(res, 'access_token');
  clearCookie(res, 'session');
  return res;
}

export const DELETE = withUserData(DELETE_handler);
