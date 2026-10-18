/**
 * Jobora AI — Multi-Provider Job Aggregation & Normalization Engine
 *
 * Supported Providers:
 * 1. Remotive (Public REST API — No Auth required, active)
 * 2. Arbeitnow (Public REST API — No Auth required, active)
 * 3. Greenhouse GCC & MENA Direct Employer Feeds (Public Official ATS JSON — Careem, Tamara, Deliveroo, Binance UAE — No Auth required, active)
 * 4. Jobicy (Public REST API — No Auth required, active)
 * 5. Himalayas (Public REST API — No Auth required, active)
 * 6. JSearch / OpenWeb Ninja (RapidAPI / Direct REST — Requires JSEARCH_API_KEY, covers UAE/GCC/Global via Google for Jobs index)
 * 7. Adzuna (Official REST API — Requires ADZUNA_APP_ID & ADZUNA_APP_KEY; supports UK/US/EU/AU/IN/SG/ZA; does NOT natively cover UAE/GCC)
 *
 * Restricted / Partner-Only Platforms (NOT fabricated or scraped):
 * - LinkedIn: No public Job Search API exists (Talent Solutions Job Posting API is outbound-only for vetted partners).
 * - Indeed: Public Job Search API deprecated & shut down; Indeed Apply / Job Sync require B2B partner approval.
 * - Glassdoor: Legacy public API discontinued (HTTP 410 Gone); enterprise partner-only.
 * - Bayt: Enterprise ATS / Talentera partner integration only; no public self-serve search API.
 * - NaukriGulf: Info Edge commercial recruiter / Resdex subscription required; no public search API.
 */

export type JobProviderId =
  | 'remotive'
  | 'arbeitnow'
  | 'greenhouse_gcc'
  | 'jobicy'
  | 'himalayas'
  | 'jsearch'
  | 'adzuna';

export type ProviderHealthState =
  | 'ok'
  | 'degraded'
  | 'rate_limited'
  | 'unconfigured'
  | 'partner_required';

export interface ProviderHealthDetail {
  id: string;
  name: string;
  status: ProviderHealthState;
  latencyMs: number | null;
  jobsReturned: number;
  lastSyncedAt: string | null;
  requiresCredentials: boolean;
  configured: boolean;
  gccCoverage: 'Native UAE/GCC' | 'Global + Remote' | 'Non-GCC Markets Only' | 'Partner Restricted';
  note?: string;
}

export interface NormalizedJobRecord {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  regionTag: 'UAE' | 'Saudi Arabia' | 'Qatar' | 'GCC / MENA' | 'Remote' | 'Global';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  employmentType: string;
  salaryRange: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  postedAt: string;
  sourceUrl: string;
  applicationUrl: string;
  source: string;
  recruiterEmail?: string;
  recruiterName?: string;
}

