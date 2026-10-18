import { NextRequest, NextResponse } from 'next/server';
import {
  usersStore,
  profilesStore,
  emailConnectionsStore,
  getCookie,
  verifyToken,
  clearCookie,
} from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = getCookie(req, 'access_token') || getCookie(req, 'session');
    if (!token) {
      return NextResponse.json({ user: null, profile: null, emailConnections: [] }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      const res = NextResponse.json({ user: null, profile: null, emailConnections: [] }, { status: 401 });
      clearCookie(res, 'access_token');
      return res;
    }

    const user = usersStore.get(payload.sub);
    if (!user) {
      // Stateless fallback when serverless container restarts
      const profile = profilesStore.get(payload.sub) || null;
      return NextResponse.json({
        user: {
          id: payload.sub,
          firstName: payload.firstName || 'Candidate',
          lastName: profile?.lastName || '',
          email: payload.email,
          emailVerified: payload.emailVerified ?? true,
        },
        profile,
        emailConnections: emailConnectionsStore.get(payload.sub) || [],
      });
    }

    const { passwordHash, verificationToken, resetToken, resetTokenExpires, ...safeUser } = user;
    const profile = profilesStore.get(user.id) || null;
    const emailConnections = emailConnectionsStore.get(user.id) || [];

    return NextResponse.json({ user: safeUser, profile, emailConnections });
  } catch (err) {
    console.error('[GET /api/auth/me]', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
