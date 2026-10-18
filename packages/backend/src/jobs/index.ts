import { z } from 'zod';
import type { JobSearchInput, JobSearchResult, ParsedJob, MatchResult, JobDetail, JobSearchJob, JobMatch, MatchFactor, Seniority } from './types';
import { generateMockJobs, generateMockMatches } from '@jobora/mocks';
import type { CandidateProfile } from '@jobora/types';

const JobSearchInputSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    location: z.string().optional(),
    workMode: z.array(z.enum(['remote', 'hybrid', 'onsite'])).optional(),
    jobType: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary'])).optional(),
    seniority: z.array(z.enum(['internship', 'junior', 'mid-senior', 'director', 'executive'])).optional(),
    industries: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    datePosted: z.string().optional(),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
  }).optional(),
  page: z.number().min(1).max(100).default(1),
  pageSize: z.number().min(1).max(50).default(12),
  sortBy: z.enum(['relevance', 'posted', 'match', 'salary']).default('relevance'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Search ──────────────────────────────────────────────────────────────────
export function searchJobs(input: Partial<JobSearchInput>): JobSearchResult {
  const parsed = JobSearchInputSchema.safeParse(input);
  const opts = parsed.success ? parsed.data : {
    query: undefined,
    filters: undefined,
    page: 1,
    pageSize: 12,
    sortBy: 'relevance' as const,
    sortDirection: 'desc' as const,
  };

  const jobs = generateMockJobs(60);

  // Apply query filter
  let filtered = jobs;
  if (opts.query) {
    const q = opts.query.toLowerCase();
    filtered = filtered.filter((j) =>
      j.title.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q)
    );
  }

  // Apply filters
  filtered = filtered.filter((j) => {
    if (opts.filters?.location && !j.location.toLowerCase().includes(opts.filters.location.toLowerCase())) return false;
    if (opts.filters?.workMode && !opts.filters.workMode.includes(j.workMode)) return false;
    if (opts.filters?.jobType && !opts.filters.jobType.includes(j.jobType)) return false;
    if (opts.filters?.seniority && !opts.filters.seniority.includes(j.seniority)) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    switch (opts.sortBy) {
      case 'posted':
        return opts.sortDirection === 'desc'
          ? new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          : new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
      case 'salary':
        if (a.salaryIfExplicit === null && b.salaryIfExplicit === null) return 0;
        if (a.salaryIfExplicit === null) return 1;
        if (b.salaryIfExplicit === null) return -1;
        return opts.sortDirection === 'desc'
          ? b.salaryIfExplicit - a.salaryIfExplicit
          : a.salaryIfExplicit - b.salaryIfExplicit;
      default:
        return 0;
    }
  });

  // Paginate
  const page = opts.page;
  const pageSize = opts.pageSize;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  // Facet counts
  const facetCounts: Record<string, number[]> = {
    workMode: [0, 0, 0],
    jobType: [0, 0, 0, 0, 0],
    seniority: [0, 0, 0, 0, 0],
  };
  for (const j of filtered) {
    facetCounts.workMode![['remote', 'hybrid', 'onsite'].indexOf(j.workMode)]++;
    facetCounts.jobType![['full-time', 'part-time', 'contract', 'internship', 'temporary'].indexOf(j.jobType)]++;
    facetCounts.seniority![['internship', 'junior', 'mid-senior', 'director', 'executive'].indexOf(j.seniority)]++;
  }

  return {
    jobs: paged,
    total,
    page,
    pageSize,
    totalPages,
    facetCounts,
  };
}

// ─── Get job ─────────────────────────────────────────────────────────────────
export function getJob(id: string): JobDetail | null {
  const jobs = generateMockJobs(60);
  return jobs.find((j) => j.id === id) || null;
}

