import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, gmailTokensStore, withUserData } from '../../../auth/_lib';
import { gmailConfigured } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

/** Whether Gmail sending is available on this server and connected for this user. No secrets. */
async function GET_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  const stored = gmailTokensStore.get(userId);
  return NextResponse.json({
    available: gmailConfigured(),
    connected: Boolean(stored?.enc),
    email: stored?.email || '',
    connectedAt: stored?.connectedAt || '',
  });
}

export const GET = withUserData(GET_handler);