export function stripHtml(html: string): string {
  return String(html || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeExternalUrl(url: unknown, fallback: string): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return fallback;
}

export function classifyRegionTag(
  location: string,
  workMode: string
): 'UAE' | 'Saudi Arabia' | 'Qatar' | 'GCC / MENA' | 'Remote' | 'Global' {
  const loc = (location || '').toLowerCase();
  if (
    loc.includes('dubai') ||
    loc.includes('abu dhabi') ||
    loc.includes('sharjah') ||
    loc.includes('united arab emirates') ||
    loc.includes('uae')
  ) {
    return 'UAE';
  }
  if (loc.includes('riyadh') || loc.includes('jeddah') || loc.includes('saudi') || loc.includes('ksa')) {
    return 'Saudi Arabia';
  }
  if (loc.includes('doha') || loc.includes('qatar')) {
    return 'Qatar';
  }
  if (
    loc.includes('bahrain') ||
    loc.includes('kuwait') ||
    loc.includes('oman') ||
    loc.includes('amman') ||
    loc.includes('jordan') ||
    loc.includes('cairo') ||
    loc.includes('mena') ||
    loc.includes('gcc')
  ) {
    return 'GCC / MENA';
  }
  if (loc.includes('remote') || workMode.toLowerCase() === 'remote') {
    return 'Remote';
  }
  return 'Global';
}

export function extractSkillsFromText(title: string, description: string, tags: string[] = []): string[] {
  const cleanTags = tags
    .map((t) => String(t || '').trim())
    .filter((t) => t.length > 1 && t.length <= 32);
  if (cleanTags.length >= 3) {
    return Array.from(new Set(cleanTags)).slice(0, 6);
  }

  const corpus = `${title} ${description}`.toLowerCase();
  const dictionary = [
    'TypeScript',
    'React',
    'Next.js',
    'Python',
    'Node.js',
    'Go',
    'Java',
    'Kubernetes',
    'AWS',
    'Docker',
    'SQL',
    'Data Science',
    'Machine Learning',
    'AI Systems',
    'Product Management',
    'Product Design',
    'Figma',
    'Design Systems',
    'Fintech',
    'Growth Strategy',
    'B2B Sales',
    'Account Management',
    'Operations',
    'Analytics',
    'Cloud Architecture',
    'Cybersecurity',
    'GraphQL',
  ];

  const matched = dictionary.filter((skill) => corpus.includes(skill.toLowerCase()));
  const combined = Array.from(new Set([...cleanTags, ...matched]));
  if (combined.length > 0) return combined.slice(0, 6);
  return ['Cross-Functional Execution', 'Stakeholder Alignment', 'Domain Expertise'];
}

export function normalizeEmploymentType(raw: unknown): string {
  const s = String(raw || '').toLowerCase();
  if (s.includes('part')) return 'Part-Time';
  if (s.includes('contract') || s.includes('freelance')) return 'Contract';
  if (s.includes('intern')) return 'Internship';
  return 'Full-Time';
}

export function formatRelativeDate(dateInput: unknown): string {
  if (!dateInput) return 'Recently';
  const parsed = new Date(String(dateInput));
  if (Number.isNaN(parsed.getTime())) return String(dateInput);
  const diffHours = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 14) return `${diffDays}d ago`;
  return parsed.toLocaleDateString();
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const { timeoutMs = 4000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface AdapterResult {
  jobs: NormalizedJobRecord[];
  health: ProviderHealthDetail;
}

/**
 * 1. Remotive Public Adapter (Preserved)
 */
export async function fetchRemotiveJobs(
  query: string,
  fetchImpl: typeof fetch = fetch
): Promise<AdapterResult> {
  const start = Date.now();
  const baseHealth: ProviderHealthDetail = {
    id: 'remotive',
    name: 'Remotive Live API',
    status: 'degraded',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: false,
    configured: true,
    gccCoverage: 'Global + Remote',
  };

  try {
    const remotiveUrl = query
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=10`
      : 'https://remotive.com/api/remote-jobs?limit=10';
    const res = await fetchWithTimeout(remotiveUrl, { timeoutMs: 3800 }, fetchImpl);
    const latencyMs = Date.now() - start;

    if (res.status === 429) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'rate_limited', latencyMs, note: 'Rate limit reached (HTTP 429)' },
      };
    }
    if (!res.ok) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'degraded', latencyMs, note: `HTTP ${res.status}` },
      };
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.jobs) ? data.jobs.slice(0, 10) : [];
    const jobs: NormalizedJobRecord[] = rawList.map((item: Record<string, unknown>) => {
      const title = String(item.title || 'Software Engineer');
      const company = String(item.company_name || 'Tech Partner');
      const location = String(item.candidate_required_location || 'Remote');
      const cleanDesc = stripHtml(String(item.description || '')).slice(0, 480);
      const url = sanitizeExternalUrl(item.url, 'https://remotive.com');
      const tags = Array.isArray(item.tags) ? (item.tags as string[]) : [];

      return {
        id: `remotive-${item.id}`,
        title,
        company,
        companyLogo: typeof item.company_logo === 'string' ? item.company_logo : null,
        location,
        regionTag: classifyRegionTag(location, 'Remote'),
        workMode: 'Remote',
        employmentType: normalizeEmploymentType(item.job_type),
        salaryRange: String(item.salary || '').trim() || 'Salary Not Disclosed by Employer',
        description: cleanDesc ? `${cleanDesc}...` : 'Remote opportunity via Remotive.',
        responsibilities: [
          `Deliver high-impact solutions as ${title} at ${company}.`,
          'Collaborate asynchronously with distributed engineering and product teams.',
          'Write clean, maintainable, well-tested production code and documentation.',
        ],
        skills: extractSkillsFromText(title, cleanDesc, tags),
        postedAt: formatRelativeDate(item.publication_date),
        sourceUrl: url,
        applicationUrl: url,
        source: 'Remotive',
        recruiterName: `${company} Talent Team`,
      };
    });

    return {
      jobs,
      health: {
        ...baseHealth,
        status: 'ok',
        latencyMs,
        jobsReturned: jobs.length,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      jobs: [],
      health: {
        ...baseHealth,
        status: 'degraded',
        latencyMs: Date.now() - start,
        note: err instanceof Error ? err.message : 'Timeout or network error',
      },
    };
  }
}

/**
 * 2. Arbeitnow Public Adapter (Preserved)
 */
export async function fetchArbeitnowJobs(fetchImpl: typeof fetch = fetch): Promise<AdapterResult> {
  const start = Date.now();
  const baseHealth: ProviderHealthDetail = {
    id: 'arbeitnow',
    name: 'Arbeitnow Tech API',
    status: 'degraded',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: false,
    configured: true,
    gccCoverage: 'Global + Remote',
  };

  try {
    const res = await fetchWithTimeout(
      'https://www.arbeitnow.com/api/job-board-api',
      { timeoutMs: 3800 },
      fetchImpl
    );
    const latencyMs = Date.now() - start;

    if (res.status === 429) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'rate_limited', latencyMs, note: 'Rate limit reached (HTTP 429)' },
      };
    }
    if (!res.ok) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'degraded', latencyMs, note: `HTTP ${res.status}` },
      };
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.data) ? data.data.slice(0, 8) : [];
    const jobs: NormalizedJobRecord[] = rawList.map((item: Record<string, unknown>) => {
      const title = String(item.title || 'Specialist Role');
      const company = String(item.company_name || 'Global Employer');
      const location = String(item.location || 'Remote / Europe');
      const workMode: 'Remote' | 'Hybrid' = item.remote ? 'Remote' : 'Hybrid';
      const cleanDesc = stripHtml(String(item.description || '')).slice(0, 480);
      const url = sanitizeExternalUrl(item.url, 'https://www.arbeitnow.com');
      const tags = Array.isArray(item.tags) ? (item.tags as string[]) : [];

      return {
        id: `arbeitnow-${item.slug}`,
        title,
        company,
        companyLogo: null,
        location,
        regionTag: classifyRegionTag(location, workMode),
        workMode,
        employmentType: 'Full-Time',
        salaryRange: 'Salary Not Disclosed by Employer',
        description: cleanDesc ? `${cleanDesc}...` : 'Live opportunity via Arbeitnow.',
        responsibilities: [
          `Own core deliverables for ${title} at ${company}.`,
          'Partner with cross-functional stakeholders to ship measurable outcomes.',
        ],
        skills: extractSkillsFromText(title, cleanDesc, tags),
        postedAt: formatRelativeDate(item.created_at ? Number(item.created_at) * 1000 : null),
        sourceUrl: url,
        applicationUrl: url,
        source: 'Arbeitnow',
        recruiterName: `${company} Recruiting`,
      };
    });

    return {
      jobs,
      health: {
        ...baseHealth,
        status: 'ok',
        latencyMs,
        jobsReturned: jobs.length,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      jobs: [],
      health: {
        ...baseHealth,
        status: 'degraded',
        latencyMs: Date.now() - start,
        note: err instanceof Error ? err.message : 'Timeout or network error',
      },
    };
  }
}

/**
 * 3. Official Greenhouse Public ATS Feeds for UAE & GCC Employers
 * Fetches live UAE, Saudi Arabia, and MENA roles directly from official Greenhouse public JSON boards
 * (Careem Dubai, Tamara Dubai/Riyadh, Deliveroo UAE, Binance UAE).
 */
const GCC_GREENHOUSE_BOARDS = [
  { slug: 'careem', company: 'Careem', defaultLocation: 'Dubai, United Arab Emirates' },
  { slug: 'tamara', company: 'Tamara', defaultLocation: 'Riyadh, Saudi Arabia / Dubai, UAE' },
  { slug: 'deliveroo', company: 'Deliveroo Middle East', defaultLocation: 'Dubai, United Arab Emirates' },
];

export async function fetchGreenhouseGccJobs(
  fetchImpl: typeof fetch = fetch
): Promise<AdapterResult> {
  const start = Date.now();
  const baseHealth: ProviderHealthDetail = {
    id: 'greenhouse_gcc',
    name: 'UAE & GCC Employer ATS (Careem, Tamara, Deliveroo)',
    status: 'degraded',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: false,
    configured: true,
    gccCoverage: 'Native UAE/GCC',
  };

  try {
    const boardPromises = GCC_GREENHOUSE_BOARDS.map(async (board) => {
      const url = `https://boards-api.greenhouse.io/v1/boards/${board.slug}/jobs?content=true`;
      const res = await fetchWithTimeout(url, { timeoutMs: 4200 }, fetchImpl);
      if (!res.ok) return [];
      const data = await res.json();
      const rawJobs = Array.isArray(data?.jobs) ? data.jobs : [];

      // Prioritize UAE, Saudi Arabia, Qatar, Jordan, and MENA locations
      const gccFiltered = rawJobs.filter((j: Record<string, unknown>) => {
        const locObj = j.location as { name?: string } | undefined;
        const locName = String(locObj?.name || '').toLowerCase();
        return (
          locName.includes('dubai') ||
          locName.includes('abu dhabi') ||
          locName.includes('sharjah') ||
          locName.includes('emirates') ||
          locName.includes('uae') ||
          locName.includes('riyadh') ||
          locName.includes('jeddah') ||
          locName.includes('saudi') ||
          locName.includes('qatar') ||
          locName.includes('doha') ||
          locName.includes('amman') ||
          locName.includes('jordan')
        );
      });

      return gccFiltered.slice(0, 6).map((item: Record<string, unknown>): NormalizedJobRecord => {
        const title = String(item.title || 'GCC Role');
        const locObj = item.location as { name?: string } | undefined;
        const location = String(locObj?.name || board.defaultLocation);
        const cleanDesc = stripHtml(String(item.content || '')).slice(0, 480);
        const url = sanitizeExternalUrl(
          item.absolute_url,
          `https://boards.greenhouse.io/${board.slug}`
        );
        const workMode: 'Remote' | 'Hybrid' | 'On-site' = location.toLowerCase().includes('remote')
          ? 'Remote'
          : 'Hybrid';

        return {
          id: `gh-${board.slug}-${item.id}`,
          title,
          company: board.company,
          companyLogo: null,
          location,
          regionTag: classifyRegionTag(location, workMode),
          workMode,
          employmentType: 'Full-Time',
          salaryRange: 'Salary Not Disclosed by Employer',
          description: cleanDesc
            ? `${cleanDesc}...`
            : `Official ${board.company} opportunity in ${location}.`,
          responsibilities: [
            `Drive high-impact execution as ${title} at ${board.company} (${location}).`,
            'Collaborate with regional product, engineering, and commercial teams across the GCC.',
            'Deliver measurable customer and operational outcomes in a high-growth MENA market.',
          ],
          skills: extractSkillsFromText(title, cleanDesc),
          postedAt: formatRelativeDate(item.updated_at),
          sourceUrl: url,
          applicationUrl: url,
          source: `Greenhouse (${board.company})`,
          recruiterName: `${board.company} Talent Acquisition`,
        };
      });
    });

    const settled = await Promise.allSettled(boardPromises);
    const jobs: NormalizedJobRecord[] = [];
    for (const res of settled) {
      if (res.status === 'fulfilled') {
        jobs.push(...res.value);
      }
    }

    const latencyMs = Date.now() - start;
    if (jobs.length === 0) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'degraded', latencyMs, note: 'No GCC ATS jobs returned' },
      };
    }

    return {
      jobs,
      health: {
        ...baseHealth,
        status: 'ok',
        latencyMs,
        jobsReturned: jobs.length,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      jobs: [],
      health: {
        ...baseHealth,
        status: 'degraded',
        latencyMs: Date.now() - start,
        note: err instanceof Error ? err.message : 'Network error',
      },
    };
  }
}

