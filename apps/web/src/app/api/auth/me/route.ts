import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCookie } from '../_lib';

// In-memory store for demo
const profiles = new Map<string, { id: string; userId: string; name: string; summary: string; location: string; targetRoles: string[]; skills: string[]; experiences: any[]; education: any[]; updatedAt: string }>();

export async function GET(request: NextRequest) {
  try {
    const token = getCookie(request, 'session');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get user profile from demo store
    let profile = profiles.get(decoded.sub!);
    if (!profile) {
      // Return basic profile setup
      profile = {
        id: `profile-${decoded.sub}`,
        userId: decoded.sub,
        name: decoded.firstName || 'Your Name',
        summary: 'Your professional summary will appear here.',
        location: '',
        targetRoles: [],
        skills: ['React', 'TypeScript', 'Node.js', 'Python'],
        experiences: [],
        education: [],
        updatedAt: new Date().toISOString(),
      };
      profiles.set(decoded.sub!, profile);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.sub,
        firstName: decoded.firstName,
        email: decoded.email,
      },
      profile,
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
