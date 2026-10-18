import { NextRequest, NextResponse } from 'next/server';
import { getCookie, setCookie, verifyToken, hashPassword, comparePassword, generateToken, usersStore } from '../_lib';

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

    // Find user
    const normalizedEmail = email.toLowerCase().trim();
    let userData = usersStore.get(normalizedEmail) || Array.from(usersStore.values()).find((u) => u.email === normalizedEmail);

    if (!userData) {
      // Check if user exists in cookie session (already authenticated)
      const token = getCookie(request, 'session');
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

    // Verify password
    const valid = await comparePassword(password, userData.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateToken(userData.id, userData.firstName, userData.email, userData.emailVerified);

    // Set cookie
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