/**
 * 4. Jobicy Public Remote Jobs API Adapter
 */
export async function fetchJobicyJobs(
  query: string,
  fetchImpl: typeof fetch = fetch
): Promise<AdapterResult> {
  const start = Date.now();
  const baseHealth: ProviderHealthDetail = {
    id: 'jobicy',
    name: 'Jobicy Global API',
    status: 'degraded',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: false,
    configured: true,
    gccCoverage: 'Global + Remote',
  };

  try {
    const url = query
      ? `https://jobicy.com/api/v2/remote-jobs?count=8&tag=${encodeURIComponent(query)}`
      : 'https://jobicy.com/api/v2/remote-jobs?count=8';
    const res = await fetchWithTimeout(url, { timeoutMs: 3800 }, fetchImpl);
    const latencyMs = Date.now() - start;

    if (res.status === 429) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'rate_limited', latencyMs, note: 'Rate limit (429)' },
      };
    }
    if (!res.ok) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'degraded', latencyMs, note: `HTTP ${res.status}` },
      };
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.jobs) ? data.jobs.slice(0, 8) : [];
    const jobs: NormalizedJobRecord[] = rawList.map((item: Record<string, unknown>) => {
      const title = stripHtml(String(item.jobTitle || 'Remote Specialist'));
      const company = stripHtml(String(item.companyName || 'Global Partner'));
      const location = String(item.jobGeo || 'Remote (Worldwide)');
      const cleanDesc = stripHtml(String(item.jobExcerpt || item.jobDescription || '')).slice(0, 480);
      const jobUrl = sanitizeExternalUrl(item.url, 'https://jobicy.com/jobs');

      let salaryRange = 'Salary Not Disclosed by Employer';
      if (item.annualSalaryMin && item.annualSalaryMax) {
        const currency = String(item.salaryCurrency || 'USD');
        salaryRange = `${currency} ${Number(item.annualSalaryMin).toLocaleString()} – ${Number(
          item.annualSalaryMax
        ).toLocaleString()}`;
      }

      const industryTags = Array.isArray(item.jobIndustry)
        ? (item.jobIndustry as string[]).map((t) => stripHtml(t))
        : [];

      return {
        id: `jobicy-${item.id}`,
        title,
        company,
        companyLogo: typeof item.companyLogo === 'string' ? item.companyLogo : null,
        location,
        regionTag: classifyRegionTag(location, 'Remote'),
        workMode: 'Remote',
        employmentType: normalizeEmploymentType(
          Array.isArray(item.jobType) ? item.jobType[0] : item.jobType
        ),
        salaryRange,
        description: cleanDesc ? `${cleanDesc}...` : `Remote role at ${company} via Jobicy.`,
        responsibilities: [
          `Lead execution for ${title} at ${company}.`,
          'Collaborate with distributed global teams across timezones.',
        ],
        skills: extractSkillsFromText(title, cleanDesc, industryTags),
        postedAt: formatRelativeDate(item.pubDate),
        sourceUrl: jobUrl,
        applicationUrl: jobUrl,
        source: 'Jobicy',
        recruiterName: `${company} Hiring Team`,
      };
    });

    return {
      jobs,
      health: {
        ...baseHealth,
        status: 'ok',
        latencyMs,
        jobsReturned: jobs.length,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      jobs: [],
      health: {
        ...baseHealth,
        status: 'degraded',
        latencyMs: Date.now() - start,
        note: err instanceof Error ? err.message : 'Timeout or network error',
      },
    };
  }
}

