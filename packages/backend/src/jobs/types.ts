import type { WorkMode, JobType, Seniority, MatchFactor, JobMatch } from '@jobora/types';

export type { JobMatch, MatchFactor, WorkMode, JobType, Seniority };

// ─── Job search ──────────────────────────────────────────────────────────────
export interface JobSearchInput {
  query?: string;
  filters?: {
    location?: string;
    workMode?: WorkMode[];
    jobType?: JobType[];
    seniority?: Seniority[];
    industries?: string[];
    skills?: string[];
    datePosted?: string;
    salaryMin?: number;
    salaryMax?: number;
  };
  page: number;
  pageSize: number;
  sortBy: 'relevance' | 'posted' | 'match' | 'salary';
  sortDirection: 'asc' | 'desc';
}

export interface JobSearchResult {
  jobs: JobSearchJob[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facetCounts: Record<string, number[]>;
}

export interface JobSearchJob {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  description: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  seniority: Seniority;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string[];
  experienceRequirements: string[];
  responsibilities: string[];
  salaryIfExplicit: number | null;
  benefitsIfExplicit: string[];
  applicationUrl: string | null;
  postedAt: Date;
  matchFactors: MatchFactor[] | null;
  isMock?: boolean;
}

// ─── Job parsing ─────────────────────────────────────────────────────────────
export interface ParsedJob {
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  seniority: Seniority;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string[];
  experienceRequirements: string[];
  responsibilities: string[];
  salaryIfExplicit: number | null;
  benefitsIfExplicit: string[];
  applicationUrl: string | null;
  source: string;
  rawDescription: string;
  sourceUrl: string;
}

// ─── Job matching ────────────────────────────────────────────────────────────
export interface MatchResult {
  jobId: string;
  profileId: string;
  overallScore: number;
  matchingSkills: string[];
  missingOrWeakRequirements: string[];
  experienceAlignment: number;
  educationAlignment: number;
  locationAlignment: number;
  workModeAlignment: number;
  otherFactors: string[];
  summary: string;
  matchedAt: Date;
}

// ─── Job detail ──────────────────────────────────────────────────────────────
export interface JobDetail extends JobSearchJob {
  rawContent?: string;
}
