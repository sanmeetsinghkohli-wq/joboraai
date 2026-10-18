import { NextRequest, NextResponse } from 'next/server';
import { setCookie, generateToken, hashPassword, usersStore } from '../_lib';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName = '', email, password } = body;

    if (!firstName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required' },
        },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' },
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Prevent duplicate registration
    const existing =
      usersStore.get(normalizedEmail) ||
      Array.from(usersStore.values()).find((u) => u.email === normalizedEmail);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ACCOUNT',
            message: 'An account with this email already exists. Please log in instead.',
          },
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email: normalizedEmail,
      passwordHash,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      emailVerified: false,
      emailVerifiedAt: null,
      verificationToken,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(normalizedEmail, user);
    usersStore.set(user.id, user);

    const token = generateToken(user.id, user.firstName, user.email, false);

    const res = NextResponse.json(
      {
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
        devVerificationToken: verificationToken,
      },
      { status: 201 }
    );

    setCookie(res, 'access_token', token);
    setCookie(res, 'session', token);

    return res;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