/**
 * 5. Himalayas Public Remote Jobs API Adapter
 */
export async function fetchHimalayasJobs(fetchImpl: typeof fetch = fetch): Promise<AdapterResult> {
  const start = Date.now();
  const baseHealth: ProviderHealthDetail = {
    id: 'himalayas',
    name: 'Himalayas Remote API',
    status: 'degraded',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: false,
    configured: true,
    gccCoverage: 'Global + Remote',
  };

  try {
    const res = await fetchWithTimeout(
      'https://himalayas.app/jobs/api?limit=8',
      { timeoutMs: 3800 },
      fetchImpl
    );
    const latencyMs = Date.now() - start;

    if (res.status === 429) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'rate_limited', latencyMs, note: 'Rate limit (429)' },
      };
    }
    if (!res.ok) {
      return {
        jobs: [],
        health: { ...baseHealth, status: 'degraded', latencyMs, note: `HTTP ${res.status}` },
      };
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.jobs) ? data.jobs.slice(0, 8) : [];
    const jobs: NormalizedJobRecord[] = rawList.map((item: Record<string, unknown>, idx: number) => {
      const title = String(item.title || 'Remote Engineer');
      const company = String(item.companyName || 'Himalayas Partner');
      const locRestr = Array.isArray(item.locationRestrictions)
        ? (item.locationRestrictions as string[]).join(', ')
        : '';
      const location = locRestr || 'Remote (Global / EMEA)';
      const cleanDesc = stripHtml(String(item.excerpt || item.description || '')).slice(0, 480);
      const appUrl = sanitizeExternalUrl(
        item.applicationLink || item.guid,
        'https://himalayas.app/jobs'
      );

      let salaryRange = 'Salary Not Disclosed by Employer';
      if (item.minSalary && item.maxSalary) {
        const currency = String(item.currency || 'USD');
        salaryRange = `${currency} ${Number(item.minSalary).toLocaleString()} – ${Number(
          item.maxSalary
        ).toLocaleString()}`;
      }

      const categories = Array.isArray(item.categories) ? (item.categories as string[]) : [];

      return {
        id: `himalayas-${item.guid ? String(item.guid).split('/').pop() : idx}`,
        title,
        company,
        companyLogo: typeof item.companyLogo === 'string' ? item.companyLogo : null,
        location,
        regionTag: classifyRegionTag(location, 'Remote'),
        workMode: 'Remote',
        employmentType: normalizeEmploymentType(item.employmentType),
        salaryRange,
        description: cleanDesc ? `${cleanDesc}...` : `Remote role at ${company} via Himalayas.`,
        responsibilities: [
          `Deliver key milestones as ${title} at ${company}.`,
          'Operate with high autonomy in a remote-first engineering culture.',
        ],
        skills: extractSkillsFromText(title, cleanDesc, categories),
        postedAt: formatRelativeDate(item.pubDate ? Number(item.pubDate) * 1000 : null),
        sourceUrl: appUrl,
        applicationUrl: appUrl,
        source: 'Himalayas',
        recruiterName: `${company} Talent Team`,
      };
    });

    return {
      jobs,
      health: {
        ...baseHealth,
        status: 'ok',
        latencyMs,
        jobsReturned: jobs.length,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      jobs: [],
      health: {
        ...baseHealth,
        status: 'degraded',
        latencyMs: Date.now() - start,
        note: err instanceof Error ? err.message : 'Timeout or network error',
      },
    };
  }
}

