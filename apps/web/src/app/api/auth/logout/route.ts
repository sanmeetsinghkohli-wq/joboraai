import { NextRequest, NextResponse } from 'next/server';
import { clearCookie } from '../_lib';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
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
