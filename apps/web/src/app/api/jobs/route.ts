import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, userJobsStore as sharedUserJobsStore, withUserData } from '../auth/_lib';
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
import { fetchEmployerBoardJobs } from './_employerBoards';
import { kvGetShared, kvSetShared } from '@/lib/db/kv';
import { inferEmploymentType } from './_providers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export type LiveJobRecord = NormalizedJobRecord;

interface JobsCacheEntry {
  timestamp: number;
  jobs: LiveJobRecord[];
  providerStatus: Record<string, 'ok' | 'degraded'>;
  providerDetails: ProviderHealthDetail[];
  fallbackActive: boolean;
}

declare global {
  var __jobora_user_jobs: Map<string, LiveJobRecord[]> | undefined;
  var __jobora_jobs_cache: Map<string, JobsCacheEntry> | undefined;
}

/** Roles a user adds themselves are private to that user. */
const userJobsStore = sharedUserJobsStore as unknown as Map<string, LiveJobRecord[]>;

function matchesQuery(job: LiveJobRecord, query: string): boolean {
  if (!query) return true;
  return (
    job.title.toLowerCase().includes(query) ||
    job.company.toLowerCase().includes(query) ||
    job.description.toLowerCase().includes(query) ||
    job.location.toLowerCase().includes(query) ||
    job.skills.some((s) => s.toLowerCase().includes(query))
  );
}

const jobsCacheStore: Map<string, JobsCacheEntry> =
  global.__jobora_jobs_cache instanceof Map
    ? global.__jobora_jobs_cache
    : (global.__jobora_jobs_cache = new Map<string, JobsCacheEntry>());

