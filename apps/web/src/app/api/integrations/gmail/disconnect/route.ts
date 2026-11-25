import { NextRequest, NextResponse } from 'next/server';
import { emailConnectionsStore, getAuthenticatedUserId, gmailTokensStore, withUserData } from '../../../auth/_lib';
import { decryptSecret, revokeToken } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

/** Revokes Jobora's Gmail access at Google and deletes the stored token. */
async function POST_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: { message: 'Please log in.' } }, { status: 401 });
  const stored = gmailTokensStore.get(userId);
  if (stored?.enc) {
    try {
      await revokeToken(decryptSecret(stored.enc));
    } catch {
      /* the token is deleted below either way */
    }
  }
  gmailTokensStore.delete(userId);
  emailConnectionsStore.delete(userId);
  return NextResponse.json({ success: true });
}

export const POST = withUserData(POST_handler);
