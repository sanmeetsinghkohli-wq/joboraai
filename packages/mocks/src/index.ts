import type {
  CandidateProfile,
  StructuredJob,
  JobMatch,
  Application,
  ApplicationStatus,
  AnalyticsRecord,
  Insight,
} from '@jobora/types';

// ─── Seed mock skills ────────────────────────────────────────────────────────
export const SEED_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'FastAPI',
  'Next.js',
  'Tailwind CSS',
  'PostgreSQL',
  'Supabase',
  'pgvector',
  'Docker',
  'Git',
  'REST APIs',
  'JWT',
  'CI/CD',
  'Agile',
  'Playwright',
  'Anthropic Claude',
  'OpenAI GPT',
  'Prompt Engineering',
  'System Design',
  'GraphQL',
  'Redis',
];

// ─── Seed mock experiences ───────────────────────────────────────────────────
export const SEED_EXPERIENCES = [
  {
    id: 'exp-1',
    company: 'Fintech Corp',
    title: 'Senior Full-Stack Engineer',
    startDate: '2021-06',
    endDate: '',
    current: true,
    description:
      'Led the engineering team building a customer-facing trading platform handling 2M+ daily requests. Architected the API layer and introduced CI/CD pipelines that cut deployment time by 60%.',
    achievements: [
      'Improved API response time by 45% through query optimisation and caching.',
      'Reduced production incidents by 30% via improved observability and error tracking.',
      'Mentored 4 junior engineers; 3 promoted internally.',
    ],
  },
  {
    id: 'exp-2',
    company: 'CloudNine Labs',
    title: 'Full-Stack Developer',
    startDate: '2018-03',
    endDate: '2021-05',
    current: false,
    description:
      'Built and shipped features for an AI-assisted education platform. Worked across the entire stack from React frontends to Python backends and PostgreSQL databases.',
    achievements: [
      'Shipped a recommendation module used by 500k+ monthly active users.',
      'Reduced page load time by 35% with static-site generation and CDN optimisation.',
      'Introduced end-to-end testing with Playwright, raising coverage from 40% to 78%.',
    ],
  },
  {
    id: 'exp-3',
    company: 'StartUp Hub',
    title: 'Software Engineer',
    startDate: '2016-08',
    endDate: '2018-02',
    current: false,
    description:
      'Developed internal tools and customer-facing features for a productivity SaaS. Worked in a fast-paced startup environment with a flat hierarchy.',
    achievements: [
      'Built a drag-and-drop dashboard UI used by over 2,000 small businesses.',
      'Automated deployment and release processes, cutting release time from days to hours.',
      'Collaborated cross-functionally with design and product teams using Agile methodology.',
    ],
  },
];

// ─── Seed mock education ─────────────────────────────────────────────────────
export const SEED_EDUCATION = [
  {
    id: 'edu-1',
    institution: 'Massachusetts Institute of Technology',
    degree: 'B.Sc. in Computer Science',
    fieldOfStudy: 'Computer Science',
    startDate: '2012-09',
    endDate: '2016-06',
    gpa: '3.82 / 4.0',
  },
];

// ─── Seed mock projects ──────────────────────────────────────────────────────
export const SEED_PROJECTS = [
  {
    id: 'proj-1',
    name: 'AI-Powered JobMatcher',
    description:
      'Open-source library that scores candidate-job fit using vector embeddings and explainable signal extraction. Used by thousands of developers to understand application gaps.',
    technologies: ['TypeScript', 'PostgreSQL', 'pgvector', 'Python'],
    startDate: '2023-01',
    endDate: '2024-12',
    link: 'https://github.com/jobora-ai/jobmatcher',
  },
  {
    id: 'proj-2',
    name: 'Resume Builder Pro',
    description:
      'Web application that helps users create ATS-friendly resumes with real-time feedback and AI suggestions.',
    technologies: ['React', 'Next.js', 'FastAPI', 'Tailwind CSS'],
    startDate: '2021-05',
    endDate: '2022-08',
    link: 'https://resume-pro-demo.vercel.app',
  },
];

// ─── Seed mock certifications ────────────────────────────────────────────────
export const SEED_CERTIFICATIONS = [
  { id: 'cert-1', name: 'AWS Certified Solutions Architect', issuingOrganization: 'Amazon Web Services', date: '2023-04' },
  { id: 'cert-2', name: 'Professional Scrum Master I (PSM I)', issuingOrganization: 'Scrum.org', date: '2022-01' },
];

