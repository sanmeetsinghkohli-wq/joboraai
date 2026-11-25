import { NextRequest, NextResponse } from 'next/server';
import { emailConnectionsStore, getAuthenticatedUserId, gmailTokensStore, withUserData } from '../../../auth/_lib';
import { encryptSecret, exchangeCode, gmailRedirectUri, verifyState } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

/** Google redirects here after the user approves (or declines) access. */
async function GET_handler(req: NextRequest) {
  const back = new URL('/settings', req.nextUrl.origin);
  const done = (result: string) => {
    back.searchParams.set('gmail', result);
    return NextResponse.redirect(back);
  };

  const params = req.nextUrl.searchParams;
  if (params.get('error')) return done('declined');

  const userId = getAuthenticatedUserId(req);
  const stateUser = verifyState(params.get('state') || '');
  // The state must be ours, unexpired, and issued to the same signed-in user.
  if (!userId || !stateUser || stateUser !== userId) return done('invalid');

  try {
    const { refreshToken, email, canSend } = await exchangeCode(params.get('code') || '', gmailRedirectUri(req.nextUrl.origin));
    if (!canSend) return done('no_send_permission');
    if (!refreshToken) return done('no_refresh_token');

    const now = new Date().toISOString();
    gmailTokensStore.set(userId, { enc: encryptSecret(refreshToken), email, connectedAt: now });
    emailConnectionsStore.set(userId, [
      { id: `gmail-${userId}`, userId, provider: 'gmail', email, status: 'connected', connectedAt: now, lastUsedAt: null } as any,
    ]);
    return done('connected');
  } catch (e) {
    console.error('[gmail callback]', e instanceof Error ? e.message : e);
    return done('failed');
  }
}

export const GET = withUserData(GET_handler);
