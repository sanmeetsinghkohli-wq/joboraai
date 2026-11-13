import { NextResponse, type NextRequest } from 'next/server';

/**
 * Keeps signed-out visitors out of the workspace.
 *
 * This checks that a session cookie is present; each API route still verifies
 * the token itself, so a forged cookie gets a shell with no data.
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('jobora_access_token') || req.cookies.has('jobora_session');
  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = '/auth';
  url.search = `?tab=login&next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/jobs/:path*',
    '/saved-jobs/:path*',
    '/applications/:path*',
    '/cv-studio/:path*',
    '/cover-letters/:path*',
    '/interview/:path*',
    '/career-insights/:path*',
    '/ai-copilot/:path*',
    '/email-composer/:path*',
    '/documents/:path*',
    '/notifications/:path*',
    '/settings/:path*',
  ],
};