// ─── Seed mock languages ─────────────────────────────────────────────────────
export const SEED_LANGUAGES = [
  { id: 'lang-1', name: 'English', proficiency: 'native' },
  { id: 'lang-2', name: 'French', proficiency: 'conversational' },
  { id: 'lang-3', name: 'Spanish', proficiency: 'basic' },
];

// ─── Seed mock profile links ─────────────────────────────────────────────────
export const SEED_PROFILE_LINKS = [
  { id: 'link-1', label: 'GitHub', url: 'https://github.com', type: 'github' },
  { id: 'link-2', label: 'LinkedIn', url: 'https://linkedin.com', type: 'linkedin' },
  { id: 'link-3', label: 'Portfolio', url: 'https://portfolio-demo.vercel.app', type: 'website' },
];

// ─── Seed mock candidate profiles ───────────────────────────────────────────
export const SEED_PROFILES: CandidateProfile[] = [
  {
    id: 'profile-1',
    userId: 'user-1',
    name: 'Alex Johnson',
    summary:
      'Full-stack engineer with 5+ years of experience building customer-facing products. Passionate about AI-driven workflows and clean, maintainable systems.',
    location: 'San Francisco, CA',
    targetRoles: ['Software Engineer', 'Full-Stack Engineer', 'AI Engineer'],
    preferredLocations: ['San Francisco, CA', 'New York, NY', 'London, UK', 'Toronto, CA'],
    workModePreference: 'remote',
    industries: ['Technology', 'Finance', 'Healthcare', 'Education'],
    salaryExpectation: 145000,
    workAuthorization: 'US Citizen',
    jobTypes: ['full-time', 'contract'],
    education: SEED_EDUCATION.map((e) => ({ ...e, profileId: 'profile-1' })),
    experiences: SEED_EXPERIENCES.map((e) => ({ ...e, profileId: 'profile-1' })),
    skills: SEED_SKILLS.map((name) => ({
      id: `skill-${name.toLowerCase()}-1`,
      profileId: 'profile-1',
      name,
      verified: true,
      proficiency: name === 'TypeScript' || name === 'React' || name === 'Node.js' || name === 'Python' ? 'expert' : name === 'FastAPI' || name === 'Next.js' || name === 'Tailwind CSS' ? 'proficient' : 'intermediate',
    })),
    projects: SEED_PROJECTS.map((p) => ({ ...p, profileId: 'profile-1' })),
    certifications: SEED_CERTIFICATIONS.map((c) => ({ ...c, profileId: 'profile-1' })),
    languages: SEED_LANGUAGES.map((l) => ({ ...l, profileId: 'profile-1', proficiency: l.proficiency as 'basic' | 'conversational' | 'professional' | 'native' })),
    links: SEED_PROFILE_LINKS.map((link) => ({ ...link, profileId: 'profile-1', type: link.type as 'portfolio' | 'github' | 'linkedin' | 'website' | 'other' })),
    createdByWizard: true,
    updatedAt: new Date(),
  },
];

// ─── Mock job providers ──────────────────────────────────────────────────────
export const PAGE_TITLES = [
  'Senior Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'AI/ML Engineer',
  'Product Manager',
  'DevOps Engineer',
  'Software Engineer II',
  'Staff Engineer',
  'Technical Lead',
  'Engineering Manager',
  'Data Scientist',
  'Frontend Engineer',
  'UX Engineer',
  'Site Reliability Engineer',
  'Platform Engineer',
];

export const COMPANIES = [
  'TechNova',
  'CloudNine',
  'DataPulse',
  'FutureWorks',
  'Aether Systems',
  'QuickScale',
  'Vertex Robotics',
  'Lumina Health',
  'EduSpark',
  'FinEdge',
  'Streamline AI',
  'Nexus Labs',
  'Brightpath',
  'Orion Ventures',
  'Cascade AI',
];

const LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'Austin, TX',
  'London, UK',
  'Toronto, CA',
  'Berlin, DE',
  'Bangalore, IN',
  'Singapore',
  'Remote',
  'Chicago, IL',
  'Seattle, WA',
  'Boston, MA',
];

export const JOB_SOURCES = [
  { name: 'LinkedIn', color: '#0A66C2' },
  { name: 'Indeed', color: '#202124' },
  { name: 'AngelList', color: '#FFCC00' },
  { name: 'Y Combinator', color: '#FF6600' },
  { name: 'Dice', color: '#3D5A80' },
];

const JOB_TYPES = ['full-time', 'contract', 'part-time'] as const;
const WORK_MODES = ['remote' as const, 'hybrid' as const, 'onsite' as const];
const SEVERITIES = ['junior', 'mid-senior', 'director'] as const;

