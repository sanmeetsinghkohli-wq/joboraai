import { NextRequest, NextResponse } from 'next/server';
import { getCookie } from '../_lib';

export async function POST(request: NextRequest) {
  try {
    // Clear session cookie
    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Get existing token so we can clear it
    const token = getCookie(request, 'session');
    if (token) {
      res.headers.append('Set-Cookie', 'jobora_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    }

    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
