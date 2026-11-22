import type { MetadataRoute } from 'next';

// Public marketing and legal pages are indexable; the signed-in workspace and APIs are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/students', '/universities', '/career-changers', '/enterprise', '/privacy', '/terms', '/security', '/contact'],
      disallow: ['/api/', '/dashboard', '/jobs', '/applications', '/cv-studio', '/cover-letters', '/interview', '/career-insights', '/career-ops', '/ai-copilot', '/settings', '/onboarding', '/notifications'],
    },
  };
}
