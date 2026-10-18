import { NextRequest, NextResponse } from 'next/server';
import { getCookie, setCookie, verifyToken, comparePassword, generateToken, usersStore } from '../_lib';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const userData =
      usersStore.get(normalizedEmail) ||
      Array.from(usersStore.values()).find((u) => u.email === normalizedEmail);

    if (!userData) {
      const token = getCookie(request, 'access_token') || getCookie(request, 'session');
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          return NextResponse.json({
            success: true,
            message: 'Already authenticated',
            user: { id: decoded.sub, firstName: decoded.firstName, email: decoded.email },
            token,
          });
        }
      }
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, userData.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken(
      userData.id,
      userData.firstName,
      userData.email,
      userData.emailVerified
    );

    const res = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: userData.emailVerified,
        onboardingCompleted: userData.onboardingCompleted,
      },
      token,
    });

    setCookie(res, 'access_token', token);
    setCookie(res, 'session', token);

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
