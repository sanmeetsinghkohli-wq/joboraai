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
  normalizeLocationAndRegion,
  sanitizeExternalUrl,
} from './_providers';

export const dynamic = 'force-dynamic';

export type LiveJobRecord = NormalizedJobRecord;

interface JobsCacheEntry {
  timestamp: number;
  jobs: LiveJobRecord[];
  providerStatus: Record<string, 'ok' | 'degraded'>;
  providerDetails: ProviderHealthDetail[];
  fallbackActive: boolean;
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

/**
 * Emergency offline fallback records — ONLY returned if ALL live external providers fail or time out.
 * Never mixed into normal live provider responses.
 */
const EMERGENCY_FALLBACK_JOBS: LiveJobRecord[] = [
  {
    id: 'fallback-careem-dubai',
    title: 'Senior Product Designer (Design Systems)',
    company: 'Careem',
    location: 'Dubai, United Arab Emirates',
    city: 'Dubai',
    country: 'United Arab Emirates',
    regionTag: 'UAE',
    workMode: 'Hybrid',
    employmentType: 'Full-Time',
    salaryRange: 'Salary Not Disclosed by Employer',
    description:
      'Emergency offline fallback listing: Lead Careem’s regional design system across Super App mobility, fintech, and delivery experiences in Dubai.',
    responsibilities: [
      'Architect multi-platform design tokens and accessible UI primitives.',
      'Partner with product and engineering teams in Dubai and across the MENA region.',
    ],
    skills: ['Design Systems', 'Figma', 'Product Design', 'Prototyping', 'Mobile UX'],
    postedAt: 'Offline Fallback',
    sourceUrl: 'https://boards.greenhouse.io/careem',
    applicationUrl: 'https://boards.greenhouse.io/careem',
    source: 'Offline Fallback (All Live Providers Unreachable)',
    recruiterName: 'Careem Talent Acquisition',
  },
];

function matchesLocationFilter(job: LiveJobRecord, locationFilter: string): boolean {
  if (!locationFilter) return true;
  const f = locationFilter.toLowerCase().trim();
  const loc = (job.location || '').toLowerCase();
  const city = (job.city || '').toLowerCase();
  const country = (job.country || '').toLowerCase();
  const region = (job.regionTag || '').toLowerCase();
  const mode = (job.workMode || '').toLowerCase();

  if (f === 'uae' || f === 'united arab emirates') {
    return (
      region === 'uae' ||
      country === 'united arab emirates' ||
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
    return (
      region === 'saudi arabia' ||
      country === 'saudi arabia' ||
      city === 'riyadh' ||
      loc.includes('saudi') ||
      loc.includes('riyadh') ||
      loc.includes('jeddah')
    );
  }
  if (f === 'qatar' || f === 'doha') {
    return (
      region === 'qatar' ||
      country === 'qatar' ||
      city === 'doha' ||
      loc.includes('qatar') ||
      loc.includes('doha')
    );
  }
  if (f === 'dubai') {
    return city === 'dubai' || loc.includes('dubai');
  }
  if (f === 'abu dhabi') {
    return city === 'abu dhabi' || loc.includes('abu dhabi');
  }
  if (f === 'sharjah') {
    return city === 'sharjah' || loc.includes('sharjah');
  }
  if (f === 'remote') {
    return mode === 'remote' || region === 'remote' || loc.includes('remote');
  }

  return (
    loc.includes(f) ||
    city.includes(f) ||
    country.includes(f) ||
    mode.includes(f) ||
    region.includes(f)
  );
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
      fallbackActive: cached.fallbackActive,
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

  // Backward-compatible providerStatus dictionary
  const providerStatus: Record<string, 'ok' | 'degraded'> = {
    remotive: remotiveRes.health.status === 'ok' ? 'ok' : 'degraded',
    arbeitnow: arbeitnowRes.health.status === 'ok' ? 'ok' : 'degraded',
    greenhouse_gcc: greenhouseRes.health.status === 'ok' ? 'ok' : 'degraded',
    jobicy: jobicyRes.health.status === 'ok' ? 'ok' : 'degraded',
    himalayas: himalayasRes.health.status === 'ok' ? 'ok' : 'degraded',
    jsearch: jsearchRes.health.status === 'ok' ? 'ok' : 'degraded',
    adzuna: adzunaRes.health.status === 'ok' ? 'ok' : 'degraded',
  };

  // Combine ONLY genuine live provider listings (plus any user-submitted custom jobs)
  const liveProviderJobs = [
    ...greenhouseRes.jobs,
    ...jsearchRes.jobs,
    ...remotiveRes.jobs,
    ...arbeitnowRes.jobs,
    ...jobicyRes.jobs,
    ...himalayasRes.jobs,
    ...adzunaRes.jobs,
  ];

  const fallbackActive = liveProviderJobs.length === 0;
  const combined = deduplicateJobs([
    ...customJobsStore,
    ...(fallbackActive ? EMERGENCY_FALLBACK_JOBS : liveProviderJobs),
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
    fallbackActive,
  });

  return NextResponse.json({
    jobs: filtered,
    total: filtered.length,
    syncedAt: new Date().toISOString(),
    cached: false,
    fallbackActive,
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

    const rawLocation = String(body.location || 'Dubai, United Arab Emirates').trim();
    const workMode: 'Remote' | 'Hybrid' | 'On-site' = body.workMode || 'Hybrid';
    const locMeta = normalizeLocationAndRegion(rawLocation, title, workMode);
    const sourceUrl = sanitizeExternalUrl(body.sourceUrl, 'https://boards.greenhouse.io/careem');

    const newJob: LiveJobRecord = {
      id: `custom-${Date.now()}`,
      title,
      company,
      location: locMeta.location,
      city: locMeta.city,
      country: locMeta.country,
      regionTag: classifyRegionTag(locMeta.location, workMode, title),
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
      postedTimestamp: Date.now(),
      sourceUrl,
      applicationUrl: sourceUrl,
      source: 'User Custom Job',
      recruiterName: String(body.recruiterName || `${company} Hiring Team`).trim(),
      recruiterEmail: body.recruiterEmail ? String(body.recruiterEmail).trim() : undefined,
    };
    customJobsStore.unshift(newJob);
    jobsCacheStore.clear();
    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 });
  }
}
