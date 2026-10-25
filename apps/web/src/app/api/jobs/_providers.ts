/**
 * Jobora AI — Multi-Provider Job Aggregation & Normalization Engine
 *
 * Supported Providers:
 * 1. Remotive (Public REST API — No Auth required, active)
 * 2. Arbeitnow (Public REST API — No Auth required, active)
 * 3. Greenhouse GCC & MENA Direct Employer Feeds (Public Official ATS JSON — Careem, Tamara, Deliveroo, Cloudflare, OKX, Elastic, Databricks, MongoDB — No Auth required, active)
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
  city?: string;
  country?: string;
  regionTag: 'UAE' | 'Saudi Arabia' | 'Qatar' | 'GCC / MENA' | 'Remote' | 'Global';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  employmentType: string;
  salaryRange: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  postedAt: string;
  postedTimestamp?: number;
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

export function sanitizeExternalUrl(url: unknown, fallback = ''): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Infers the most accurate city, country, and display location from both the raw location field and job title.
 * Fixes cases where an employer lists "Dubai, United Arab Emirates" as the default board location for a role
 * explicitly titled "Business Development Manager - Abu Dhabi" or "Territory Account Executive, Qatar [Hybrid]".
 */
export function normalizeLocationAndRegion(
  rawLocation: string,
  title: string,
  workMode: string
): {
  location: string;
  city: string;
  country: string;
  regionTag: 'UAE' | 'Saudi Arabia' | 'Qatar' | 'GCC / MENA' | 'Remote' | 'Global';
} {
  const combined = `${title} ${rawLocation}`.toLowerCase();
  const locClean = (rawLocation || '').trim();

  if (/\babu dhabi\b/.test(combined)) {
    return {
      location: 'Abu Dhabi, United Arab Emirates',
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      regionTag: 'UAE',
    };
  }
  if (/\bsharjah\b/.test(combined)) {
    return {
      location: 'Sharjah, United Arab Emirates',
      city: 'Sharjah',
      country: 'United Arab Emirates',
      regionTag: 'UAE',
    };
  }
  if (/\bdubai\b/.test(combined)) {
    return {
      location: 'Dubai, United Arab Emirates',
      city: 'Dubai',
      country: 'United Arab Emirates',
      regionTag: 'UAE',
    };
  }
  if (/\b(uae|united arab emirates|emirati)\b/.test(combined)) {
    return {
      location:
        locClean && !locClean.toLowerCase().includes('hybrid')
          ? locClean
          : 'United Arab Emirates',
      city: 'Dubai / Abu Dhabi',
      country: 'United Arab Emirates',
      regionTag: 'UAE',
    };
  }
  if (/\briyadh\b/.test(combined)) {
    return {
      location: 'Riyadh, Saudi Arabia',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      regionTag: 'Saudi Arabia',
    };
  }
  if (/\bjeddah\b/.test(combined)) {
    return {
      location: 'Jeddah, Saudi Arabia',
      city: 'Jeddah',
      country: 'Saudi Arabia',
      regionTag: 'Saudi Arabia',
    };
  }
  if (/\b(saudi arabia|saudi|ksa)\b/.test(combined)) {
    return {
      location: 'Riyadh, Saudi Arabia',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      regionTag: 'Saudi Arabia',
    };
  }
  if (/\b(doha|qatar)\b/.test(combined)) {
    return {
      location: 'Doha, Qatar',
      city: 'Doha',
      country: 'Qatar',
      regionTag: 'Qatar',
    };
  }
  if (/\b(kuwait)\b/.test(combined)) {
    return {
      location: 'Kuwait City, Kuwait',
      city: 'Kuwait City',
      country: 'Kuwait',
      regionTag: 'GCC / MENA',
    };
  }
  if (/\b(oman|muscat)\b/.test(combined)) {
    return {
      location: 'Muscat, Oman',
      city: 'Muscat',
      country: 'Oman',
      regionTag: 'GCC / MENA',
    };
  }
  if (/\b(bahrain|manama)\b/.test(combined)) {
    return {
      location: 'Manama, Bahrain',
      city: 'Manama',
      country: 'Bahrain',
      regionTag: 'GCC / MENA',
    };
  }
  if (/\b(amman|jordan)\b/.test(combined)) {
    return {
      location: 'Amman, Jordan',
      city: 'Amman',
      country: 'Jordan',
      regionTag: 'GCC / MENA',
    };
  }
  if (/\b(mena|gcc)\b/.test(combined)) {
    return {
      location: locClean || 'MENA / GCC Region',
      city: 'GCC',
      country: 'GCC / MENA',
      regionTag: 'GCC / MENA',
    };
  }
  if (locClean.toLowerCase().includes('remote') || workMode.toLowerCase() === 'remote') {
    return {
      location: locClean || 'Remote',
      city: 'Remote',
      country: locClean || 'Global',
      regionTag: 'Remote',
    };
  }

  const parts = locClean.split(',').map((p) => p.trim());
  return {
    location: locClean || 'Global',
    city: parts[0] || 'Global',
    country: parts[parts.length - 1] || 'Global',
    regionTag: 'Global',
  };
}

