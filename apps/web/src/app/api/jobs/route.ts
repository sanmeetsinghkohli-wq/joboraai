import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface LiveJobRecord {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  employmentType: string;
  salaryRange: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  postedAt: string;
  sourceUrl: string;
  source: 'Remotive' | 'Arbeitnow' | 'Curated' | 'Custom';
  recruiterEmail?: string;
  recruiterName?: string;
}

declare global {
  var __jobora_custom_jobs: LiveJobRecord[] | undefined;
}

const customJobsStore: LiveJobRecord[] =
  global.__jobora_custom_jobs || (global.__jobora_custom_jobs = []);

const CURATED_JOBS: LiveJobRecord[] = [
  {
    id: 'jobora-stripe-staff-product',
    title: 'Staff Product Designer, Financial Infrastructure',
    company: 'Stripe',
    location: 'San Francisco, CA',
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
    source: 'Curated',
    recruiterName: 'Elena Rostova',
    recruiterEmail: 'elena.rostova@stripe-talent.example.com',
  },
  {
    id: 'jobora-anthropic-ai-eng',
    title: 'Full-Stack Software Engineer, Claude Product',
    company: 'Anthropic',
    location: 'San Francisco, CA',
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
    source: 'Curated',
    recruiterName: 'Marcus Vance',
    recruiterEmail: 'm.vance@anthropic-careers.example.com',
  },
  {
    id: 'jobora-linear-frontend',
    title: 'Senior Frontend Engineer, Core Experience',
    company: 'Linear',
    location: 'Remote (Global)',
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
    source: 'Curated',
    recruiterName: 'Clara Lindqvist',
    recruiterEmail: 'clara@linear-talent.example.com',
  },
  {
    id: 'jobora-vercel-dx',
    title: 'Staff Solutions & AI SDK Engineer',
    company: 'Vercel',
    location: 'Remote (US & EU)',
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
    source: 'Curated',
    recruiterName: 'Devon Brooks',
    recruiterEmail: 'dbrooks@vercel-talent.example.com',
  },
  {
    id: 'jobora-figma-systems',
    title: 'Principal Design Systems Architect',
    company: 'Figma',
    location: 'New York, NY',
    workMode: 'Hybrid',
    employmentType: 'Full-Time',
    salaryRange: '$220k – $280k',
    description:
      'Shape the future of Variables, Code Connect, and multi-brand design systems inside Figma. Bridge the gap between visual design tokens and production codebases.',
    responsibilities: [
      'Define the architecture for bidirectional design-to-code token synchronization.',
      'Partner with enterprise customers to scale 1,000+ component libraries.',
      'Drive accessibility standards and keyboard navigation patterns across the editor.',
    ],
    skills: ['Design Systems', 'TypeScript', 'Figma API', 'Accessibility', 'UI Engineering'],
    postedAt: '1d ago',
    sourceUrl: 'https://www.figma.com/careers',
    source: 'Curated',
    recruiterName: 'Hannah Chen',
    recruiterEmail: 'hchen@figma-careers.example.com',
  },
  {
    id: 'jobora-databricks-ml',
    title: 'Senior Machine Learning Platform Engineer',
    company: 'Databricks',
    location: 'Amsterdam / Remote',
    workMode: 'Hybrid',
    employmentType: 'Full-Time',
    salaryRange: '€155k – €195k',
    description:
      'Scale Mosaic AI model serving and vector search infrastructure for enterprise GenAI workloads.',
    responsibilities: [
      'Build low-latency model serving clusters and GPU autoscaling pipelines.',
      'Integrate RAG evaluation and governance telemetry into the Lakehouse platform.',
    ],
    skills: ['Python', 'Kubernetes', 'PyTorch', 'Distributed Systems', 'SQL', 'MLOps'],
    postedAt: '2d ago',
    sourceUrl: 'https://www.databricks.com/company/careers',
    source: 'Curated',
    recruiterName: 'Lukas Meyer',
    recruiterEmail: 'lmeyer@databricks-talent.example.com',
  },
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeExternalUrl(url: unknown, fallback: string): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').toLowerCase().trim();
  const locationFilter = (searchParams.get('location') || '').toLowerCase().trim();

  const liveJobs: LiveJobRecord[] = [...customJobsStore];
  const providerStatus: Record<string, 'ok' | 'degraded'> = {
    remotive: 'degraded',
    arbeitnow: 'degraded',
  };

  // 1. Fetch live jobs from Remotive public API (with 3.5s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const remotiveUrl = query
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=12`
      : 'https://remotive.com/api/remote-jobs?limit=12';
    const res = await fetch(remotiveUrl, { signal: controller.signal, next: { revalidate: 300 } });
    clearTimeout(timer);

    if (res.ok) {
      providerStatus.remotive = 'ok';
      const data = await res.json();
      if (Array.isArray(data?.jobs)) {
        for (const item of data.jobs.slice(0, 10)) {
          const cleanDesc = stripHtml(item.description || '').slice(0, 460);
          liveJobs.push({
            id: `remotive-${item.id}`,
            title: item.title || 'Software Engineer',
            company: item.company_name || 'Tech Partner',
            companyLogo: item.company_logo || null,
            location: item.candidate_required_location || 'Remote',
            workMode: 'Remote',
            employmentType:
              item.job_type === 'full_time' ? 'Full-Time' : item.job_type || 'Full-Time',
            salaryRange: item.salary || 'Salary Not Disclosed by Employer',
            description: cleanDesc ? `${cleanDesc}...` : 'Remote opportunity via Remotive.',
            responsibilities: [
              `Deliver high-impact solutions as ${item.title} at ${item.company_name}.`,
              'Collaborate asynchronously with distributed engineering and product teams.',
              'Write clean, maintainable, well-tested production code and documentation.',
            ],
            skills:
              Array.isArray(item.tags) && item.tags.length > 0
                ? item.tags.slice(0, 6)
                : ['Remote Collaboration', 'Software Engineering', 'Agile'],
            postedAt: item.publication_date
              ? new Date(item.publication_date).toLocaleDateString()
              : 'Recently',
            sourceUrl: sanitizeExternalUrl(item.url, 'https://remotive.com'),
            source: 'Remotive',
            recruiterName: `${item.company_name} Talent Team`,
            recruiterEmail: `careers@${(item.company_name || 'company')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')}.com`,
          });
        }
      }
    }
  } catch {
    providerStatus.remotive = 'degraded';
  }

  // 2. Also fetch live jobs from Arbeitnow public API (with 3.5s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    clearTimeout(timer);

    if (res.ok) {
      providerStatus.arbeitnow = 'ok';
      const data = await res.json();
      if (Array.isArray(data?.data)) {
        for (const item of data.data.slice(0, 8)) {
          const cleanDesc = stripHtml(item.description || '').slice(0, 460);
          liveJobs.push({
            id: `arbeitnow-${item.slug}`,
            title: item.title || 'Specialist Role',
            company: item.company_name || 'Global Employer',
            companyLogo: null,
            location: item.location || 'Remote / Europe',
            workMode: item.remote ? 'Remote' : 'Hybrid',
            employmentType: 'Full-Time',
            salaryRange: 'Salary Not Disclosed by Employer',
            description: cleanDesc ? `${cleanDesc}...` : 'Live opportunity via Arbeitnow.',
            responsibilities: [
              `Own core deliverables for ${item.title} at ${item.company_name}.`,
              'Partner with cross-functional stakeholders to ship measurable outcomes.',
            ],
            skills:
              Array.isArray(item.tags) && item.tags.length > 0
                ? item.tags.slice(0, 6)
                : ['Product Delivery', 'Cross-functional'],
            postedAt: 'Live Feed',
            sourceUrl: sanitizeExternalUrl(item.url, 'https://www.arbeitnow.com'),
            source: 'Arbeitnow',
            recruiterName: `${item.company_name} Recruiting`,
            recruiterEmail: `talent@${(item.company_name || 'company')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')}.com`,
          });
        }
      }
    }
  } catch {
    providerStatus.arbeitnow = 'degraded';
  }

  // Combine curated high-signal roles + live external feeds and deduplicate
  const combined = [...customJobsStore, ...CURATED_JOBS, ...liveJobs];
  const seenKeys = new Set<string>();
  const unique = combined.filter((job) => {
    const dedupKey = `${job.id}::${job.title.toLowerCase()}::${job.company.toLowerCase()}`;
    if (seenKeys.has(job.id) || seenKeys.has(dedupKey)) return false;
    seenKeys.add(job.id);
    seenKeys.add(dedupKey);
    return true;
  });

  const filtered = unique.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.skills.some((s) => s.toLowerCase().includes(query));

    const matchesLocation =
      !locationFilter ||
      job.location.toLowerCase().includes(locationFilter) ||
      job.workMode.toLowerCase().includes(locationFilter);

    return matchesQuery && matchesLocation;
  });

  return NextResponse.json({
    jobs: filtered,
    total: filtered.length,
    syncedAt: new Date().toISOString(),
    providerStatus,
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

    const newJob: LiveJobRecord = {
      id: `custom-${Date.now()}`,
      title,
      company,
      location: String(body.location || 'Remote').trim(),
      workMode: body.workMode || 'Remote',
      employmentType: String(body.employmentType || 'Full-Time').trim(),
      salaryRange: String(body.salaryRange || 'Not Specified').trim(),
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
      sourceUrl: sanitizeExternalUrl(body.sourceUrl, 'https://linkedin.com/jobs'),
      source: 'Custom',
      recruiterName: String(body.recruiterName || `${company} Hiring Team`).trim(),
      recruiterEmail: String(
        body.recruiterEmail || `careers@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      ).trim(),
    };
    customJobsStore.unshift(newJob);
    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 });
  }
}
