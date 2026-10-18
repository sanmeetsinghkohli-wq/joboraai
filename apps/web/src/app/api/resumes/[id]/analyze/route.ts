import { NextRequest, NextResponse } from 'next/server';
import { getCookie } from '../../../auth/_lib';
import { extractCandidateProfile } from '@jobora/backend';
import type { CVExtractionInput } from '@jobora/backend';

// In-memory store
const resumes = new Map<string, any>();

export async function POST(request: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const token = getCookie(request, 'session');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const resume = resumes.get(id);
    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // In production, fetch the stored CV content from storage
    const demoContent = `Alex Johnson
San Francisco, CA | alex@example.com | github.com/alexjohnson

Professional Summary:
Full-stack engineer with 5+ years of experience building customer-facing products. Passionate about AI-driven workflows and clean, maintainable systems.

Skills:
React, TypeScript, Node.js, Python, FastAPI, Next.js, Tailwind CSS, PostgreSQL, PostgreSQL, Docker, Git

Experience:

Senior Full-Stack Engineer | Fintech Corp | 2021 - Present
Led the engineering team building a customer-facing trading platform handling 2M+ daily requests. Architected the API layer and introduced CI/CD pipelines that cut deployment time by 60%.

- Improved API response time by 45% through query optimisation and caching.
- Reduced production incidents by 30% via improved observability and error tracking.
- Mentored 4 junior engineers; 3 promoted internally.

Full-Stack Developer | CloudNine Labs | 2018 - 2021
Built and shipped features for an AI-assisted education platform.

- Shipped a recommendation module used by 500k+ monthly active users.
- Reduced page load time by 35% with static-site generation and CDN optimisation.
- Introduced Playwright testing, raising coverage from 40% to 78%.

Education:
- B.Sc. in Computer Science, MIT, 2012 - 2016

Projects:
- AI-Powered JobMatcher - Open-source library for job matching using vector embeddings.
- Resume Builder Pro - Web application for ATS-friendly resume creation.

Certifications:
- AWS Certified Solutions Architect, 2023
- Professional Scrum Master I, 2022

Languages:
- English (Native), French (Conversational)

Links:
- github.com/alexjohnson
- linkedin.com/in/alexjohnson
`;

    const extractionInput: CVExtractionInput = {
      fileName: resume.fileName,
      content: demoContent,
      userId: 'user-1',
    };

    const result = extractCandidateProfile(extractionInput);

    return NextResponse.json({
      ...result,
      success: true,
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