export function classifyRegionTag(
  location: string,
  workMode: string,
  title = ''
): 'UAE' | 'Saudi Arabia' | 'Qatar' | 'GCC / MENA' | 'Remote' | 'Global' {
  return normalizeLocationAndRegion(location, title, workMode).regionTag;
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

/**
 * Correctly parses numeric Unix timestamps (seconds or milliseconds) as well as ISO 8601 strings.
 * Prevents the `new Date("1792313716000")` Invalid Date bug in JavaScript.
 */
export function parseJobTimestamp(dateInput: unknown): Date | null {
  if (dateInput === null || dateInput === undefined || dateInput === '') return null;
  if (typeof dateInput === 'number') {
    const ms = dateInput < 1e12 ? dateInput * 1000 : dateInput;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const str = String(dateInput).trim();
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeDate(dateInput: unknown): string {
  const parsed = parseJobTimestamp(dateInput);
  if (!parsed) return 'Recently';
  const diffHours = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 30) return `${diffDays}d ago`;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isJobExpiredOrMalformed(job: {
  title?: string;
  company?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  postedTimestamp?: number;
}): boolean {
  if (!job.title || job.title.trim().length < 2) return true;
  if (!job.company || job.company.trim().length < 2) return true;
  if (!job.sourceUrl || !job.sourceUrl.startsWith('http')) return true;
  if (!job.applicationUrl || !job.applicationUrl.startsWith('http')) return true;
  // Filter out listings older than 120 days if timestamp is known
  if (job.postedTimestamp) {
    const ageDays = (Date.now() - job.postedTimestamp) / (1000 * 60 * 60 * 24);
    if (ageDays > 120) return true;
  }
  return false;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const { timeoutMs = 4200, ...rest } = options;
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
 * 1. Remotive Public Adapter (Preserved & Hardened)
 * Attribution: Links directly to Remotive job URL per Remotive API terms.
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
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=25`
      : 'https://remotive.com/api/remote-jobs?limit=25';
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
    const rawList = Array.isArray(data?.jobs) ? data.jobs.slice(0, 20) : [];
    const jobs: NormalizedJobRecord[] = rawList
      .map((item: Record<string, unknown>): NormalizedJobRecord => {
        const title = String(item.title || '').trim();
        const company = String(item.company_name || '').trim();
        const rawLoc = String(item.candidate_required_location || 'Remote');
        const locMeta = normalizeLocationAndRegion(rawLoc, title, 'Remote');
        const cleanDesc = stripHtml(String(item.description || '')).slice(0, 480);
        const url = sanitizeExternalUrl(item.url);
        const tags = Array.isArray(item.tags) ? (item.tags as string[]) : [];
        const parsedDate = parseJobTimestamp(item.publication_date);

        return {
          id: `remotive-${item.id}`,
          title,
          company,
          companyLogo: typeof item.company_logo === 'string' ? item.company_logo : null,
          location: locMeta.location,
          city: locMeta.city,
          country: locMeta.country,
          regionTag: locMeta.regionTag,
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
          postedTimestamp: parsedDate?.getTime(),
          sourceUrl: url,
          applicationUrl: url,
          source: 'Remotive',
          recruiterName: `${company} Talent Team`,
        };
      })
      .filter((j: NormalizedJobRecord) => !isJobExpiredOrMalformed(j));

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
 * 2. Arbeitnow Public Adapter (Preserved & Fixed Unix Timestamp Parsing)
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
    const rawList = Array.isArray(data?.data) ? data.data.slice(0, 25) : [];
    const jobs: NormalizedJobRecord[] = rawList
      .map((item: Record<string, unknown>): NormalizedJobRecord => {
        const title = String(item.title || '').trim();
        const company = String(item.company_name || '').trim();
        const rawLoc = String(item.location || 'Remote / Europe');
        const workMode: 'Remote' | 'Hybrid' = item.remote ? 'Remote' : 'Hybrid';
        const locMeta = normalizeLocationAndRegion(rawLoc, title, workMode);
        const cleanDesc = stripHtml(String(item.description || '')).slice(0, 480);
        const url = sanitizeExternalUrl(item.url);
        const tags = Array.isArray(item.tags) ? (item.tags as string[]) : [];
        const parsedDate = parseJobTimestamp(item.created_at);

        return {
          id: `arbeitnow-${item.slug}`,
          title,
          company,
          companyLogo: null,
          location: locMeta.location,
          city: locMeta.city,
          country: locMeta.country,
          regionTag: locMeta.regionTag,
          workMode,
          employmentType: 'Full-Time',
          salaryRange: 'Salary Not Disclosed by Employer',
          description: cleanDesc ? `${cleanDesc}...` : 'Live opportunity via Arbeitnow.',
          responsibilities: [
            `Own core deliverables for ${title} at ${company}.`,
            'Partner with cross-functional stakeholders to ship measurable outcomes.',
          ],
          skills: extractSkillsFromText(title, cleanDesc, tags),
          postedAt: formatRelativeDate(item.created_at),
          postedTimestamp: parsedDate?.getTime(),
          sourceUrl: url,
          applicationUrl: url,
          source: 'Arbeitnow',
          recruiterName: `${company} Recruiting`,
        };
      })
      .filter((j: NormalizedJobRecord) => !isJobExpiredOrMalformed(j));

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
 * 3. Official Greenhouse Public ATS Feeds for UAE, GCC & Global Tech Employers
 * Pulls live, verifiable roles directly from official Greenhouse public JSON boards:
 * - Careem (Dubai, Amman)
 * - Tamara (Dubai, Riyadh)
 * - Deliveroo Middle East (Dubai, Abu Dhabi, Kuwait)
 * - Binance (Dubai / UAE)
 * - Cloudflare (UAE, Saudi Arabia, Qatar, Oman)
 * - OKX MENA (Dubai)
 * - Elastic (Dubai, Saudi Arabia)
 * - Databricks (Dubai)
 * - MongoDB (Dubai / KSA)
 */
const GCC_GREENHOUSE_BOARDS = [
  { slug: 'careem', company: 'Careem', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 15 },
  { slug: 'tamara', company: 'Tamara', defaultLocation: 'Riyadh, Saudi Arabia', maxRoles: 15 },
  { slug: 'deliveroo', company: 'Deliveroo Middle East', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 15 },
  { slug: 'binance', company: 'Binance UAE', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 15 },
  { slug: 'cloudflare', company: 'Cloudflare', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 6 },
  { slug: 'okx', company: 'OKX MENA', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 6 },
  { slug: 'elastic', company: 'Elastic', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 5 },
  { slug: 'databricks', company: 'Databricks', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 3 },
  { slug: 'mongodb', company: 'MongoDB', defaultLocation: 'Dubai, United Arab Emirates', maxRoles: 3 },
];

export async function fetchGreenhouseGccJobs(
  fetchImpl: typeof fetch = fetch
): Promise<AdapterResult> {
  const start = Date.now();
  const baseHealth: ProviderHealthDetail = {
    id: 'greenhouse_gcc',
    name: 'UAE & GCC Employer ATS (Careem, Tamara, Deliveroo, Cloudflare, OKX, Elastic, Databricks, MongoDB)',
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
      const res = await fetchWithTimeout(url, { timeoutMs: 4500 }, fetchImpl);
      if (!res.ok) return [];
      const data = await res.json();
      const rawJobs = Array.isArray(data?.jobs) ? data.jobs : [];

      // Filter strictly for genuine UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, or Jordan roles
      // Use word-boundary regex to prevent false positives like "Romania" matching "oman"
      const gccRegex =
        /\b(dubai|abu dhabi|sharjah|uae|united arab emirates|emirati|riyadh|jeddah|saudi arabia|saudi|ksa|qatar|doha|kuwait|oman|muscat|bahrain|manama|amman|jordan)\b/i;

      const gccFiltered = rawJobs.filter((j: Record<string, unknown>) => {
        const locObj = j.location as { name?: string } | undefined;
        const locName = String(locObj?.name || '');
        const titleStr = String(j.title || '');
        const combined = `${titleStr} ${locName}`;
        // Exclude roles explicitly located in Europe/UK/US that merely mention EMEA/Africa in title
        if (/\b(london|paris|romania|bucharest|poland|dublin|amsterdam)\b/i.test(locName)) {
          return false;
        }
        return gccRegex.test(combined);
      });

      // Prioritize engineering, product, data, design, and commercial diversity before slicing
      const sorted = [...gccFiltered].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aTech = /\b(engineer|developer|scientist|product|designer|architect|security|data|ai)\b/i.test(
          String(a.title || '')
        )
          ? 0
          : 1;
        const bTech = /\b(engineer|developer|scientist|product|designer|architect|security|data|ai)\b/i.test(
          String(b.title || '')
        )
          ? 0
          : 1;
        return aTech - bTech;
      });

      return sorted
        .slice(0, board.maxRoles)
        .map((item: Record<string, unknown>): NormalizedJobRecord => {
          const title = String(item.title || '').trim();
          const locObj = item.location as { name?: string } | undefined;
          const rawLoc = String(locObj?.name || board.defaultLocation);
          const workMode: 'Remote' | 'Hybrid' | 'On-site' = rawLoc.toLowerCase().includes('remote')
            ? 'Remote'
            : 'Hybrid';
          const locMeta = normalizeLocationAndRegion(rawLoc, title, workMode);
          const cleanDesc = stripHtml(String(item.content || '')).slice(0, 480);
          const url = sanitizeExternalUrl(item.absolute_url);
          const parsedDate = parseJobTimestamp(item.updated_at);

          return {
            id: `gh-${board.slug}-${item.id}`,
            title,
            company: board.company,
            companyLogo: null,
            location: locMeta.location,
            city: locMeta.city,
            country: locMeta.country,
            regionTag: locMeta.regionTag,
            workMode,
            employmentType: 'Full-Time',
            salaryRange: 'Salary Not Disclosed by Employer',
            description: cleanDesc
              ? `${cleanDesc}...`
              : `Official ${board.company} opportunity in ${locMeta.location}.`,
            responsibilities: [
              `Drive high-impact execution as ${title} at ${board.company} (${locMeta.location}).`,
              'Collaborate with regional product, engineering, and commercial teams across the GCC.',
              'Deliver measurable customer and operational outcomes in a high-growth MENA market.',
            ],
            skills: extractSkillsFromText(title, cleanDesc),
            postedAt: formatRelativeDate(item.updated_at),
            postedTimestamp: parsedDate?.getTime(),
            sourceUrl: url,
            applicationUrl: url,
            source: `Greenhouse (${board.company})`,
            recruiterName: `${board.company} Talent Acquisition`,
          };
        })
        .filter((j: NormalizedJobRecord) => !isJobExpiredOrMalformed(j));
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
      ? `https://jobicy.com/api/v2/remote-jobs?count=25&tag=${encodeURIComponent(query)}`
      : 'https://jobicy.com/api/v2/remote-jobs?count=25';
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
    const rawList = Array.isArray(data?.jobs) ? data.jobs.slice(0, 25) : [];
    const jobs: NormalizedJobRecord[] = rawList
      .map((item: Record<string, unknown>): NormalizedJobRecord => {
        const title = stripHtml(String(item.jobTitle || '')).trim();
        const company = stripHtml(String(item.companyName || '')).trim();
        const rawLoc = String(item.jobGeo || 'Remote (Worldwide)');
        const locMeta = normalizeLocationAndRegion(rawLoc, title, 'Remote');
        const cleanDesc = stripHtml(String(item.jobExcerpt || item.jobDescription || '')).slice(0, 480);
        const jobUrl = sanitizeExternalUrl(item.url);
        const parsedDate = parseJobTimestamp(item.pubDate);

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
          location: locMeta.location,
          city: locMeta.city,
          country: locMeta.country,
          regionTag: locMeta.regionTag,
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
          postedTimestamp: parsedDate?.getTime(),
          sourceUrl: jobUrl,
          applicationUrl: jobUrl,
          source: 'Jobicy',
          recruiterName: `${company} Hiring Team`,
        };
      })
      .filter((j: NormalizedJobRecord) => !isJobExpiredOrMalformed(j));

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
 * 5. Himalayas Public Remote Jobs API Adapter (Fixed Unix Timestamp Parsing)
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
      'https://himalayas.app/jobs/api?limit=20',
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
    const rawList = Array.isArray(data?.jobs) ? data.jobs.slice(0, 20) : [];
    const jobs: NormalizedJobRecord[] = rawList
      .map((item: Record<string, unknown>, idx: number): NormalizedJobRecord => {
        const title = String(item.title || '').trim();
        const company = String(item.companyName || '').trim();
        const locRestr = Array.isArray(item.locationRestrictions)
          ? (item.locationRestrictions as string[]).join(', ')
          : '';
        const rawLoc = locRestr || 'Remote (Global / EMEA)';
        const locMeta = normalizeLocationAndRegion(rawLoc, title, 'Remote');
        const cleanDesc = stripHtml(String(item.excerpt || item.description || '')).slice(0, 480);
        const appUrl = sanitizeExternalUrl(item.applicationLink || item.guid);
        const parsedDate = parseJobTimestamp(item.pubDate);

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
          location: locMeta.location,
          city: locMeta.city,
          country: locMeta.country,
          regionTag: locMeta.regionTag,
          workMode: 'Remote',
          employmentType: normalizeEmploymentType(item.employmentType),
          salaryRange,
          description: cleanDesc ? `${cleanDesc}...` : `Remote role at ${company} via Himalayas.`,
          responsibilities: [
            `Deliver key milestones as ${title} at ${company}.`,
            'Operate with high autonomy in a remote-first engineering culture.',
          ],
          skills: extractSkillsFromText(title, cleanDesc, categories),
          postedAt: formatRelativeDate(item.pubDate),
          postedTimestamp: parsedDate?.getTime(),
          sourceUrl: appUrl,
          applicationUrl: appUrl,
          source: 'Himalayas',
          recruiterName: `${company} Talent Team`,
        };
      })
      .filter((j: NormalizedJobRecord) => !isJobExpiredOrMalformed(j));

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

    const jobs: NormalizedJobRecord[] = rawList
      .map((item: Record<string, unknown>, idx: number): NormalizedJobRecord => {
        const title = String(item.job_title || '').trim();
        const company = String(item.employer_name || '').trim();
        const city = String(item.job_city || '');
        const country = String(item.job_country || 'AE');
        const rawLoc = [city, country].filter(Boolean).join(', ') || 'Dubai, UAE';
        const isRemote = Boolean(item.job_is_remote);
        const workMode: 'Remote' | 'Hybrid' | 'On-site' = isRemote ? 'Remote' : 'On-site';
        const locMeta = normalizeLocationAndRegion(rawLoc, title, workMode);
        const cleanDesc = stripHtml(String(item.job_description || '')).slice(0, 480);
        const applyUrl = sanitizeExternalUrl(item.job_apply_link || item.job_google_link);
        const parsedDate = parseJobTimestamp(item.job_posted_at_datetime_utc);

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
          location: locMeta.location,
          city: locMeta.city,
          country: locMeta.country,
          regionTag: locMeta.regionTag,
          workMode,
          employmentType: normalizeEmploymentType(item.job_employment_type),
          salaryRange,
          description: cleanDesc ? `${cleanDesc}...` : `${title} at ${company} (${locMeta.location}).`,
          responsibilities: [
            `Execute key deliverables for ${title} at ${company} in ${locMeta.location}.`,
            'Collaborate with regional stakeholders to deliver measurable business impact.',
          ],
          skills: extractSkillsFromText(
            title,
            cleanDesc,
            Array.isArray(item.job_required_skills) ? (item.job_required_skills as string[]) : []
          ),
          postedAt: formatRelativeDate(item.job_posted_at_datetime_utc),
          postedTimestamp: parsedDate?.getTime(),
          sourceUrl: applyUrl,
          applicationUrl: applyUrl,
          source: `JSearch (${publisher})`,
          recruiterName: `${company} Recruitment`,
        };
      })
      .filter((j: NormalizedJobRecord) => !isJobExpiredOrMalformed(j));

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

    const jobs: NormalizedJobRecord[] = rawList
      .map((item: Record<string, unknown>, idx: number): NormalizedJobRecord => {
        const title = stripHtml(String(item.title || '')).trim();
        const compObj = item.company as { display_name?: string } | undefined;
        const company = stripHtml(String(compObj?.display_name || '')).trim();
        const locObj = item.location as { display_name?: string } | undefined;
        const rawLoc = String(locObj?.display_name || normalizedCountry.toUpperCase());
        const cleanDesc = stripHtml(String(item.description || '')).slice(0, 480);
        const workMode = cleanDesc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid';
        const locMeta = normalizeLocationAndRegion(rawLoc, title, workMode);
        const redirectUrl = sanitizeExternalUrl(item.redirect_url);
        const parsedDate = parseJobTimestamp(item.created);

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
          location: locMeta.location,
          city: locMeta.city,
          country: locMeta.country,
          regionTag: locMeta.regionTag,
          workMode,
          employmentType: normalizeEmploymentType(item.contract_time || item.contract_type),
          salaryRange,
          description: cleanDesc ? `${cleanDesc}...` : `${title} at ${company} via Adzuna.`,
          responsibilities: [
            `Deliver core milestones for ${title} at ${company}.`,
            'Collaborate with engineering and product teams.',
          ],
          skills: extractSkillsFromText(title, cleanDesc, catTags),
          postedAt: formatRelativeDate(item.created),
          postedTimestamp: parsedDate?.getTime(),
          sourceUrl: redirectUrl,
          applicationUrl: redirectUrl,
          source: 'Adzuna',
          recruiterName: `${company} Hiring Team`,
        };
      })
      .filter((j: NormalizedJobRecord) => !isJobExpiredOrMalformed(j));

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
      note: 'Unavailable: LinkedIn does not provide a public Job Search API (Job Posting API is outbound-only for approved ATS partners).',
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
      note: 'Unavailable: Indeed deprecated its public Job Search API; active Job Sync APIs require B2B partner approval.',
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
      note: 'Unavailable: Public Glassdoor API is discontinued (HTTP 410); restricted to enterprise contracts.',
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
      note: 'Unavailable: Requires Bayt enterprise recruitment / Talentera ATS partner agreement.',
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
      note: 'Unavailable: No self-serve public job search API; requires commercial Info Edge recruiter licensing.',
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
