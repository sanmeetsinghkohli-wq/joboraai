import type {
  CandidateProfile,
  Education,
  Experience,
  Project,
  Skill,
  Certification,
  Language,
  ProfileLink,
  CandidateProfileDraft,
} from '@jobora/types';

export type {
  CandidateProfile,
  Education,
  Experience,
  Project,
  Skill,
  Certification,
  Language,
  ProfileLink,
  CandidateProfileDraft,
};

// ─── CV extraction ───────────────────────────────────────────────────────────
export interface ExtractionResult {
  success: boolean;
  profile?: CandidateProfile;
  draft?: CandidateProfileDraft;
  missingInformation: string[];
  entities: ExtractedEntity[];
  confidence: number;
  warnings: string[];
}

export interface ExtractedEntity {
  type: 'name' | 'contact' | 'summary' | 'skill' | 'experience' | 'education' | 'project' | 'certification' | 'language' | 'link';
  value: string;
  confidence: number;
}

export interface CVExtractionInput {
  fileName: string;
  content: string;
  userId: string;
}

// ─── CV analysis ─────────────────────────────────────────────────────────────
export interface CVAnalysis {
  overallReadiness: number;
  overallStatus: 'excellent' | 'good' | 'fair' | 'needs-improvement' | 'weak';
  categories: CVAnalysisCategory[];
  issues: CVIssue[];
  quickWins: string[];
  gaps: string[];
}

export interface CVAnalysisCategory {
  id: string;
  label: string;
  score: number;
  status: 'good' | 'warning' | 'poor';
  issues: CVIssue[];
}

export interface CVIssue {
  id: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  traceableTo?: string;
}

// ─── Tailored CV ─────────────────────────────────────────────────────────────
export interface TailoredCVCandidate {
  summary: string;
  skillsOrder: string[];
  experienceRewrites: ExperienceRewrite[];
  projectRewrites: ProjectRewrite[];
  changes: Change[];
  reviewFlags: ReviewFlag[];
  atsScore: number;
}

export interface ExperienceRewrite {
  original: string;
  rewritten: string;
  reason: string;
  traceableTo: string;
}

export interface ProjectRewrite {
  original: string;
  rewritten: string;
  reason: string;
  traceableTo: string;
}

export interface Change {
  section: string;
  original: string;
  proposed: string;
  type: 'add' | 'remove' | 'rewrite';
  traceableTo: string;
}

export interface ReviewFlag {
  section: string;
  message: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
}

// ─── Cover letter ────────────────────────────────────────────────────────────
export interface CoverLetterDraft {
  coverLetter: string;
  personalizationPoints: string[];
  source: { profileId: string; jobId: string };
}

// ─── Application answers ─────────────────────────────────────────────────────
export interface AnswerDraft {
  question: string;
  draftAnswer: string;
  missingUserInput: string[];
  confidence: number;
  warnings: string[];
}

// ─── Planner ─────────────────────────────────────────────────────────────────
export interface PlanStep {
  id: string;
  description: string;
  tool: string;
  requiresApproval: boolean;
  priority: 'high' | 'normal' | 'low';
}

export interface PlannerOutput {
  plan: PlanStep[];
  explanation: string;
  estimatedSteps: number;
}
