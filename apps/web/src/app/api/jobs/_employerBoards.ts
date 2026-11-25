/**
 * Employer career boards read through their public, key-free ATS APIs
 * (Greenhouse, Lever, Ashby). Each board was checked to return live roles
 * in India and/or the UAE. Only roles located in India, the UAE or the
 * wider GCC are kept; everything else on the board is dropped.
 */
import {
  type AdapterResult,
  type NormalizedJobRecord,
  type ProviderHealthDetail,
  extractSkillsFromText,
  fetchWithTimeout,
  formatRelativeDate,
  inferEmploymentType,
  isTechRole,
  isJobExpiredOrMalformed,
  normalizeLocationAndRegion,
  parseJobTimestamp,
  sanitizeExternalUrl,
  stripHtml,
} from './_providers';

type Ats = 'greenhouse' | 'lever' | 'ashby' | 'workable';

interface Board {
  ats: Ats;
  slug: string;
  company: string;
  ai?: boolean;
  /** Keep only software, data, AI and other CS roles (for boards with many non-tech jobs). */
  techOnly?: boolean;
}

const BOARDS: Board[] = [
  // India
  { ats: 'lever', slug: 'paytm', company: 'Paytm' },
  { ats: 'lever', slug: 'meesho', company: 'Meesho' },
  { ats: 'lever', slug: 'zeta', company: 'Zeta' },
  { ats: 'lever', slug: 'cred', company: 'CRED' },
  { ats: 'greenhouse', slug: 'inmobi', company: 'InMobi' },
  { ats: 'greenhouse', slug: 'hackerrank', company: 'HackerRank' },
  { ats: 'greenhouse', slug: 'druva', company: 'Druva' },
  { ats: 'greenhouse', slug: 'groww', company: 'Groww' },
  { ats: 'greenhouse', slug: 'stripe', company: 'Stripe' },
  { ats: 'greenhouse', slug: 'datadog', company: 'Datadog' },
  { ats: 'ashby', slug: 'sarvam', company: 'Sarvam AI', ai: true },
  // AI companies hiring in India and/or the UAE
  { ats: 'ashby', slug: 'openai', company: 'OpenAI', ai: true },
  { ats: 'ashby', slug: 'cohere', company: 'Cohere', ai: true },
  { ats: 'ashby', slug: 'elevenlabs', company: 'ElevenLabs', ai: true },
  { ats: 'greenhouse', slug: 'scaleai', company: 'Scale AI', ai: true },
  { ats: 'greenhouse', slug: 'xai', company: 'xAI', ai: true },
  // MENA tech employers (Gulf, Saudi Arabia, Egypt)
  { ats: 'ashby', slug: 'leantech', company: 'Lean Technologies' },
  { ats: 'ashby', slug: 'thndr', company: 'Thndr' },
  { ats: 'ashby', slug: 'ziina', company: 'Ziina' },
  { ats: 'workable', slug: 'foodics', company: 'Foodics' },
  { ats: 'workable', slug: 'lucidya', company: 'Lucidya', ai: true },
  { ats: 'workable', slug: 'salla', company: 'Salla' },
  { ats: 'workable', slug: 'alpheya', company: 'Alpheya' },
  { ats: 'greenhouse', slug: 'bybit', company: 'Bybit' },
  { ats: 'greenhouse', slug: 'gitlab', company: 'GitLab' },
  // Remote-friendly boards that post CS internships
  { ats: 'ashby', slug: 'ramp', company: 'Ramp' },
  { ats: 'ashby', slug: 'notion', company: 'Notion' },
  { ats: 'ashby', slug: 'perplexity', company: 'Perplexity', ai: true },
  { ats: 'ashby', slug: 'clickhouse', company: 'ClickHouse' },
  // Cybersecurity employers hiring in India, MENA or remote
  { ats: 'greenhouse', slug: 'zscaler', company: 'Zscaler' },
  { ats: 'greenhouse', slug: 'okta', company: 'Okta' },
  { ats: 'ashby', slug: 'sophos', company: 'Sophos' },
  { ats: 'greenhouse', slug: 'chainguard', company: 'Chainguard' },
  { ats: 'greenhouse', slug: 'wizinc', company: 'Wiz' },
  { ats: 'greenhouse', slug: 'tailscale', company: 'Tailscale' },
  { ats: 'greenhouse', slug: 'huntress', company: 'Huntress' },
];

const TECH_ROLE = { test: isTechRole };

const PER_BOARD = 30;

const TARGET_REGION =
  /\b(india|bengaluru|bangalore|mumbai|pune|hyderabad|gurugram|gurgaon|delhi|noida|chennai|kolkata|ahmedabad|lucknow|jaipur|kochi|indore|coimbatore|chandigarh|dubai|abu dhabi|sharjah|uae|united arab emirates|riyadh|jeddah|dammam|khobar|saudi arabia|ksa|doha|qatar|kuwait|bahrain|manama|muscat|oman|cairo|giza|alexandria|egypt|amman|jordan|beirut|lebanon|casablanca|rabat|morocco|tunis|tunisia|mena|gcc|middle east)\b/i;

interface RawRole {
  id: string;
  title: string;
  location: string;
  description: string;
  url: string;
  updated: unknown;
  type: unknown;
  remote: boolean;
}

