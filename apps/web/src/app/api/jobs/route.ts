import { NextRequest, NextResponse } from 'next/server';
import {
  type NormalizedJobRecord,
  type ProviderHealthDetail,
  classifyRegionTag,
  deduplicateJobs,
  fetchAdzunaJobs,
  fetchArbeitnowJobs,
  fetchGreenhouseGccJobs,
  fetchHimalayasJobs,
  fetchJobicyJobs,
  fetchJSearchJobs,
  fetchRemotiveJobs,
  getRestrictedPartnerStatus,
  sanitizeExternalUrl,
} from './_providers';

export const dynamic = 'force-dynamic';

export type LiveJobRecord = NormalizedJobRecord;

interface JobsCacheEntry {
  timestamp: number;
  jobs: LiveJobRecord[];
  providerStatus: Record<string, 'ok' | 'degraded'>;
  providerDetails: ProviderHealthDetail[];
}

declare global {
  var __jobora_custom_jobs: LiveJobRecord[] | undefined;
  var __jobora_jobs_cache: Map<string, JobsCacheEntry> | undefined;
}

const customJobsStore: LiveJobRecord[] =
  global.__jobora_custom_jobs || (global.__jobora_custom_jobs = []);

const jobsCacheStore: Map<string, JobsCacheEntry> =
  global.__jobora_jobs_cache instanceof Map
    ? global.__jobora_jobs_cache
    : (global.__jobora_jobs_cache = new Map<string, JobsCacheEntry>());

const CACHE_TTL_MS = 3 * 60 * 1000; // 3-minute server-side cache per query/location filter

const CURATED_JOBS: LiveJobRecord[] = [
  {
    id: 'jobora-stripe-staff-product',
    title: 'Staff Product Designer, Financial Infrastructure',
    company: 'Stripe',
    location: 'San Francisco, CA',
    regionTag: 'Global',
    workMode: 'Hybrid',
    employmentType: 'Full-Time',
    salaryRange: '$210k – $265k',
    description:
      'Architect the core financial interfaces that power global internet commerce. Partner with engineering and product leadership to build composable design systems, merchant onboarding workflows, and AI-assisted treasury dashboards.',
    responsibilities: [
      'Lead end-to-end product design across Global Payouts and Treasury surfaces.',
      'Define multi-platform design tokens and interactive system primitives in Figma and React.',
      'Partner directly with Staff Engineers to ship high-craft, low-latency merchant experiences.',
      'Run customer synthesis sessions with enterprise CFOs and developer teams.',
    ],
    skills: ['Design Systems', 'Figma', 'Product Strategy', 'Fintech', 'Prototyping', 'React'],
    postedAt: '2h ago',
    sourceUrl: 'https://stripe.com/jobs',
    applicationUrl: 'https://stripe.com/jobs',
    source: 'Curated',
    recruiterName: 'Elena Rostova',
    recruiterEmail: 'elena.rostova@stripe-talent.example.com',
  },
  {
    id: 'jobora-anthropic-ai-eng',
    title: 'Full-Stack Software Engineer, Claude Product',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    regionTag: 'Global',
    workMode: 'Hybrid',
    employmentType: 'Full-Time',
    salaryRange: '$230k – $310k',
    description:
      'Build next-generation human-AI collaboration interfaces for Claude. You will own real-time streaming workspaces, artifact rendering pipelines, and enterprise knowledge integrations.',
    responsibilities: [
      'Architect resilient Next.js, TypeScript, and Python backend services for high-throughput LLM streaming.',
      'Design intuitive human-in-the-loop evaluation and prompt engineering workflows.',
      'Optimize end-to-end latency and client state synchronization across millions of sessions.',
    ],
    skills: ['TypeScript', 'React', 'Next.js', 'Python', 'LLM Systems', 'Distributed Systems'],
    postedAt: '4h ago',
    sourceUrl: 'https://www.anthropic.com/careers',
    applicationUrl: 'https://www.anthropic.com/careers',
    source: 'Curated',
    recruiterName: 'Marcus Vance',
    recruiterEmail: 'm.vance@anthropic-careers.example.com',
  },
  {
    id: 'jobora-linear-frontend',
    title: 'Senior Frontend Engineer, Core Experience',
    company: 'Linear',
    location: 'Remote (Global)',
    regionTag: 'Remote',
    workMode: 'Remote',
    employmentType: 'Full-Time',
    salaryRange: '$185k – $235k',
    description:
      'Craft hyper-responsive, keyboard-first software planning tools with local-first sync engines. We care deeply about 60fps interactions, sub-50ms transitions, and editorial precision.',
    responsibilities: [
      'Extend Linear’s custom client-side sync engine and local GraphQL storage layer.',
      'Build accessible, high-density UI components with zero layout shift.',
      'Collaborate closely with designers to refine micro-interactions and command menus.',
    ],
    skills: ['TypeScript', 'React', 'GraphQL', 'Local-First Sync', 'CSS Architecture', 'Performance'],
    postedAt: '6h ago',
    sourceUrl: 'https://linear.app/careers',
    applicationUrl: 'https://linear.app/careers',
    source: 'Curated',
    recruiterName: 'Clara Lindqvist',
    recruiterEmail: 'clara@linear-talent.example.com',
  },
  {
    id: 'jobora-vercel-dx',
    title: 'Staff Solutions & AI SDK Engineer',
    company: 'Vercel',
    location: 'Remote (US & EU)',
    regionTag: 'Remote',
    workMode: 'Remote',
    employmentType: 'Full-Time',
    salaryRange: '$195k – $245k',
    description:
      'Empower developers building with Next.js App Router and the Vercel AI SDK. Lead reference architectures, streaming UI primitives, and enterprise cloud migrations.',
    responsibilities: [
      'Develop production-grade Next.js and AI SDK templates used by hundreds of thousands of engineers.',
      'Debug edge-network caching, serverless cold-starts, and streaming RSC pipelines.',
      'Work with product teams to shape the roadmap of AI cloud primitives.',
    ],
    skills: ['Next.js', 'TypeScript', 'Node.js', 'Vercel AI SDK', 'Edge Compute', 'React Server Components'],
    postedAt: '1d ago',
    sourceUrl: 'https://vercel.com/careers',
    applicationUrl: 'https://vercel.com/careers',
    source: 'Curated',
    recruiterName: 'Devon Brooks',
    recruiterEmail: 'dbrooks@vercel-talent.example.com',
  },
];

