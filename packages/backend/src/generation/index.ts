import type { TailoredCVCandidate, CoverLetterDraft, AnswerDraft, Experience, Education, Project, Skill } from './types';
import type { CandidateProfile, StructuredJob } from '@jobora/types';

// ─── Tailored CV ─────────────────────────────────────────────────────────────
export function generateTailoredCV(
  profile: Partial<CandidateProfile>,
  job: StructuredJob
): TailoredCVCandidate {
  const relevantSkills = profile?.skills?.map((s) => s.name) || [];
  const jobSkills = [...job.requiredSkills, ...job.preferredSkills];

  // Order skills by relevance to job
  const skillsOrder = jobSkills.filter((s) => relevantSkills.includes(s))
    .concat(relevantSkills.filter((s) => !jobSkills.includes(s)))
    .filter((v, i, a) => a.indexOf(v) === i);

  // Experience rewrites
  const experienceRewrites: Experience[] = (profile?.experiences || []).map((exp) => {
    const bullets = exp.achievements || [];
    const hasQuantified = bullets.some((b) => /\d/.test(b));
    const rewritten = hasQuantified
      ? bullets.map((b) => b)
      : bullets.map((b) => b + ' (quantify results where possible)');
    return { ...exp, achievements: rewritten };
  });

  // Project rewrites
  const projectRewrites: Project[] = (profile?.projects || []).map((p) => {
    const tech = p.technologies || [];
    const relevant = jobSkills.filter((s) => tech.includes(s));
    return { ...p, technologies: relevant.length > 0 ? relevant : tech };
  });

  // Changes
  const changes: Array<{ section: string; original: string; proposed: string; type: 'add' | 'remove' | 'rewrite'; traceableTo: string }> = [];

  // Summary rewrite
  const summary = generateSummary(profile, job);
  if (summary) {
    changes.push({
      section: 'Summary',
      original: profile?.summary || '',
      proposed: summary,
      type: 'rewrite',
      traceableTo: 'profile.summary',
    });
  }

  // Skills ordering
  if (skillsOrder.length > 0) {
    changes.push({
      section: 'Skills',
      original: relevantSkills.join(', '),
      proposed: skillsOrder.join(', '),
      type: 'rewrite',
      traceableTo: 'verified skills',
    });
  }

  // Review flags
  const reviewFlags: Array<{ section: string; message: string; severity: 'info' | 'minor' | 'major' | 'critical' }> = [];
  if (profile?.experiences?.length === 0) {
    reviewFlags.push({ section: 'Experience', message: 'No work experience to rewrite. Add experience first.', severity: 'major' });
  }
  if (job.requiredSkills.some((s) => !relevantSkills.includes(s))) {
    reviewFlags.push({
      section: 'Skills',
      message: 'Missing skills required by this job — no verified skills to add.',
      severity: 'critical',
    });
  }
  if (!profile?.summary || profile.summary.length < 30) {
    reviewFlags.push({ section: 'Summary', message: 'Summary is short; consider expanding with job-specific context.', severity: 'minor' });
  }

  // ATS score
  const atsScore = Math.round(
    (skillsOrder.length / (jobSkills.length || 1)) * 0.4 +
    (job.experienceRequirements[0] ? 70 : 60) * 0.3 +
    ((profile?.education?.length ?? 0) > 0 ? 85 : 60) * 0.3
  );

  return {
    summary,
    skillsOrder,
    experienceRewrites,
    projectRewrites,
    changes,
    reviewFlags,
    atsScore,
  };
}

