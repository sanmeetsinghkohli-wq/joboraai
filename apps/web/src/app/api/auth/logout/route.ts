import { NextRequest, NextResponse } from 'next/server';
import { clearCookie, getAuthenticatedUserId, revokeSessions, withUserData } from '../_lib';

export const dynamic = 'force-dynamic';

async function POST_handler(request: NextRequest) {
  try {
    // withUserData has already loaded this user, so the session is ended
    // server-side: any copy of the old token stops working, not just this cookie.
    const userId = getAuthenticatedUserId(request);
    if (userId) revokeSessions(userId);

    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    clearCookie(res, 'access_token');
    clearCookie(res, 'session');

    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withUserData(POST_handler);
