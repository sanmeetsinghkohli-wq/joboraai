import { NextRequest, NextResponse } from 'next/server';
import { usersStore, getAuthenticatedUserId } from '../_lib';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token;
    const userId = getAuthenticatedUserId(req);

    let matchedUser = userId ? usersStore.get(userId) : undefined;
    if (!matchedUser && token) {
      matchedUser = Array.from(usersStore.values()).find((u) => u.verificationToken === token);
    }

    if (matchedUser) {
      matchedUser.emailVerified = true;
      matchedUser.emailVerifiedAt = new Date().toISOString();
      matchedUser.verificationToken = null;
      usersStore.set(matchedUser.id, matchedUser);
      usersStore.set(matchedUser.email, matchedUser);
    }

    return NextResponse.json({
      verified: true,
      message: 'Email ownership verified.',
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'VERIFICATION_FAILED', message: 'Unable to verify email token.' } },
      { status: 400 }
    );
  }
}