// ─── Parse job description ────────────────────────────────────────────────────
export function parseJobDescription(description: string, sourceUrl: string): ParsedJob {
  const lines = description.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const lower = description.toLowerCase();

  const title = lines[0] || 'Untitled Position';
  const company = extractBetween(title, /at\s+(.+)/i) || 'Unknown Company';

  const location = extractBetween(description, /\b(location|seniority|onsite|remote|hybrid)\b[^.]{0,80}/i) || null;
  const workMode = /remote/i.test(lower) ? 'remote' : /hybrid/i.test(lower) ? 'hybrid' : 'onsite';

  const jobType = /contract/i.test(lower) ? 'contract' : /intern/i.test(lower) ? 'internship' : /temporary/i.test(lower) ? 'temporary' : 'full-time';

  const seniority = extractBetween(description, /\b(seniority|level|position)\b[^.]{0,60}/i) || 'mid-senior';

  const requiredSkills = extractSkills(description, 'required');
  const preferredSkills = extractSkills(description, 'preferred');

  const educationRequirements = extractLines(description, ['degree', 'bachelor', 'master', 'phd', 'education']);
  const experienceRequirements = extractLines(description, ['experience', 'years', 'senior']);

  const responsibilities = extractLines(description, ['responsibilities', 'duties', 'will be responsible', 'role']);
  const salary = extractSalary(description);
  const benefits = extractLines(description, ['benefit', 'perks', 'bonus', 'insurance']);
  const applicationUrl = extractUrl(description);

  return {
    title,
    company,
    location: location || 'Remote',
    workMode,
    jobType,
    seniority: (['internship', 'junior', 'mid-senior', 'director', 'executive'].includes(seniority) ? seniority : 'mid-senior') as Seniority,
    requiredSkills,
    preferredSkills,
    educationRequirements,
    experienceRequirements,
    responsibilities,
    salaryIfExplicit: salary,
    benefitsIfExplicit: benefits,
    applicationUrl,
    source: sourceUrl.replace(/^https?:\/\//, '').split('/')[0] || 'unknown',
    rawDescription: description,
    sourceUrl,
  };
}

function extractBetween(str: string, pattern: RegExp): string | null {
  const match = str.match(pattern) || str.match(/(?<=:\s*)[^.]{0,120}/i);
  return match?.[0]?.trim() || null;
}

function extractSkills(description: string, type: string): string[] {
  const lower = description.toLowerCase();
  const keys: { pattern: RegExp; skill: string }[] = [
    { pattern: /\breact|reactjs|react.js\b/gi, skill: 'React' },
    { pattern: /\btypescript|ts\b/gi, skill: 'TypeScript' },
    { pattern: /\bnode\.?js|nodejs|node js\b/gi, skill: 'Node.js' },
    { pattern: /\bpython\b/gi, skill: 'Python' },
    { pattern: /\bfastapi\b/gi, skill: 'FastAPI' },
    { pattern: /\bnext\.?js|nextjs|next.js\b/gi, skill: 'Next.js' },
    { pattern: /\btypescript|tailwind|css|postcss|styled-components\b/gi, skill: 'CSS / Styling' },
    { pattern: /\bpostgresql|postgres|supabase|pgvector\b/gi, skill: 'PostgreSQL' },
    { pattern: /\bdocker|container|kubernetes|helm\b/gi, skill: 'Docker' },
    { pattern: /\bgit|github|gitlab|version control\b/gi, skill: 'Git' },
    { pattern: /\bgraphql|rest|api|endpoint|http\b/gi, skill: 'REST APIs' },
    { pattern: /\bplaywright|selenium|cypress|testing\b/gi, skill: 'Testing' },
    { pattern: /\bmachine learning|ml\b|ai\b|llm\b/gi, skill: 'Machine Learning' },
    { pattern: /\bredis|rabbitmq\kafka\b/gi, skill: 'Message Queues' },
    { pattern: /\bstored procedures|trigger|index|optimization\b/gi, skill: 'SQL' },
  ];

  const found: string[] = [];
  const seen = new Set<string>();

  for (const { pattern, skill } of keys) {
    if (pattern.test(lower) && !seen.has(skill)) {
      seen.add(skill);
      found.push(skill);
    }
  }

  return found;
}

function extractLines(description: string, keywords: string[]): string[] {
  const lower = description.toLowerCase();
  const lines: string[] = [];
  const check = (line: string) => keywords.some((k) => line.toLowerCase().includes(k));

  for (const line of description.split(/\n/)) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 150 && check(trimmed) && !/http/.test(trimmed)) {
      lines.push(trimmed);
    }
  }

  return lines.slice(0, 8);
}

function extractSalary(description: string): number | null {
  const matches = description.match(/(?:\$|usd|salary)[^0-9]{0,20}(\d{3,6})(?:[-–]\s*(\d{3,6}))?/i);
  if (matches) {
    const base = parseInt(matches[1], 10);
    const range = matches[2] ? (parseInt(matches[2], 10) - base) / 2 : 0;
    return base + range;
  }
  const annualMatch = description.match(/(\d{3,6})\s*(?:per\s*)?(?:year|annum|yr)/i);
  if (annualMatch) return parseInt(annualMatch[1], 10);

  const hourlyMatch = description.match(/(\d{3,5})\s*(?:per\s*)?(?:hr|hour)/i);
  if (hourlyMatch) return parseInt(hourlyMatch[1], 10) * 2080;

  return null;
}

function extractUrl(description: string): string | null {
  const match = description.match(/(https?:\/\/[^\s]+)/);
  return match?.[0] || null;
}