async function readBoard(board: Board): Promise<RawRole[]> {
  if (board.ats === 'greenhouse') {
    const res = await fetchWithTimeout(
      `https://boards-api.greenhouse.io/v1/boards/${board.slug}/jobs?content=true`,
      { timeoutMs: 9000 }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data?.jobs) ? data.jobs : []).map((j: any) => ({
      id: String(j.id),
      title: String(j.title || ''),
      location: String(j.location?.name || ''),
      description: String(j.content || ''),
      url: j.absolute_url,
      updated: j.updated_at,
      type: '',
      remote: /remote/i.test(String(j.location?.name || '')),
    }));
  }
  if (board.ats === 'lever') {
    const res = await fetchWithTimeout(`https://api.lever.co/v0/postings/${board.slug}?mode=json&limit=100`, { timeoutMs: 9000 });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((j: any) => ({
      id: String(j.id),
      title: String(j.text || ''),
      location: String(j.categories?.location || ''),
      description: String(j.descriptionPlain || j.description || ''),
      url: j.hostedUrl,
      updated: j.createdAt,
      type: j.categories?.commitment,
      remote: String(j.workplaceType || '').toLowerCase() === 'remote',
    }));
  }
  if (board.ats === 'workable') {
    const res = await fetchWithTimeout(`https://apply.workable.com/api/v1/widget/accounts/${board.slug}`, { timeoutMs: 9000 });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data?.jobs) ? data.jobs : []).map((j: any) => ({
      id: String(j.shortcode),
      title: String(j.title || ''),
      location: [j.city, j.state, j.country].filter(Boolean).join(', '),
      description: [j.department, j.function, j.experience, j.education].filter(Boolean).join(' · '),
      url: j.url,
      updated: j.published_on || j.created_at,
      type: j.employment_type,
      remote: j.telecommuting === true || j.telecommuting === 'true',
    }));
  }
  const res = await fetchWithTimeout(`https://api.ashbyhq.com/posting-api/job-board/${board.slug}`, { timeoutMs: 9000 });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data?.jobs) ? data.jobs : []).map((j: any) => ({
    id: String(j.id),
    title: String(j.title || ''),
    location: [j.location, ...(j.secondaryLocations || []).map((l: any) => l?.location)].filter(Boolean).join(' / '),
    description: String(j.descriptionPlain || ''),
    url: j.jobUrl,
    updated: j.publishedAt,
    type: j.employmentType,
    remote: Boolean(j.isRemote),
  }));
}

function toRecord(board: Board, r: RawRole): NormalizedJobRecord {
  const workMode: 'Remote' | 'Hybrid' | 'On-site' = r.remote ? 'Remote' : 'On-site';
  const loc = normalizeLocationAndRegion(r.location, '', workMode);
  const desc = stripHtml(r.description).slice(0, 600);
  const url = sanitizeExternalUrl(r.url);
  return {
    id: `${board.ats}-${board.slug}-${r.id}`,
    title: r.title.trim(),
    company: board.company,
    companyLogo: null,
    location: loc.location,
    city: loc.city,
    country: loc.country,
    regionTag: loc.regionTag,
    workMode,
    employmentType: inferEmploymentType(r.title, r.type),
    salaryRange: 'Salary Not Disclosed by Employer',
    description: desc ? `${desc}…` : `${r.title} at ${board.company}.`,
    responsibilities: [],
    skills: extractSkillsFromText(r.title, desc),
    postedAt: formatRelativeDate(r.updated),
    postedTimestamp: parseJobTimestamp(r.updated)?.getTime(),
    sourceUrl: url,
    applicationUrl: url,
    source: `${board.company} careers`,
    recruiterName: '',
  };
}

export async function fetchEmployerBoardJobs(): Promise<AdapterResult> {
  const start = Date.now();
  const health: ProviderHealthDetail = {
    id: 'employer_boards',
    name: `Employer career pages in India & UAE (${BOARDS.map((b) => b.company).join(', ')})`,
    status: 'degraded',
    latencyMs: null,
    jobsReturned: 0,
    lastSyncedAt: null,
    requiresCredentials: false,
    configured: true,
    gccCoverage: 'India + UAE Employers',
  };

  const settled = await Promise.allSettled(
    BOARDS.map(async (board) => {
      const roles = (await readBoard(board)).filter(
        (r) =>
          r.title &&
          (TARGET_REGION.test(r.location) || r.remote || /\bremote\b/i.test(r.location)) &&
          (!board.techOnly || TECH_ROLE.test(r.title))
      );
      // Internships and AI/ML roles first, then newest, so they survive the per-board cap.
      const rank = (r: RawRole) =>
        (/\b(intern|internship|trainee)\b/i.test(r.title) ? 0 : 2) +
        (/\b(ai|ml|machine learning|llm|data scien|genai|nlp)\b/i.test(r.title) ? 0 : 1);
      return roles
        .sort((a, b) => rank(a) - rank(b))
        .slice(0, PER_BOARD)
        .map((r) => toRecord(board, r))
        // A role still listed on the employer's own board is open, whatever its post date.
        .filter((j) => !isJobExpiredOrMalformed({ ...j, postedTimestamp: undefined }));
    })
  );

  const jobs = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []));
  return {
    jobs,
    health: {
      ...health,
      status: jobs.length ? 'ok' : 'degraded',
      latencyMs: Date.now() - start,
      jobsReturned: jobs.length,
      lastSyncedAt: jobs.length ? new Date().toISOString() : null,
    },
  };
}