const CACHE_TTL_MS = 3 * 60 * 1000;
const SNAPSHOT_KEY = 'shared:jobs-snapshot';
/** The daily cron refreshes it; any full fetch also refreshes it. */
const SNAPSHOT_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 3-minute server-side cache per query/location filter

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
  if (f === 'india') {
    return region === 'india' || country === 'india';
  }
  const INDIA_CITIES: Record<string, string[]> = {
    bengaluru: ['bengaluru', 'bangalore'],
    mumbai: ['mumbai'],
    hyderabad: ['hyderabad'],
    pune: ['pune'],
    'delhi ncr': ['delhi', 'gurugram', 'gurgaon', 'noida'],
  };
  if (INDIA_CITIES[f]) {
    return INDIA_CITIES[f].some((c) => city.includes(c) || loc.includes(c));
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

async function GET_handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').toLowerCase().trim();
  const locationFilter = (searchParams.get('location') || '').toLowerCase().trim();
  const forceRefresh = searchParams.get('refresh') === '1';

  const userId = getAuthenticatedUserId(req);
  const mine = (userId ? userJobsStore.get(userId) || [] : []).filter(
    (job) => matchesQuery(job, query) && matchesLocationFilter(job, locationFilter)
  );

  const cacheKey = `${query}::${locationFilter}`;
  const cached = jobsCacheStore.get(cacheKey);

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.timestamp < CACHE_TTL_MS &&
    cached.jobs.length > 0
  ) {
    const mergedCached = deduplicateJobs([...mine, ...cached.jobs]);
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

  // A cold instance first tries the shared snapshot (refreshed by the daily cron and
  // by any full fetch), so most requests never hit the ~40 job boards directly.
  if (!query && !forceRefresh) {
    const snap = await kvGetShared<{ jobs: LiveJobRecord[]; providerDetails: ProviderHealthDetail[]; providerStatus: Record<string, 'ok' | 'degraded'> }>(SNAPSHOT_KEY).catch(() => null);
    if (snap && Date.now() - new Date(snap.updatedAt).getTime() < SNAPSHOT_MAX_AGE_MS && snap.value.jobs?.length) {
      const filtered = snap.value.jobs.filter((job) => matchesLocationFilter(job, locationFilter));
      jobsCacheStore.set(cacheKey, {
        timestamp: Date.now(),
        jobs: filtered,
        providerStatus: snap.value.providerStatus,
        providerDetails: snap.value.providerDetails,
        fallbackActive: false,
      });
      const merged = deduplicateJobs([...mine, ...filtered]);
      return NextResponse.json({
        jobs: merged,
        total: merged.length,
        syncedAt: snap.updatedAt,
        cached: true,
        fallbackActive: false,
        providerStatus: snap.value.providerStatus,
        providerDetails: snap.value.providerDetails,
        restrictedPlatforms: getRestrictedPartnerStatus(),
      });
    }
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
    employerRes,
  ] = await Promise.all([
    fetchGreenhouseGccJobs(),
    fetchRemotiveJobs(query),
    fetchArbeitnowJobs(),
    fetchJobicyJobs(query),
    fetchHimalayasJobs(),
    fetchJSearchJobs(query, locationFilter),
    fetchAdzunaJobs(query),
    fetchEmployerBoardJobs(),
  ]);

  const providerDetails: ProviderHealthDetail[] = [
    greenhouseRes.health,
    remotiveRes.health,
    arbeitnowRes.health,
    jobicyRes.health,
    himalayasRes.health,
    jsearchRes.health,
    adzunaRes.health,
    employerRes.health,
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
    employer_boards: employerRes.health.status === 'ok' ? 'ok' : 'degraded',
  };

  // Combine ONLY genuine live provider listings (plus any user-submitted custom jobs)
  const liveProviderJobs = [
    ...greenhouseRes.jobs,
    ...employerRes.jobs,
    ...jsearchRes.jobs,
    ...remotiveRes.jobs,
    ...arbeitnowRes.jobs,
    ...jobicyRes.jobs,
    ...himalayasRes.jobs,
    ...adzunaRes.jobs,
  ]
    .map((job) => ({ ...job, employmentType: inferEmploymentType(job.title, job.employmentType) }));

  const fallbackActive = liveProviderJobs.length === 0;
  // When every provider is unreachable the list is simply empty; the client
  // shows that state rather than a placeholder listing.
  const providerFiltered = deduplicateJobs(liveProviderJobs).filter(
    (job) => matchesQuery(job, query) && matchesLocationFilter(job, locationFilter)
  );

  if (!query && liveProviderJobs.length > 0) {
    kvSetShared(SNAPSHOT_KEY, { jobs: deduplicateJobs(liveProviderJobs), providerDetails, providerStatus });
  }

  // Only shared provider results are cached — never a user's private roles.
  jobsCacheStore.set(cacheKey, {
    timestamp: Date.now(),
    jobs: providerFiltered,
    providerStatus,
    providerDetails,
    fallbackActive,
  });

  const filtered = deduplicateJobs([...mine, ...providerFiltered]);

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

async function POST_handler(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sign in to add a role.' } },
        { status: 401 }
      );
    }
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const company = String(body?.company || '').trim();

    if (!title || !company) {
      return NextResponse.json(
        { error: 'Job title and company name are required.' },
        { status: 400 }
      );
    }

    const rawLocation = String(body.location || '').trim();
    const workMode: 'Remote' | 'Hybrid' | 'On-site' = ['Remote', 'Hybrid', 'On-site'].includes(body.workMode)
      ? body.workMode
      : 'On-site';
    const locMeta = rawLocation
      ? normalizeLocationAndRegion(rawLocation, title, workMode)
      : { location: '', city: undefined, country: undefined };
    const sourceUrl = sanitizeExternalUrl(body.sourceUrl, '');

    // A role the user adds contains only what they typed — no filler text or skills.
    const newJob: LiveJobRecord = {
      id: `custom-${Date.now()}`,
      title,
      company,
      location: locMeta.location,
      city: locMeta.city,
      country: locMeta.country,
      regionTag: rawLocation ? classifyRegionTag(locMeta.location, workMode, title) : 'Global',
      workMode,
      employmentType: String(body.employmentType || '').trim(),
      salaryRange: String(body.salaryRange || '').trim(),
      description: String(body.description || '').trim().slice(0, 20000),
      responsibilities: Array.isArray(body.responsibilities)
        ? body.responsibilities.map((r: unknown) => String(r)).slice(0, 30)
        : [],
      skills: Array.isArray(body.skills)
        ? body.skills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 30)
        : [],
      postedAt: 'Added by you',
      postedTimestamp: Date.now(),
      sourceUrl,
      applicationUrl: sourceUrl,
      source: 'Added by you',
      recruiterName: body.recruiterName ? String(body.recruiterName).trim() : undefined,
      recruiterEmail: body.recruiterEmail ? String(body.recruiterEmail).trim() : undefined,
    };
    const mine = userJobsStore.get(userId) || [];
    mine.unshift(newJob);
    userJobsStore.set(userId, mine.slice(0, 200));
    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 });
  }
}

export const GET = withUserData(GET_handler);
export const POST = withUserData(POST_handler);
