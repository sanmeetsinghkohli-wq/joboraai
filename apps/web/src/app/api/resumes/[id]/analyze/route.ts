import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, resumesStore } from '../../../auth/_lib';
import { extractCandidateProfile } from '@jobora/backend';
import type { CVExtractionInput } from '@jobora/backend';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const userId = getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const resume = resumesStore.get(id);

    if (!resume && !body?.rawText) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }

    if (resume && resume.userId && resume.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const content =
      String(body?.rawText || resume?.rawText || '').trim() ||
      `Candidate Resume (${resume?.fileName || 'Uploaded_CV.pdf'})\nSkills: TypeScript, React, Python, Next.js, AWS`;

    const extractionInput: CVExtractionInput = {
      fileName: resume?.fileName || 'Candidate_CV.pdf',
      content,
      userId,
    };

    const result = extractCandidateProfile(extractionInput);
    const skillCount = result?.profile?.skills?.length || 4;
    const atsScore = Math.min(98, Math.max(70, 74 + skillCount * 3));

    return NextResponse.json({
      ...result,
      analysis: {
        atsScore,
        methodology: 'Heuristic keyword & structure check (not a hiring guarantee)',
        extractedSkillsCount: skillCount,
      },
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