function matchesLocationFilter(job: LiveJobRecord, locationFilter: string): boolean {
  if (!locationFilter) return true;
  const f = locationFilter.toLowerCase().trim();
  const loc = (job.location || '').toLowerCase();
  const region = (job.regionTag || '').toLowerCase();
  const mode = (job.workMode || '').toLowerCase();

  if (f === 'uae' || f === 'united arab emirates') {
    return (
      region === 'uae' ||
      loc.includes('dubai') ||
      loc.includes('abu dhabi') ||
      loc.includes('sharjah') ||
      loc.includes('uae') ||
      loc.includes('emirates')
    );
  }
  if (f === 'gcc' || f === 'mena') {
    return (
      region === 'uae' ||
      region === 'saudi arabia' ||
      region === 'qatar' ||
      region === 'gcc / mena'
    );
  }
  if (f === 'saudi arabia' || f === 'saudi' || f === 'riyadh') {
    return region === 'saudi arabia' || loc.includes('saudi') || loc.includes('riyadh') || loc.includes('jeddah');
  }
  if (f === 'qatar' || f === 'doha') {
    return region === 'qatar' || loc.includes('qatar') || loc.includes('doha');
  }
  if (f === 'remote') {
    return mode === 'remote' || region === 'remote' || loc.includes('remote');
  }

  return loc.includes(f) || mode.includes(f) || region.includes(f);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').toLowerCase().trim();
  const locationFilter = (searchParams.get('location') || '').toLowerCase().trim();
  const forceRefresh = searchParams.get('refresh') === '1';

  const cacheKey = `${query}::${locationFilter}`;
  const cached = jobsCacheStore.get(cacheKey);

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.timestamp < CACHE_TTL_MS &&
    cached.jobs.length > 0
  ) {
    const mergedCached = deduplicateJobs([...customJobsStore, ...cached.jobs]);
    return NextResponse.json({
      jobs: mergedCached,
      total: mergedCached.length,
      syncedAt: new Date(cached.timestamp).toISOString(),
      cached: true,
      providerStatus: cached.providerStatus,
      providerDetails: cached.providerDetails,
      restrictedPlatforms: getRestrictedPartnerStatus(),
    });
  }

  // Run all active & configured provider adapters concurrently with independent timeouts & graceful fallback
  const [
    greenhouseRes,
    remotiveRes,
    arbeitnowRes,
    jobicyRes,
    himalayasRes,
    jsearchRes,
    adzunaRes,
  ] = await Promise.all([
    fetchGreenhouseGccJobs(),
    fetchRemotiveJobs(query),
    fetchArbeitnowJobs(),
    fetchJobicyJobs(query),
    fetchHimalayasJobs(),
    fetchJSearchJobs(query, locationFilter),
    fetchAdzunaJobs(query),
  ]);

  const providerDetails: ProviderHealthDetail[] = [
    greenhouseRes.health,
    remotiveRes.health,
    arbeitnowRes.health,
    jobicyRes.health,
    himalayasRes.health,
    jsearchRes.health,
    adzunaRes.health,
  ];

  // Backward-compatible providerStatus dictionary for existing 39-check suite + UI
  const providerStatus: Record<string, 'ok' | 'degraded'> = {
    remotive: remotiveRes.health.status === 'ok' ? 'ok' : 'degraded',
    arbeitnow: arbeitnowRes.health.status === 'ok' ? 'ok' : 'degraded',
    greenhouse_gcc: greenhouseRes.health.status === 'ok' ? 'ok' : 'degraded',
    jobicy: jobicyRes.health.status === 'ok' ? 'ok' : 'degraded',
    himalayas: himalayasRes.health.status === 'ok' ? 'ok' : 'degraded',
    jsearch: jsearchRes.health.status === 'ok' ? 'ok' : 'degraded',
    adzuna: adzunaRes.health.status === 'ok' ? 'ok' : 'degraded',
  };

  // Order prioritizes UAE/GCC direct employer feeds & JSearch first, followed by Remotive, Arbeitnow, Jobicy, Himalayas, Adzuna, and Curated
  const combined = deduplicateJobs([
    ...customJobsStore,
    ...greenhouseRes.jobs,
    ...jsearchRes.jobs,
    ...CURATED_JOBS,
    ...remotiveRes.jobs,
    ...arbeitnowRes.jobs,
    ...jobicyRes.jobs,
    ...himalayasRes.jobs,
    ...adzunaRes.jobs,
  ]);

  const filtered = combined.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      job.skills.some((s) => s.toLowerCase().includes(query));

    const matchesLoc = matchesLocationFilter(job, locationFilter);
    return matchesQuery && matchesLoc;
  });

  jobsCacheStore.set(cacheKey, {
    timestamp: Date.now(),
    jobs: filtered,
    providerStatus,
    providerDetails,
  });

  return NextResponse.json({
    jobs: filtered,
    total: filtered.length,
    syncedAt: new Date().toISOString(),
    cached: false,
    providerStatus,
    providerDetails,
    restrictedPlatforms: getRestrictedPartnerStatus(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const company = String(body?.company || '').trim();

    if (!title || !company) {
      return NextResponse.json(
        { error: 'Job title and company name are required.' },
        { status: 400 }
      );
    }

    const location = String(body.location || 'Dubai, United Arab Emirates').trim();
    const workMode: 'Remote' | 'Hybrid' | 'On-site' = body.workMode || 'Hybrid';
    const sourceUrl = sanitizeExternalUrl(body.sourceUrl, 'https://www.linkedin.com/jobs');

    const newJob: LiveJobRecord = {
      id: `custom-${Date.now()}`,
      title,
      company,
      location,
      regionTag: classifyRegionTag(location, workMode),
      workMode,
      employmentType: String(body.employmentType || 'Full-Time').trim(),
      salaryRange: String(body.salaryRange || 'Salary Not Disclosed by Employer').trim(),
      description: String(
        body.description || `Custom role added for ${title} at ${company}.`
      ).trim(),
      responsibilities:
        Array.isArray(body.responsibilities) && body.responsibilities.length > 0
          ? body.responsibilities
          : [`Lead key initiatives as ${title} at ${company}.`],
      skills:
        Array.isArray(body.skills) && body.skills.length > 0
          ? body.skills
          : ['Strategy', 'Execution', 'Cross-functional Leadership'],
      postedAt: 'Just added',
      sourceUrl,
      applicationUrl: sourceUrl,
      source: 'Custom',
      recruiterName: String(body.recruiterName || `${company} Hiring Team`).trim(),
      recruiterEmail: String(
        body.recruiterEmail || `careers@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      ).trim(),
    };
    customJobsStore.unshift(newJob);
    jobsCacheStore.clear();
    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 });
  }
}