export function generateMockJobs(count: number): StructuredJob[] {
  const jobs: StructuredJob[] = [];
  const usedTitles = new Set<string>();

  for (let i = 0; i < count; i++) {
    const title =
      PAGE_TITLES[i % PAGE_TITLES.length] +
      (i >= PAGE_TITLES.length ? ` ${i}` : '');
    const company = COMPANIES[i % COMPANIES.length];
    const location = LOCATIONS[i % LOCATIONS.length];
    const workMode = WORK_MODES[i % WORK_MODES.length];
    const jobType = JOB_TYPES[i % JOB_TYPES.length];
    const seniority = SEVERITIES[i % SEVERITIES.length];

    const requiredSkills = [];
    const preferredSkills = [];
    for (let s = 0; s < 5 + (i % 4); s++) {
      requiredSkills.push(SEED_SKILLS[(i + s) % SEED_SKILLS.length]);
    }
    for (let s = 0; s < 3 + (i % 3); s++) {
      if (SEED_SKILLS[(i + s * 2) % SEED_SKILLS.length] !== requiredSkills[0]) {
        preferredSkills.push(SEED_SKILLS[(i + s * 2) % SEED_SKILLS.length]);
      }
    }

    const description = `We are looking for a skilled ${title.toLowerCase()} to join our team at ${company}. The ideal candidate will have strong experience with modern web technologies, a track record of shipping reliable software, and a collaborative mindset. This is a ${workMode} role based in ${location}${jobType !== 'full-time' ? `, ${jobType}` : ''}. We value diversity, continuous learning, and building products that make a difference.`;
    const responsibilities = [
      'Design and implement scalable features using React, TypeScript, and Node.js.',
      'Collaborate with cross-functional teams including product, design, and QA.',
      'Write unit and integration tests to ensure code quality.',
      'Participate in code reviews and contribute to technical decision-making.',
      'Help improve developer experience and onboarding processes.',
    ];

    jobs.push({
      id: `job-${i}-${Date.now()}`,
      source: JOB_SOURCES[i % JOB_SOURCES.length].name,
      sourceUrl: `https://example.com/jobs/${i}-${company.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      company,
      description,
      location,
      workMode,
      jobType,
      seniority,
      requiredSkills,
      preferredSkills,
      educationRequirements: ['B.Sc. in Computer Science or equivalent'],
      experienceRequirements: ['3+ years of professional experience'],
      responsibilities,
      salaryIfExplicit: jobType === 'full-time' ? 95000 + (i * 12000) + (i % 3000) : null,
      benefitsIfExplicit: ['Health insurance', '401k matching', 'Remote work'],
      applicationUrl: `https://example.com/apply/${i}`,
      postedAt: new Date(Date.now() - i * 86400000 * 2),
      matchFactors: null,
    });
  }

  return jobs;
}

// ─── Seed mock applications ──────────────────────────────────────────────────
export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    userId: 'user-1',
    jobId: 'job-0-1720000000000',
    status: 'applied',
    appliedAt: new Date('2026-09-15'),
    coverLetterId: 'cl-1',
    notes: 'Follow up in 3 days with recruiter.',
    documents: ['resume-tailored-0.pdf', 'cover-letter-0.pdf'],
    interviewDate: null,
    interviewTime: null,
    interviewLink: null,
    createdAt: new Date('2026-09-15'),
    updatedAt: new Date('2026-09-15'),
  },
  {
    id: 'app-2',
    userId: 'user-1',
    jobId: 'job-2-1720000000000',
    status: 'ready-to-apply',
    appliedAt: null,
    coverLetterId: null,
    notes: '',
    documents: [],
    interviewDate: null,
    interviewTime: null,
    interviewLink: null,
    createdAt: new Date('2026-09-16'),
    updatedAt: new Date('2026-09-16'),
  },
  {
    id: 'app-3',
    userId: 'user-1',
    jobId: 'job-5-1720000000000',
    status: 'saved',
    appliedAt: null,
    coverLetterId: null,
    notes: 'Great fit, waiting for job description update.',
    documents: [],
    interviewDate: null,
    interviewTime: null,
    interviewLink: null,
    createdAt: new Date('2026-09-17'),
    updatedAt: new Date('2026-09-17'),
  },
  {
    id: 'app-4',
    userId: 'user-1',
    jobId: 'job-7-1720000000000',
    status: 'discovered',
    appliedAt: null,
    coverLetterId: null,
    notes: '',
    documents: [],
    interviewDate: null,
    interviewTime: null,
    interviewLink: null,
    createdAt: new Date('2026-09-18'),
    updatedAt: new Date('2026-09-18'),
  },
  {
    id: 'app-5',
    userId: 'user-1',
    jobId: 'job-9-1720000000000',
    status: 'interview',
    appliedAt: new Date('2026-09-10'),
    coverLetterId: 'cl-2',
    notes: 'Interview on 2026-09-28 at 3pm.',
    documents: ['resume-master.pdf', 'cover-letter-1.pdf'],
    interviewDate: '2026-09-28',
    interviewTime: '15:00',
    interviewLink: 'https://meet.example.com/jobora-interview-5',
    createdAt: new Date('2026-09-08'),
    updatedAt: new Date('2026-09-10'),
  },
];

