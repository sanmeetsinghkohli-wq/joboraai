import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, withUserData } from '../../../auth/_lib';
import { authUrl, gmailConfigured, gmailRedirectUri, signState } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

/** Sends the signed-in user to Google to grant send-only Gmail access. */
async function GET_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  const back = new URL('/settings', req.nextUrl.origin);
  if (!userId) return NextResponse.redirect(new URL('/auth?tab=login&next=%2Fsettings', req.nextUrl.origin));
  if (!gmailConfigured()) {
    back.searchParams.set('gmail', 'not_configured');
    return NextResponse.redirect(back);
  }
  return NextResponse.redirect(authUrl(gmailRedirectUri(req.nextUrl.origin), signState(userId)));
}

export const GET = withUserData(GET_handler);