/**
 * 6. JSearch API Adapter (OpenWeb Ninja / RapidAPI)
 * Aggregates Google for Jobs listings across UAE (Dubai, Abu Dhabi, Sharjah), Saudi Arabia, Qatar, and global markets.
 * Requires server-side JSEARCH_API_KEY.
 */
export async function fetchJSearchJobs(
  query: string,
  locationFilter: string,
  fetchImpl: typeof fetch = fetch
): Promise<AdapterResult> {
  const apiKey = process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY || '';
  const apiHost = process.env.JSEARCH_API_HOST || 'jsearch.p.rapidapi.com';
  const start = Date.now();

  const baseHealth: ProviderHealthDetail = {
    id: 'jsearch',
    name: 'JSearch UAE/GCC Aggregator (RapidAPI)',
    status: apiKey ? 'degraded' : 'unconfigured',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: true,
    configured: Boolean(apiKey),
    gccCoverage: 'Native UAE/GCC',
    note: apiKey
      ? undefined
      : 'Set JSEARCH_API_KEY in server environment to enable live Google-for-Jobs UAE/GCC indexing.',
  };

  if (!apiKey) {
    return { jobs: [], health: baseHealth };
  }

  try {
    const searchQuery =
      query || locationFilter
        ? `${query || 'Software Engineer'} in ${locationFilter || 'Dubai, United Arab Emirates'}`
        : 'Software Engineer in Dubai, United Arab Emirates';

    const params = new URLSearchParams({
      query: searchQuery,
      page: '1',
      num_pages: '1',
    });

    const locLower = (locationFilter || '').toLowerCase();
    if (locLower.includes('saudi') || locLower.includes('riyadh')) {
      params.set('country', 'sa');
    } else if (locLower.includes('qatar') || locLower.includes('doha')) {
      params.set('country', 'qa');
    } else if (
      !locLower ||
      locLower.includes('dubai') ||
      locLower.includes('abu dhabi') ||
      locLower.includes('sharjah') ||
      locLower.includes('uae')
    ) {
      params.set('country', 'ae');
    }

    const endpoint = apiHost.includes('openwebninja.com')
      ? `https://${apiHost}/v1/search?${params.toString()}`
      : `https://${apiHost}/search?${params.toString()}`;

    const headers: Record<string, string> = apiHost.includes('openwebninja.com')
      ? { 'x-api-key': apiKey }
      : {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
        };

    const res = await fetchWithTimeout(endpoint, { timeoutMs: 4500, headers }, fetchImpl);
    const latencyMs = Date.now() - start;

    if (res.status === 429) {
      return {
        jobs: [],
        health: {
          ...baseHealth,
          status: 'rate_limited',
          latencyMs,
          note: 'JSearch quota or rate limit reached (HTTP 429)',
        },
      };
    }
    if (!res.ok) {
      return {
        jobs: [],
        health: {
          ...baseHealth,
          status: 'degraded',
          latencyMs,
          note: `JSearch responded with HTTP ${res.status}`,
        },
      };
    }

    const payload = await res.json();
    const rawList = Array.isArray(payload?.data) ? payload.data.slice(0, 10) : [];

    const jobs: NormalizedJobRecord[] = rawList.map((item: Record<string, unknown>, idx: number) => {
      const title = String(item.job_title || 'Specialist');
      const company = String(item.employer_name || 'GCC Employer');
      const city = String(item.job_city || '');
      const country = String(item.job_country || 'AE');
      const location = [city, country].filter(Boolean).join(', ') || 'Dubai, UAE';
      const isRemote = Boolean(item.job_is_remote);
      const workMode: 'Remote' | 'Hybrid' | 'On-site' = isRemote ? 'Remote' : 'On-site';
      const cleanDesc = stripHtml(String(item.job_description || '')).slice(0, 480);
      const applyUrl = sanitizeExternalUrl(
        item.job_apply_link || item.job_google_link,
        'https://www.google.com/search?q=jobs+in+dubai'
      );

      let salaryRange = 'Salary Not Disclosed by Employer';
      if (item.job_min_salary && item.job_max_salary) {
        const currency = String(item.job_salary_currency || 'AED');
        salaryRange = `${currency} ${Number(item.job_min_salary).toLocaleString()} – ${Number(
          item.job_max_salary
        ).toLocaleString()}`;
      }

      const publisher = String(item.job_publisher || 'JSearch');

      return {
        id: `jsearch-${item.job_id || idx}`,
        title,
        company,
        companyLogo: typeof item.employer_logo === 'string' ? item.employer_logo : null,
        location,
        regionTag: classifyRegionTag(location, workMode),
        workMode,
        employmentType: normalizeEmploymentType(item.job_employment_type),
        salaryRange,
        description: cleanDesc ? `${cleanDesc}...` : `${title} at ${company} (${location}).`,
        responsibilities: [
          `Execute key deliverables for ${title} at ${company} in ${location}.`,
          'Collaborate with regional stakeholders to deliver measurable business impact.',
        ],
        skills: extractSkillsFromText(
          title,
          cleanDesc,
          Array.isArray(item.job_required_skills) ? (item.job_required_skills as string[]) : []
        ),
        postedAt: formatRelativeDate(item.job_posted_at_datetime_utc),
        sourceUrl: applyUrl,
        applicationUrl: applyUrl,
        source: `JSearch (${publisher})`,
        recruiterName: `${company} Recruitment`,
      };
    });

    return {
      jobs,
      health: {
        ...baseHealth,
        status: 'ok',
        latencyMs,
        jobsReturned: jobs.length,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      jobs: [],
      health: {
        ...baseHealth,
        status: 'degraded',
        latencyMs: Date.now() - start,
        note: err instanceof Error ? err.message : 'JSearch request error',
      },
    };
  }
}

/**
 * 7. Adzuna Official API Adapter
 * Supports UK (gb), US (us), EU (de, fr, nl), AU (au), IN (in), SG (sg).
 * Note: Adzuna does NOT natively support UAE/GCC country codes in its API taxonomy.
 * Requires server-side ADZUNA_APP_ID and ADZUNA_APP_KEY.
 */
export async function fetchAdzunaJobs(
  query: string,
  countryCode = 'gb',
  fetchImpl: typeof fetch = fetch
): Promise<AdapterResult> {
  const appId = process.env.ADZUNA_APP_ID || '';
  const appKey = process.env.ADZUNA_APP_KEY || '';
  const start = Date.now();

  const supportedCountries = ['gb', 'us', 'au', 'ca', 'de', 'fr', 'in', 'nl', 'sg', 'za'];
  const normalizedCountry = supportedCountries.includes(countryCode.toLowerCase())
    ? countryCode.toLowerCase()
    : 'gb';

  const baseHealth: ProviderHealthDetail = {
    id: 'adzuna',
    name: 'Adzuna Official Job Search API',
    status: appId && appKey ? 'degraded' : 'unconfigured',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: true,
    configured: Boolean(appId && appKey),
    gccCoverage: 'Non-GCC Markets Only',
    note:
      appId && appKey
        ? 'Adzuna covers UK/US/EU/SG/IN (does not natively index UAE/GCC).'
        : 'Set ADZUNA_APP_ID and ADZUNA_APP_KEY to enable Adzuna global feeds (UK/US/EU/SG/IN).',
  };

  if (!appId || !appKey) {
    return { jobs: [], health: baseHealth };
  }

  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: '8',
      what: query || 'software engineer',
    });

    const url = `https://api.adzuna.com/v1/api/jobs/${normalizedCountry}/search/1?${params.toString()}`;
    const res = await fetchWithTimeout(
      url,
      { timeoutMs: 4200, headers: { Accept: 'application/json' } },
      fetchImpl
    );
    const latencyMs = Date.now() - start;

    if (res.status === 429) {
      return {
        jobs: [],
        health: {
          ...baseHealth,
          status: 'rate_limited',
          latencyMs,
          note: 'Adzuna rate limit reached (25 req/min or 250 req/day on free tier)',
        },
      };
    }
    if (!res.ok) {
      return {
        jobs: [],
        health: {
          ...baseHealth,
          status: 'degraded',
          latencyMs,
          note: `Adzuna responded with HTTP ${res.status}`,
        },
      };
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.results) ? data.results.slice(0, 8) : [];

    const jobs: NormalizedJobRecord[] = rawList.map((item: Record<string, unknown>, idx: number) => {
      const title = stripHtml(String(item.title || 'Engineer'));
      const compObj = item.company as { display_name?: string } | undefined;
      const company = stripHtml(String(compObj?.display_name || 'Adzuna Employer'));
      const locObj = item.location as { display_name?: string } | undefined;
      const location = String(locObj?.display_name || normalizedCountry.toUpperCase());
      const cleanDesc = stripHtml(String(item.description || '')).slice(0, 480);
      const redirectUrl = sanitizeExternalUrl(item.redirect_url, 'https://www.adzuna.co.uk');

      let salaryRange = 'Salary Not Disclosed by Employer';
      if (item.salary_min && item.salary_max) {
        salaryRange = `${Math.round(Number(item.salary_min)).toLocaleString()} – ${Math.round(
          Number(item.salary_max)
        ).toLocaleString()} (${normalizedCountry.toUpperCase()})`;
      }

      const catObj = item.category as { label?: string } | undefined;
      const catTags = catObj?.label ? [catObj.label] : [];

      return {
        id: `adzuna-${item.id || idx}`,
        title,
        company,
        companyLogo: null,
        location,
        regionTag: classifyRegionTag(location, 'Hybrid'),
        workMode: cleanDesc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
        employmentType: normalizeEmploymentType(item.contract_time || item.contract_type),
        salaryRange,
        description: cleanDesc ? `${cleanDesc}...` : `${title} at ${company} via Adzuna.`,
        responsibilities: [
          `Deliver core milestones for ${title} at ${company}.`,
          'Collaborate with engineering and product teams.',
        ],
        skills: extractSkillsFromText(title, cleanDesc, catTags),
        postedAt: formatRelativeDate(item.created),
        sourceUrl: redirectUrl,
        applicationUrl: redirectUrl,
        source: 'Adzuna',
        recruiterName: `${company} Hiring Team`,
      };
    });

    return {
      jobs,
      health: {
        ...baseHealth,
        status: 'ok',
        latencyMs,
        jobsReturned: jobs.length,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      jobs: [],
      health: {
        ...baseHealth,
        status: 'degraded',
        latencyMs: Date.now() - start,
        note: err instanceof Error ? err.message : 'Adzuna request error',
      },
    };
  }
}

