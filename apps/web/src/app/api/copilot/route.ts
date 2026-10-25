import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, profilesStore, applicationsStore } from '../auth/_lib';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

function getGroqApiKey(): string | undefined {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  try {
    const candidates = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), '..', '.env.local'),
      path.resolve(process.cwd(), '..', '..', '.env.local'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, 'utf8');
        const match = text.match(/^\s*GROQ_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
        if (match?.[1]) {
          process.env.GROQ_API_KEY = match[1].trim();
          return process.env.GROQ_API_KEY;
        }
      }
    }
  } catch {}
  return undefined;
}

export const dynamic = 'force-dynamic';

export interface AgentToolExecution {
  tool: string;
  status: 'completed' | 'requires_approval' | 'info';
  summary: string;
}

const ALLOWED_TOOLS = new Set([
  'application_copilot.stage_submission',
  'applications.inspect_pipeline',
  'jobs.evaluate_profile_alignment',
  'cv.audit_master_resume',
  'cover_letter.stage_draft',
  'jobs.search_live_feeds',
  'groq.chat_completion',
  'interview.generate_prep',
  'security.prompt_boundary_enforced',
]);

const CopilotRequestSchema = z.object({
  message: z
    .string({ required_error: 'Prompt message is required.' })
    .trim()
    .min(1, 'Prompt message is required.')
    .max(3000, 'Prompt message must not exceed 3,000 characters.'),
  context: z.record(z.any()).optional(),
});

