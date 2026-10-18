import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface JobMatchExplanation {
  matchScore: number;
  engine: 'gemini-2.0-flash' | 'deterministic-profile-matcher';
  headline: string;
  alignedSkills: string[];
  missingOrAdjacentSkills: string[];
  locationFit: string;
  tailoringTips: string[];
}

function computeDeterministicExplanation(
  job: {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    skills?: string[];
  },
  profile: {
    targetRole?: string;
    location?: string;
    skills?: string[];
    summary?: string;
  }
): JobMatchExplanation {
  const userSkills = Array.isArray(profile.skills)
    ? profile.skills.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const jobSkills = Array.isArray(job.skills)
    ? job.skills.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const jobCorpus = `${job.title || ''} ${job.description || ''} ${jobSkills.join(' ')}`.toLowerCase();

  const alignedSkills = userSkills.filter((s) => jobCorpus.includes(s.toLowerCase()));
  const missingOrAdjacentSkills = jobSkills.filter(
    (js) => !userSkills.some((us) => us.toLowerCase() === js.toLowerCase())
  );

  const roleTokens = String(profile.targetRole || '')
    .toLowerCase()
    .split(/[\s,/|-]+/)
    .filter((t) => t.length > 2);
  const roleHits = roleTokens.filter((t) => String(job.title || '').toLowerCase().includes(t)).length;

  const skillRatio =
    userSkills.length > 0 ? alignedSkills.length / Math.max(1, Math.min(userSkills.length, 5)) : 0.45;
  const roleRatio = roleTokens.length > 0 ? roleHits / roleTokens.length : 0.5;
  const matchScore = Math.max(60, Math.min(98, Math.round(62 + skillRatio * 24 + roleRatio * 12)));

  const jobLoc = String(job.location || 'Remote');
  const userLoc = String(profile.location || '');
  const locationFit =
    userLoc && jobLoc.toLowerCase().includes(userLoc.toLowerCase().split(',')[0])
      ? `Direct regional match with your preferred location (${userLoc}).`
      : `Role is based in ${jobLoc}. Verify work authorization or remote flexibility before applying.`;

  const headline =
    alignedSkills.length > 0
      ? `Verified overlap on ${alignedSkills.slice(0, 4).join(', ')} for ${job.title || 'this role'} at ${
          job.company || 'the employer'
        }.`
      : `Baseline alignment for ${job.title || 'this role'} at ${
          job.company || 'the employer'
        } based on your target role profile.`;

  const tailoringTips: string[] = [
    alignedSkills.length > 0
      ? `Lead your CV summary with measurable outcomes involving ${alignedSkills.slice(0, 3).join(', ')}.`
      : `Add your verified technical and domain skills in Onboarding or CV Studio to compute exact keyword overlap.`,
    missingOrAdjacentSkills.length > 0
      ? `Only include ${missingOrAdjacentSkills.slice(0, 3).join(', ')} on your CV if you have genuine hands-on experience with them.`
      : `Highlight your direct project impact and cross-functional collaboration for ${job.company || 'this employer'}.`,
  ];

  return {
    matchScore,
    engine: 'deterministic-profile-matcher',
    headline,
    alignedSkills,
    missingOrAdjacentSkills: missingOrAdjacentSkills.slice(0, 5),
    locationFit,
    tailoringTips,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const job = body?.job || {};
    const profile = body?.profile || {};

    if (!job?.title || !job?.company) {
      return NextResponse.json(
        { error: 'Job title and company are required for match evaluation.' },
        { status: 400 }
      );
    }

    const fallback = computeDeterministicExplanation(job, profile);
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

    if (!geminiKey) {
      return NextResponse.json({ match: fallback });
    }

    // Call official Gemini 2.0 Flash REST API with strict anti-hallucination prompt
    const prompt = `You are Jobora AI's truthful career matching evaluator.
Evaluate how the candidate profile matches the following real job listing.
CRITICAL RULES:
- Never invent candidate skills, degrees, employers, or salaries that are not in the input.
- Only list a skill in "alignedSkills" if it appears in the candidate's actual skills list.
- Return valid JSON matching the schema:
{
  "matchScore": number (60-99),
  "headline": string (1 concise sentence explaining the match based ONLY on provided profile facts),
  "alignedSkills": string[],
  "missingOrAdjacentSkills": string[],
  "locationFit": string,
  "tailoringTips": string[] (2-3 actionable, truthful resume tailoring suggestions)
}

JOB LISTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Required Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : ''}
Description: ${String(job.description || '').slice(0, 600)}

CANDIDATE PROFILE:
Target Role: ${profile.targetRole || 'Not specified'}
Location: ${profile.location || 'Not specified'}
Verified Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : 'None provided yet'}
Summary: ${String(profile.summary || '').slice(0, 300)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
          geminiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      clearTimeout(timer);

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(rawText);
        if (typeof parsed?.headline === 'string') {
          return NextResponse.json({
            match: {
              matchScore:
                typeof parsed.matchScore === 'number'
                  ? Math.max(60, Math.min(99, Math.round(parsed.matchScore)))
                  : fallback.matchScore,
              engine: 'gemini-2.0-flash',
              headline: parsed.headline,
              alignedSkills: Array.isArray(parsed.alignedSkills)
                ? parsed.alignedSkills
                : fallback.alignedSkills,
              missingOrAdjacentSkills: Array.isArray(parsed.missingOrAdjacentSkills)
                ? parsed.missingOrAdjacentSkills
                : fallback.missingOrAdjacentSkills,
              locationFit:
                typeof parsed.locationFit === 'string' ? parsed.locationFit : fallback.locationFit,
              tailoringTips: Array.isArray(parsed.tailoringTips)
                ? parsed.tailoringTips
                : fallback.tailoringTips,
            } satisfies JobMatchExplanation,
          });
        }
      }
    } catch {
      clearTimeout(timer);
    }

    return NextResponse.json({ match: fallback });
  } catch {
    return NextResponse.json({ error: 'Invalid match request payload' }, { status: 400 });
  }
}