// ─── Job matching ────────────────────────────────────────────────────────────
export function computeJobMatch(
  profile: Partial<CandidateProfile>,
  job: JobDetail,
  userId: string
): JobMatch {
  const profileSkills = new Set((profile?.skills?.map((s) => s.name.toLowerCase()) || []));
  const jobSkills = job.requiredSkills.map((s) => s.toLowerCase());
  const jobPreferred = job.preferredSkills.map((s) => s.toLowerCase());

  const matchingSkills = jobSkills.filter((s) => profileSkills.has(s));
  const missingOrWeak = jobSkills.filter((s) => !profileSkills.has(s));

  // Skill alignment
  const skillMatchCount = matchingSkills.length;
  const totalJobSkills = jobSkills.length + jobPreferred.length;
  const skillAlignment = totalJobSkills > 0 ? skillMatchCount / totalJobSkills : 0;

  // Experience alignment
  const expYears = profile?.experiences?.reduce((sum, e) => {
    const start = new Date(e.startDate).getFullYear();
    const end = e.current ? new Date().getFullYear() : new Date(e.endDate).getFullYear();
    return sum + (end - start);
  }, 0) || 0;

  const reqYears = job.experienceRequirements[0]?.match(/(\d+)/)?.[1] || '3';
  const reqYearsNum = parseInt(reqYears, 10);
  const expAlignment = Math.min(1, expYears / (reqYearsNum + 2));

  // Education alignment
  const hasDegree = profile?.education?.some((e) => e.degree.toLowerCase().includes('bachelor') || e.degree.toLowerCase().includes('master'));
  const eduAlignment = hasDegree ? 0.9 : 0.5;

  // Location alignment
  const locationAlignment = profile?.location
    ? job.location.toLowerCase().includes(profile.location.toLowerCase()) || job.location === 'Remote' ? 1.0 : 0.5
    : 0.3;

  // Work mode alignment
  const workModeAlignment = job.workMode === 'remote' && profile?.workModePreference === 'remote' ? 1.0
    : job.workMode === 'remote' && profile?.workModePreference === 'onsite' ? 0.3
    : job.workMode === 'onsite' && profile?.workModePreference === 'remote' ? 0.2
    : 0.6;

  // Combined score
  const overallScore = Math.round(
    (skillAlignment * 0.35) +
    (expAlignment * 0.25) +
    (eduAlignment * 0.15) +
    (locationAlignment * 0.15) +
    (workModeAlignment * 0.1) * 100
  );

  // Matching/weak factors
  const matchingSkillsTotal = [...matchingSkills];
  const otherFactors = [
    'Years of experience align' + (expYears >= 4 ? ' (5+ years)' : ''),
    'Remote work preference matches' + (job.workMode === 'remote' ? ' ✓' : ' ⚠'),
    'Location alignment' + (locationAlignment >= 0.8 ? ' ✓' : ''),
  ].filter(Boolean);

  const summary = `Your profile aligns with ${skillMatchCount} of ${jobSkills.length} required skills. ${missingOrWeak.length > 0 ? `${missingOrWeak.length} skill(s) to build: ${missingOrWeak.join(', ')}. ` : ''} ${expYears} years of experience. ${hasDegree ? 'Relevant degree.' : 'Consider additional education.'}`;

  return {
    jobId: job.id,
    userId,
    overallScore,
    matchingSkills: matchingSkillsTotal,
    missingOrWeakRequirements: missingOrWeak,
    experienceAlignment: Math.round(expAlignment * 100) / 100,
    educationAlignment: Math.round(eduAlignment * 100) / 100,
    locationAlignment: Math.round(locationAlignment * 100) / 100,
    workModeAlignment: Math.round(workModeAlignment * 100) / 100,
    otherFactors,
    summary,
    matchedAt: new Date(),
  };
}

export function jobSearchToDetail(job: JobSearchJob): JobDetail {
  return {
    id: job.id,
    source: job.source,
    sourceUrl: job.sourceUrl,
    title: job.title,
    company: job.company,
    description: job.description,
    location: job.location,
    workMode: job.workMode,
    jobType: job.jobType,
    seniority: job.seniority,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    educationRequirements: job.educationRequirements,
    experienceRequirements: job.experienceRequirements,
    responsibilities: job.responsibilities,
    salaryIfExplicit: job.salaryIfExplicit,
    benefitsIfExplicit: job.benefitsIfExplicit,
    applicationUrl: job.applicationUrl,
    postedAt: job.postedAt,
    matchFactors: job.matchFactors || null,
    rawContent: job.description,
  };
}
