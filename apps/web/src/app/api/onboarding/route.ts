import { NextRequest, NextResponse } from 'next/server';
import { profilesStore, getAuthenticatedUserId } from '../auth/_lib';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid onboarding payload.' } },
        { status: 400 }
      );
    }

    const existing = profilesStore.get(userId) || ({} as any);
    const updated = {
      ...existing,
      ...body,
      userId,
      updatedAt: new Date().toISOString(),
    };

    profilesStore.set(userId, updated);
    return NextResponse.json({ success: true, profile: updated, completed: true });
  } catch (err) {
    console.error('[POST /api/onboarding]', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save onboarding data.' } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req) || 'local_workspace';
    const profile = profilesStore.get(userId) || null;
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}