/**
 * Partner-Restricted Platforms Metadata (Truthful Disclosure — Never Scraped or Faked)
 */
export function getRestrictedPartnerStatus(): ProviderHealthDetail[] {
  return [
    {
      id: 'linkedin_partner',
      name: 'LinkedIn Talent Solutions',
      status: 'partner_required',
      latencyMs: null,
      jobsReturned: 0,
      lastSyncedAt: null,
      requiresCredentials: true,
      configured: false,
      gccCoverage: 'Partner Restricted',
      note: 'LinkedIn does not provide a public Job Search API (Job Posting API is outbound-only for approved ATS partners).',
    },
    {
      id: 'indeed_partner',
      name: 'Indeed Partner API',
      status: 'partner_required',
      latencyMs: null,
      jobsReturned: 0,
      lastSyncedAt: null,
      requiresCredentials: true,
      configured: false,
      gccCoverage: 'Partner Restricted',
      note: 'Indeed deprecated its public Job Search API; active Job Sync APIs require B2B partner approval.',
    },
    {
      id: 'glassdoor_partner',
      name: 'Glassdoor Enterprise API',
      status: 'partner_required',
      latencyMs: null,
      jobsReturned: 0,
      lastSyncedAt: null,
      requiresCredentials: true,
      configured: false,
      gccCoverage: 'Partner Restricted',
      note: 'Public Glassdoor API is discontinued (HTTP 410); restricted to enterprise contracts.',
    },
    {
      id: 'bayt_partner',
      name: 'Bayt / Talentera Enterprise',
      status: 'partner_required',
      latencyMs: null,
      jobsReturned: 0,
      lastSyncedAt: null,
      requiresCredentials: true,
      configured: false,
      gccCoverage: 'Partner Restricted',
      note: 'Requires Bayt enterprise recruitment / Talentera ATS partner agreement.',
    },
    {
      id: 'naukrigulf_partner',
      name: 'NaukriGulf (Info Edge)',
      status: 'partner_required',
      latencyMs: null,
      jobsReturned: 0,
      lastSyncedAt: null,
      requiresCredentials: true,
      configured: false,
      gccCoverage: 'Partner Restricted',
      note: 'No self-serve public job search API; requires commercial Info Edge recruiter licensing.',
    },
  ];
}

/**
 * Cross-Provider Deduplication
 * Preserves the first seen listing's original sourceUrl, applicationUrl, and source attribution.
 */
export function deduplicateJobs<
  T extends { id: string; title: string; company: string; location: string }
>(jobs: T[]): T[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const unique: T[] = [];

  for (const job of jobs) {
    const normTitle = job.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normCompany = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normLoc = (job.location || '')
      .toLowerCase()
      .split(',')[0]
      .replace(/[^a-z0-9]/g, '');
    const signature = `${normTitle}::${normCompany}::${normLoc}`;

    if (seenIds.has(job.id) || seenSignatures.has(signature)) {
      continue;
    }
    seenIds.add(job.id);
    seenSignatures.add(signature);
    unique.push(job);
  }

  return unique;
}