// ─── Seed mock job matches ───────────────────────────────────────────────────
export function generateMockMatches(profileId: string, jobIds: string[]): JobMatch[] {
  return jobIds.map((jobId, idx) => {
    const score = 62 + (idx % 35);
    return {
      jobId,
      userId: 'user-1',
      overallScore: score,
      matchingSkills: [
        'React',
        'TypeScript',
        'Node.js',
        'PostgreSQL',
        'FastAPI',
        'Docker',
      ].slice(0, 3 + (idx % 4)),
      missingOrWeakRequirements: [
        'GraphQL',
        'Kubernetes',
        'System Design',
      ].slice(0, 1 + (idx % 2)),
      experienceAlignment: 0.7 + (idx % 30) / 100,
      educationAlignment: 0.9,
      locationAlignment: 1.0,
      workModeAlignment: workModeScore(jobId, workModeFromJob(jobId)),
      otherFactors: ['Years of experience', 'Domain knowledge'],
      summary: `Strong alignment with your background. You match most required skills and have strong experience in the core technologies.`,
      matchedAt: new Date(Date.now() - idx * 86400000 * 3),
    };
  });
}

function workModeScore(jobId: string, workMode: string): number {
  if (workMode === 'remote') return 1.0;
  if (workMode === 'hybrid') return 0.6;
  return 0.4;
}

function workModeFromJob(jobId: string): string {
  const i = parseInt(jobId.split('-')[1] || '0', 10);
  const mod = i % 3;
  return mod === 0 ? 'remote' : mod === 1 ? 'hybrid' : 'onsite';
}

// ─── Mock analytics data ─────────────────────────────────────────────────────
export const SEED_ANALYTICS: AnalyticsRecord[] = [
  { metric: 'applications', value: 24, label: 'total', period: '30d' },
  { metric: 'interviews', value: 5, label: 'interviews', period: '30d' },
  { metric: 'offers', value: 1, label: 'offers', period: '30d' },
  { metric: 'responseRate', value: 28, label: 'response rate', period: '30d' },
  { metric: 'interviewRate', value: 21, label: 'interview rate', period: '30d' },
  { metric: 'applicationsByRole', value: 3, label: 'Software Engineer', period: '30d' },
  { metric: 'applicationsByLocation', value: 8, label: 'Remote', period: '30d' },
  { metric: 'cvVersionUsage', value: 2, label: 'tailored-cv-01', period: '30d' },
];

export const SEED_INSIGHTS: Insight[] = [
  {
    observation: 'Your last 20 applications included 8 Software Engineer roles and 12 Full-Stack Engineer roles.',
    category: 'roleDistribution',
  },
  { observation: 'Jobs in San Francisco, CA make up 35% of your applications.', category: 'locationDistribution' },
  { observation: 'Your response rate improved by 8% after using tailored CVs in your last 10 applications.', category: 'performanceTrend' },
  { observation: 'Applications submitted mid-week (Tue-Thu) have a 15% higher interview rate than those on Fridays.', category: 'timingInsight' },
];

// ─── Default profile (for new users) ─────────────────────────────────────────
export function getDefaultProfile(): CandidateProfile {
  return {
    id: 'profile-default',
    userId: 'user-1',
    name: 'Your Name',
    summary: 'Add your professional summary here.',
    location: '',
    targetRoles: [],
    preferredLocations: [],
    workModePreference: 'remote',
    industries: [],
    salaryExpectation: null,
    workAuthorization: null,
    jobTypes: ['full-time'],
    education: [],
    experiences: [],
    skills: SEED_SKILLS.map((name) => ({
      id: `skill-${name.toLowerCase()}-default`,
      profileId: 'profile-default',
      name,
      verified: false,
      proficiency: 'intermediate',
    })),
    projects: [],
    certifications: [],
    languages: [],
    links: [],
    createdByWizard: false,
    updatedAt: new Date(),
  };
}
