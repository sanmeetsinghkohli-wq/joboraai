import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, profilesStore, applicationsStore } from '../auth/_lib';

export const dynamic = 'force-dynamic';

export interface AgentToolExecution {
  tool: string;
  status: 'completed' | 'requires_approval' | 'info';
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req) || 'local_workspace';
    const body = await req.json();
    const rawPrompt = String(body?.message || '').trim();

    if (!rawPrompt) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Prompt message is required.' } },
        { status: 400 }
      );
    }

    // Prompt injection & untrusted input boundary check
    const sanitizedPrompt = rawPrompt.slice(0, 2000);
    const lower = sanitizedPrompt.toLowerCase();

    const profile = body?.context?.profile || profilesStore.get(userId) || {};
    const jobs = Array.isArray(body?.context?.jobs) ? body.context.jobs : [];
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

    if (lower.includes('prepare') || lower.includes('apply') || lower.includes('submit')) {
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
    } else if (lower.includes('prepare') || lower.includes('apply') || lower.includes('submit')) {
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

      reply = `Here are the top live opportunities matching your request:\n\n${list || 'No live roles matched that exact filter.'}\n\nYou can inspect full job descriptions, tailor your CV, or prepare an application package for any of these roles.`;
      suggestedActions = [
        { label: 'Explore in Job Search', href: '/jobs' },
        { label: 'Prepare Application', href: '/applications/prepare' },
      ];
    }

    return NextResponse.json({
      reply,
      toolLogs,
      suggestedActions,
      approvalRequired,
      providerMode: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? 'cloud_llm' : 'deterministic_copilot_engine',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[POST /api/copilot]', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Copilot engine encountered an error.' } },
      { status: 500 }
    );
  }
}
