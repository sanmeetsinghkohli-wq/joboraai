import { NextRequest, NextResponse } from 'next/server';
import { getCookie, verifyToken } from '../auth/_lib';

// In-memory store for demo
const profiles = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const token = getCookie(request, 'session');
    const user = token ? verifyToken(token) : null;
    const userId = user?.sub || body.email || 'local-user';

    const profile = {
      id: `profile-${userId}`,
      userId,
      name: body.fullName || body.name || user?.firstName || '',
      email: body.email || user?.email || '',
      summary: body.summary || '',
      location: body.location || body.locations || '',
      targetRoles: body.targetRole ? [body.targetRole] : body.targetRoles || [],
      workModePreference: body.workMode || 'remote',
      skills: body.skills || [],
      jobTypes: body.jobTypes || [],
      cv: body.cv ? { fileName: body.cv.name, size: body.cv.size, type: body.cv.type } : null,
      updatedAt: new Date().toISOString(),
    };

    profiles.set(userId, profile);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed',
      profile,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getCookie(request, 'session');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = JSON.parse(atob(token.split('.')[1])) as { sub: string };
    const profile = profiles.get(user.sub);

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        needsOnboarding: true,
      });
    }

    return NextResponse.json({
      success: true,
      profile,
      needsOnboarding: false,
    });
  } catch (error) {
    console.error('Get onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