function generateSummary(profile: Partial<CandidateProfile>, job: StructuredJob): string {
  const role = job.title.toLowerCase();
  const skills = (profile?.skills || []).map((s) => s.name).join(', ');
  const expCount = profile?.experiences?.length || 0;
  const education = profile?.education?.[0]?.degree || '';

  const templates = [
    `Experienced ${role} with ${expCount} years of experience in ${skills}. ${education} with a strong focus on building scalable products and delivering measurable impact. Looking to leverage expertise in ${job.requiredSkills.slice(0, 3).join(', ')} to contribute to ${job.company}'s engineering team.`,
    `${education} ${role} with ${expCount} years of experience building ${job.requiredSkills.slice(0, 3).join(', ')}. Proven track record in delivering high-quality software and collaborating with cross-functional teams.`,
    `Software engineer with ${expCount} years of experience and expertise in ${skills}. ${education}. Seeking to contribute to ${job.company}'s mission through strong engineering practices and measurable results.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// ─── Cover letter ────────────────────────────────────────────────────────────
export function generateCoverLetter(
  profileId: string,
  job: StructuredJob,
  tailoredCV?: TailoredCVCandidate
): CoverLetterDraft {
  const profile = {} as CandidateProfile; // In real app, load from DB
  const skills = (profile?.skills || []).map((s) => s.name);
  const summary = tailoredCV?.summary || generateSummary(profile, job);

  const personalizationPoints = [
    `Role-specific: This letter targets ${job.title} at ${job.company}.`,
    `Skills alignment: CV highlights ${skills.slice(0, 3).join(', ')} which match job requirements.`,
    `Experience: ${profile?.experiences?.length || 0} years of relevant experience presented in tailored CV.`,
    `Location: Based in ${profile?.location || 'a location suitable for remote work'}.`,
    `Work mode: Role is ${job.workMode} which matches your ${profile?.workModePreference || 'preferred'} preference.`,
  ];

  const letter = `${summary}

I am excited to apply for the ${job.title} position at ${job.company}. With my background in ${profile?.experiences?.length || 0} years of software engineering and hands-on experience with ${skills.slice(0, 4).join(', ')}, I am confident I can deliver value from day one.

In my current role at ${profile?.experiences?.[0]?.company || 'my previous company'}, I ${profile?.experiences?.[0]?.description || 'built and shipped features that improved product performance and team velocity.'} I am particularly drawn to ${job.company}'s work in ${job.description.slice(0, 80)}.

I have attached a tailored CV that aligns my experience with the job requirements. Thank you for your consideration. I look forward to discussing how my skills and experiences can contribute to your team.

Sincerely,
${profile?.name || 'Alex Johnson'}`;
  return {
    coverLetter: letter,
    personalizationPoints,
    source: { profileId, jobId: job.id },
  };
}

// ─── Application answers ─────────────────────────────────────────────────────
export function draftApplicationAnswers(
  profileOrId: Partial<CandidateProfile> | string,
  job: StructuredJob,
  questions: string[]
): AnswerDraft[] {
  const profile: Partial<CandidateProfile> = typeof profileOrId === 'object' && profileOrId !== null
    ? profileOrId
    : { id: typeof profileOrId === 'string' ? profileOrId : 'profile-default' };

  const answers: AnswerDraft[] = [];

  for (const q of questions) {
    const lowerQ = q.toLowerCase();
    const missing: string[] = [];
    let draftAnswer = '';

    if (lowerQ.includes('experience') || lowerQ.includes('tell me about yourself') || lowerQ.includes('describe yourself')) {
      draftAnswer = `I'm a software engineer with ${profile?.experiences?.length || 0} years of experience building web applications. I specialize in ${profile?.skills?.map((s) => s.name).slice(0, 4).join(', ') || 'modern web technologies'}. In my recent role, I worked on projects that required strong collaboration and a focus on delivering quality software.`;
    } else if (lowerQ.includes('strengths') || lowerQ.includes('what are your strengths')) {
      draftAnswer = `My key strengths include problem-solving, writing clean and maintainable code, and working effectively in cross-functional teams. I'm also highly adaptable and enjoy learning new technologies quickly.`;
    } else if (lowerQ.includes('weaknesses') || lowerQ.includes('what are your weaknesses')) {
      draftAnswer = `I sometimes take on too much responsibility because I care deeply about doing a thorough job. I've been working on this by prioritising tasks and communicating more clearly about timelines and capacity.`;
    } else if (lowerQ.includes('why') && (lowerQ.includes('this company') || lowerQ.includes('why do you want'))) {
      draftAnswer = `I'm excited about ${job.company}'s work in ${job.description.slice(0, 60)}. Your focus on ${job.title.toLowerCase()} aligns with my interest in building products that make a meaningful impact.`;
    } else if (lowerQ.includes('where do you see yourself') || lowerQ.includes('career goals') || lowerQ.includes('5 years')) {
      draftAnswer = `In the next 5 years, I aim to grow into a senior engineering role, leading projects and mentoring junior developers. I'm looking for a place like ${job.company} where I can build impactful products and continue learning.`;
    } else {
      const skillsStr = profile?.skills?.map((s) => s.name).join(', ') || 'software engineering';
      draftAnswer = `Based on my verified experience with ${skillsStr}, I believe I can contribute effectively to this role. I bring practical experience, a collaborative mindset, and a commitment to continuous improvement.`;
    }

    // Check for missing info
    if (!profile?.summary || profile.summary.length < 10) missing.push('summary');
    if (!profile?.location) missing.push('location');

    answers.push({
      question: q,
      draftAnswer,
      missingUserInput: missing,
      confidence: 0.7,
      warnings: [],
    });
  }

  return answers;
}
