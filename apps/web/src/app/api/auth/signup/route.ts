import { NextRequest, NextResponse } from 'next/server';
import { getCookie, setCookie, generateToken, hashPassword, usersStore } from '../_lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName = '', email, password } = body;

    if (!firstName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create or update user
    const existing = usersStore.get(normalizedEmail);
    const user = {
      id: existing?.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      emailVerified: false,
      emailVerifiedAt: null,
      onboardingCompleted: existing?.onboardingCompleted || false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(normalizedEmail, user);

    // Generate session token (unverified)
    const token = generateToken(user.id, user.firstName, user.email, false);

    const res = NextResponse.json({
      success: true,
      message: 'Account created successfully. Please verify your email to continue.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: false,
        onboardingCompleted: false,
      },
      token,
    });

    setCookie(res, 'session', token);

    return res;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