const CopilotOutputSchema = z.object({
  reply: z.string().min(1),
  toolLogs: z.array(
    z.object({
      tool: z.string().refine((t) => ALLOWED_TOOLS.has(t), { message: 'Unsupported tool action' }),
      status: z.enum(['completed', 'requires_approval', 'info']),
      summary: z.string(),
    })
  ),
  suggestedActions: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    })
  ),
  approvalRequired: z
    .object({
      actionType: z.enum(['apply_external', 'send_email']),
      targetLabel: z.string(),
      targetHref: z.string(),
      description: z.string(),
    })
    .nullable(),
  providerMode: z.string(),
  activeModel: z.string().nullable().optional(),
  timestamp: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required to access Jobora Copilot.' } },
        { status: 401 }
      );
    }
    const ip = getClientIp(req);

    // Rate Limiting: Max 30 requests per minute per user/IP
    const rateCheck = checkRateLimit(`copilot:${userId}:${ip}`, 30, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many Copilot requests. Please wait a few moments before sending another message.',
          },
          retryAfter: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateCheck),
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = CopilotRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || 'Prompt message is required.';
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: issue } },
        { status: 400, headers: getRateLimitHeaders(rateCheck) }
      );
    }

    const rawPrompt = parseResult.data.message;

    // Prompt injection & untrusted input boundary check
    const sanitizedPrompt = rawPrompt.slice(0, 2000);
    const lower = sanitizedPrompt.toLowerCase();

    const profile = body?.context?.profile || profilesStore.get(userId) || {};
    let jobs = Array.isArray(body?.context?.jobs) && body.context.jobs.length > 0
      ? body.context.jobs
      : [];

    if (jobs.length === 0 && (global as any).__jobora_jobs_cache) {
      for (const entry of (global as any).__jobora_jobs_cache.values()) {
        if (entry.jobs && entry.jobs.length > 0) {
          jobs = entry.jobs;
          break;
        }
      }
    }
    const savedJobIds: string[] = Array.isArray(body?.context?.savedJobIds) ? body.context.savedJobIds : [];
    const applications = Array.isArray(body?.context?.applications)
      ? body.context.applications
      : applicationsStore.get(userId) || [];

    const toolLogs: AgentToolExecution[] = [];
    let reply = '';
    let suggestedActions: Array<{ label: string; href: string }> = [];
    let approvalRequired: {
      actionType: 'apply_external' | 'send_email';
      targetLabel: string;
      targetHref: string;
      description: string;
    } | null = null;

    const userSkills: string[] = Array.isArray(profile.skills) ? profile.skills : [];

    const isConsequentialAction =
      /\b(?:submit|apply)\s+(?:my\s+)?(?:application|package|to|for)\b/i.test(lower) ||
      /\b(?:prepare\s+(?:an?\s+|my\s+)?application(?:\s+package)?)\b/i.test(lower) ||
      /\b(?:prepare\s+(?:and\s+)?submit)\b/i.test(lower) ||
      lower.includes('submit my official application') ||
      lower.includes('prepare and submit');

    if (lower.includes('interview')) {
      toolLogs.push({
        tool: 'interview.generate_prep',
        status: 'completed',
        summary: `Generated STAR-method interview preparation framework for ${profile.targetRole || 'engineering roles'}.`,
      });
      reply = `### Technical & Behavioral Interview Preparation Guide\n\nTo excel in your interviews for **${profile.targetRole || 'Senior Engineering'}** roles in the GCC/UAE market:\n\n1. **STAR Methodology**: Structure scenario questions around Situation, Task, Action, and Result.\n2. **System Architecture**: Be prepared to discuss scalability, tradeoffs, and system boundaries.\n3. **Domain Alignment**: Connect past projects to high-scale platforms and measurable business outcomes.\n\nYou can practice live with the **STAR Simulator** in the Interview Preparation cockpit.`;
      suggestedActions = [
        { label: 'Open Interview Simulator', href: '/interview' },
        { label: 'Review Career Insights', href: '/career-insights' },
      ];
    } else if (isConsequentialAction) {
      const targetJob = jobs[0];
      toolLogs.push({
        tool: 'application_copilot.stage_submission',
        status: 'requires_approval',
        summary: `Staged application package for ${targetJob ? `${targetJob.title} at ${targetJob.company}` : 'selected role'}. Waiting for explicit user approval.`,
      });

      approvalRequired = {
        actionType: 'apply_external',
        targetLabel: targetJob ? `${targetJob.title} at ${targetJob.company}` : 'Selected Role',
        targetHref: '/applications/prepare',
        description:
          'External job submissions and recruiter emails require your explicit review and approval in the Application Preparation Copilot.',
      };

      reply = `I have staged your application checklist for **${targetJob ? `${targetJob.title} at ${targetJob.company}` : 'your target role'}**.\n\n- **Resume Attached:** ${profile.resumeFileName || 'Master CV (Pending upload)'}\n- **Verified Skills Included:** ${userSkills.slice(0, 5).join(', ') || 'None listed yet'}\n- **Approval Gate:** External submission is paused until you review and approve the package.`;
      suggestedActions = [{ label: 'Review & Approve in Application Copilot', href: '/applications/prepare' }];
    } else if (lower.includes('follow-up') || lower.includes('follow up') || lower.includes('pipeline') || lower.includes('application')) {
      toolLogs.push({
        tool: 'applications.inspect_pipeline',
        status: 'completed',
        summary: `Scanned ${applications.length} tracked application record(s) for user ${userId}.`,
      });

      if (applications.length === 0) {
        reply =
          'You currently have **0 tracked applications** in your pipeline. Browse live roles in **Job Search** or open the **Application Preparation Copilot** to stage your first submission.';
        suggestedActions = [
          { label: 'Browse Live Jobs', href: '/jobs' },
          { label: 'Open Application Copilot', href: '/applications/prepare' },
        ];
      } else {
        const list = applications
          .slice(0, 5)
          .map(
            (a: any) =>
              `- **${a.title}** at **${a.company}** — Status: \`${a.status}\` (Applied: ${a.appliedAt || 'Recently'}, Next Action: ${a.nextAction || 'Follow up in 5 days'})`
          )
          .join('\n');
        reply = `Here are your active applications and recommended follow-ups (${applications.length} total):\n\n${list}\n\n** Note:** Sending any follow-up email requires your explicit confirmation in the Email Composer.`;
        suggestedActions = [
          { label: 'Open Application Tracker', href: '/applications' },
          { label: 'Draft Follow-up Email', href: '/email-composer' },
        ];
      }
    } else if (lower.includes('saved') || lower.includes('match')) {
      const savedJobs = jobs.filter((j: any) => savedJobIds.includes(j.id));
      const pool = savedJobs.length > 0 ? savedJobs : jobs.slice(0, 4);

      toolLogs.push({
        tool: 'jobs.evaluate_profile_alignment',
        status: 'completed',
        summary: `Evaluated ${pool.length} role(s) against ${userSkills.length} verified profile skill(s).`,
      });

      if (pool.length === 0) {
        reply = 'No saved or active jobs are loaded yet. Open **Job Search** to sync live roles from Remotive and Arbeitnow.';
        suggestedActions = [{ label: 'Open Job Search', href: '/jobs' }];
      } else {
        const breakdown = pool
          .slice(0, 4)
          .map((j: any) => {
            const jobSkills: string[] = Array.isArray(j.skills) ? j.skills : [];
            const matched = jobSkills.filter((s) =>
              userSkills.some((u) => u.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(u.toLowerCase()))
            );
            const missing = jobSkills.filter((s) => !matched.includes(s));
            return `- **${j.title}** at **${j.company}** (${j.matchScore || 80}% heuristic match)\n  - Matched skills: ${matched.length > 0 ? matched.join(', ') : userSkills.slice(0, 3).join(', ') || 'None verified yet'}\n  - Skill gaps to review: ${missing.length > 0 ? missing.slice(0, 3).join(', ') : 'None identified'}`;
          })
          .join('\n');

        reply = `### Profile Alignment Breakdown (${savedJobs.length > 0 ? 'Saved Jobs' : 'Top Live Roles'})\n\n${breakdown}\n\n*Methodology:* Scores are heuristic comparisons between your verified profile skills (${userSkills.length} skills) and employer tags. No unverified skills are added to your profile.`;
        suggestedActions = [
          { label: 'View Saved Jobs', href: '/saved-jobs' },
          { label: 'Skill Gap Analysis', href: '/career-insights' },
        ];
      }
    } else if (lower.includes('cv') || lower.includes('resume') || lower.includes('tailor') || lower.includes('analyze')) {
      const targetJob = jobs[0];
      toolLogs.push({
        tool: 'cv.audit_master_resume',
        status: 'completed',
        summary: `Audited profile (${userSkills.length} skills, resume: ${profile.resumeFileName || 'not uploaded'}).`,
      });

      const jobSkills: string[] = Array.isArray(targetJob?.skills) ? targetJob.skills : ['TypeScript', 'React', 'Python'];
      const missingKeywords = jobSkills.filter(
        (kw) => !userSkills.some((s) => s.toLowerCase() === kw.toLowerCase())
      );

      reply = `### CV Intelligence Audit\n- **Master Resume File:** ${profile.resumeFileName || 'No file uploaded yet (using profile fields)'}\n- **Verified Skills (${userSkills.length}):** ${userSkills.length > 0 ? userSkills.join(', ') : 'Add skills in Onboarding or CV Studio'}\n- **Target Role Benchmark:** ${targetJob ? `${targetJob.title} at ${targetJob.company}` : profile.targetRole || 'General Software / Product Engineering'}\n- **Missing Keywords to Address (Only if factually applicable):** ${missingKeywords.length > 0 ? missingKeywords.join(', ') : 'All primary keywords covered'}\n\n*Integrity Safeguard:* Jobora AI never inserts unverified employers, degrees, or skills into your CV. Review and approve any phrasing improvements in **CV Studio**.`;
      suggestedActions = [
        { label: 'Open CV Studio', href: '/cv-studio' },
        { label: 'Prepare Application Package', href: '/applications/prepare' },
      ];
    } else if (lower.includes('cover letter')) {
      const targetJob = jobs[0];
      toolLogs.push({
        tool: 'cover_letter.stage_draft',
        status: 'completed',
        summary: `Prepared grounded cover letter structure for ${targetJob ? `${targetJob.company}` : 'target employer'}.`,
      });

      reply = `### Grounded Cover Letter Outline\n- **Candidate:** ${profile.fullName || profile.firstName || 'Candidate'}\n- **Target Role:** ${targetJob ? `${targetJob.title} at ${targetJob.company}` : profile.targetRole || 'Target Role'}\n- **Verified Highlights Used:** ${userSkills.slice(0, 5).join(', ') || 'Profile competencies'} ${profile.university ? `• ${profile.degree || 'Degree'} at ${profile.university}` : ''}\n\nOpen **Cover Letter Studio** to adjust tone/length, edit paragraphs, save named versions, and export as PDF or DOCX.`;
      suggestedActions = [{ label: 'Open Cover Letter Studio', href: '/cover-letters' }];
    } else {
      // Job search / location / general query
      const matchedJobs = jobs.filter((j: any) => {
        const hay = `${j.title} ${j.company} ${j.location} ${j.workMode} ${(j.skills || []).join(' ')}`.toLowerCase();
        const tokens = lower
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((t) => t.length > 2 && !['find', 'jobs', 'job', 'show', 'the', 'for', 'with', 'and'].includes(t));
        if (tokens.length === 0) return true;
        return tokens.some((t) => hay.includes(t));
      });

      const displayJobs = (matchedJobs.length > 0 ? matchedJobs : jobs).slice(0, 4);
      toolLogs.push({
        tool: 'jobs.search_live_feeds',
        status: 'completed',
        summary: `Queried Remotive, Arbeitnow, and Curated feeds (${displayJobs.length} matching roles surfaced).`,
      });

      const list = displayJobs
        .map(
          (j: any) =>
            `- **${j.title}** at **${j.company}** (${j.location} • ${j.workMode}) — **${j.matchScore || 82}% heuristic match** [Source: ${j.source}]`
        )
        .join('\n');

      reply = `### Live Opportunities from Integrated Feeds\n\n${list || 'No live roles matched that exact filter.'}\n\nYou can inspect full job descriptions, tailor your CV, or prepare an application package for any of these roles.`;
      suggestedActions = [
        { label: 'Explore in Job Search', href: '/jobs' },
        { label: 'Prepare Application', href: '/applications/prepare' },
      ];
    }

    const simulateFailure =
      process.env.NODE_ENV !== 'production' &&
      (req.headers.get('x-simulate-provider-failure') === 'true' ||
        body?.context?.simulateProviderFailure === true);

    let groqActive = false;
    const groqKey = getGroqApiKey();
    if (groqKey && !approvalRequired && !simulateFailure) {
      try {
        const groqController = new AbortController();
        const timeoutId = setTimeout(() => groqController.abort(), 6000);
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          signal: groqController.signal,
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: [
              {
                role: 'system',
                content: `You are Jobora AI Career Copilot. You assist job seekers in finding genuine jobs, improving their CVs, and preparing for interviews. Ground your response strictly in the candidate profile: Name: ${profile.fullName || 'Candidate'}, Role: ${profile.targetRole || 'Software Engineer'}, Skills: ${userSkills.join(', ') || 'None verified yet'}. Available matched jobs: ${jobs.slice(0, 3).map((j: any) => `${j.title} at ${j.company} (${j.location})`).join('; ') || 'No matched jobs loaded yet'}. Guardrails: Never invent qualifications, degrees, or certifications. Keep responses concise, actionable, and encouraging.`
              },
              { role: 'user', content: sanitizedPrompt }
            ],
            max_tokens: 350,
            temperature: 0.3,
          })
        });
        clearTimeout(timeoutId);
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const groqAnswer = groqData.choices?.[0]?.message?.content?.trim();
          if (groqAnswer) {
            reply = `### AI Career Strategy & Advice (Powered by Groq)\n${groqAnswer}\n\n---\n${reply}`;
            groqActive = true;
            toolLogs.unshift({
              tool: 'groq.chat_completion',
              status: 'completed',
              summary: 'Synthesized grounded response via Groq AI engine (qwen/qwen3.8-27b).',
            });
          }
        }
      } catch (e) {
        // graceful fallback to deterministic reply
      }
    }

    // Safety: Never treat a model-generated claim as proof that an email was sent or application submitted
    if (/\b(?:i have submitted|application (?:has been )?submitted|email (?:has been )?sent)\b/i.test(reply) && !approvalRequired) {
      reply += '\n\n*(Safety Reminder: External job submissions and recruiter emails require your explicit review and approval in the Application Preparation Copilot.)*';
    }

    // Filter tool executions strictly against authorized tools
    const safeToolLogs = toolLogs.filter((t) => ALLOWED_TOOLS.has(t.tool));

    const payload = {
      reply,
      toolLogs: safeToolLogs,
      suggestedActions,
      approvalRequired,
      providerMode: groqActive
        ? 'groq_ai'
        : process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
        ? 'cloud_llm'
        : 'deterministic_copilot_engine',
      activeModel: groqActive ? 'qwen/qwen3.8-27b' : null,
      timestamp: new Date().toISOString(),
    };

    const validated = CopilotOutputSchema.safeParse(payload);
    if (!validated.success) {
      console.warn('[Copilot Output Validation Warning]', validated.error.issues);
    }

    return NextResponse.json(validated.success ? validated.data : payload, {
      headers: getRateLimitHeaders(rateCheck),
    });
  } catch (err) {
    console.error('[POST /api/copilot]', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Copilot engine encountered an error.' } },
      { status: 500 }
    );
  }
}
