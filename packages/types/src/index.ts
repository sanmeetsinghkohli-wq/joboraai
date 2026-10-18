import { z } from 'zod';

// ─── Core identifiers ────────────────────────────────────────────────────────
export type UserId = string;
export type ResumeId = string;
export type JobId = string;
export type ApplicationId = string;
export type InterviewId = string;
export type NotificationId = string;
export type AgentTaskId = string;
export type VersionId = string;

// ─── Users & Mandatory Verification ─────────────────────────────────────────
export interface User {
  id: UserId;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | string | null;
  onboardingCompleted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserSession {
  token: string;
  user: User;
  expiresAt: Date | string;
}

// ─── Email Integrations (User-Authorized Gmail / Outlook) ────────────────────
export type EmailProvider = 'gmail' | 'outlook';
export type EmailConnectionStatus = 'connected' | 'disconnected' | 'error' | 'requires_reconnection';

export interface EmailConnection {
  id: string;
  userId: UserId;
  provider: EmailProvider;
  email: string;
  status: EmailConnectionStatus;
  connectedAt: Date | string;
  lastUsedAt?: Date | string | null;
}

export type EmailSendStatus =
  | 'draft'
  | 'ready_for_review'
  | 'awaiting_confirmation'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'requires_reconnection'
  | 'outcome_unknown';

export interface EmailSendEvent {
  id: string;
  userId: UserId;
  applicationId: ApplicationId;
  provider: EmailProvider;
  providerMessageId?: string | null;
  status: EmailSendStatus;
  recipientEmail: string;
  subject: string;
  errorCode?: string | null;
  sentAt: Date | string;
}

// ─── Candidate profiles ──────────────────────────────────────────────────────
export interface Skill {
  id: string;
  profileId: string;
  name: string;
  verified: boolean;
  proficiency: 'beginner' | 'intermediate' | 'proficient' | 'expert';
}

export interface Experience {
  id: string;
  profileId: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  profileId: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Project {
  id: string;
  profileId: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  link?: string;
}

export interface Certification {
  id: string;
  profileId: string;
  name: string;
  issuingOrganization: string;
  date: string;
  link?: string;
}

export interface Language {
  id: string;
  profileId: string;
  name: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'native';
}

export interface ProfileLink {
  id: string;
  profileId: string;
  label: string;
  url: string;
  type: 'portfolio' | 'github' | 'linkedin' | 'website' | 'other';
}

export interface CandidateProfile {
  id: string;
  userId: UserId;
  name: string;
  summary: string;
  location: string;
  targetRoles: string[];
  preferredLocations: string[];
  workModePreference: 'remote' | 'hybrid' | 'onsite';
  industries: string[];
  salaryExpectation: number | null;
  workAuthorization: string | null;
  jobTypes: string[];
  education: Education[];
  experiences: Experience[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  links: ProfileLink[];
  createdByWizard: boolean;
  updatedAt: Date;
}

export interface ProfileReadiness {
  percentage: number;
  status: 'incomplete' | 'partial' | 'complete';
  missingFields: string[];
  missingSkills: string[];
  readyForJobs: boolean;
  readyForApplications: boolean;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────
export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
export type Seniority = 'internship' | 'junior' | 'mid-senior' | 'director' | 'executive';

export interface StructuredJob {
  id: JobId;
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
}

export interface MatchFactor {
  category: 'skills' | 'experience' | 'education' | 'location' | 'workMode' | 'other';
  label: string;
  present: boolean;
  level: number; // 0-1
}

export interface JobMatch {
  jobId: JobId;
  userId: UserId;
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

// ─── Applications ────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'discovered'
  | 'saved'
  | 'preparing'
  | 'ready-to-apply'
  | 'applied'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'closed';

export interface Application {
  id: ApplicationId;
  userId: UserId;
  jobId: JobId;
  status: ApplicationStatus;
  appliedAt: Date | null;
  coverLetterId: string | null;
  notes: string;
  documents: string[];
  interviewDate: string | null;
  interviewTime: string | null;
  interviewLink: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationAnswer {
  id: string;
  applicationId: ApplicationId;
  question: string;
  answer: string;
  draft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverLetter {
  id: string;
  applicationId: ApplicationId;
  content: string;
  personalizationPoints: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── CV storage & versioning ─────────────────────────────────────────────────
export interface Resume {
  id: ResumeId;
  userId: UserId;
  fileName: string;
  fileType: 'pdf' | 'docx';
  filePath: string; // server-side only
  isMaster: boolean;
  content: string; // extracted text (server-side)
  parsedProfiles: CandidateProfile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeVersion {
  id: VersionId;
  resumeId: ResumeId;
  jobId: JobId | null;
  versionType: 'master' | 'tailored' | 'draft';
  content: string;
  changes: string[];
  reviewFlags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VersionDiff {
  section: string;
  additions: string[];
  removals: string[];
  rewrites: { original: string; new: string }[];
}

// ─── Agent / AI ──────────────────────────────────────────────────────────────
export interface AgentTool {
  name: string;
  description: string;
  params: Record<string, any>;
  requiresApproval: boolean;
  isExternal: boolean;
}

export const AgentToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  params: z.record(z.any()),
  requiresApproval: z.boolean(),
  isExternal: z.boolean(),
});

export type AgentToolObj = z.infer<typeof AgentToolSchema>;

export interface AgentPermission {
  userId: UserId;
  toolName: string;
  status: 'allowed' | 'denied' | 'requires-review';
  grantedAt: Date;
  expiresAt: Date | null;
}

export interface AgentTask {
  id: AgentTaskId;
  userId: UserId;
  taskType: string;
  status: 'queued' | 'planning' | 'running' | 'needs-approval' | 'completed' | 'failed';
  state: Record<string, unknown>;
  plan: string[];
  result: string | null;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolUse?: {
    tool: string;
    input: Record<string, unknown>;
    output: unknown;
  };
  timestamp: Date;
}

// ─── Security / untrusted content ────────────────────────────────────────────
export type ContentClassification = 'safe-data' | 'suspicious-instruction' | 'high-risk-injection';

export interface ContentClassificationResult {
  classification: ContentClassification;
  evidenceSummary: string;
  recommendedAction: 'log' | 'block' | 'warn' | 'allow';
  confidence: number;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface AnalyticsRecord {
  metric: string;
  value: number;
  label?: string;
  period?: string;
}

export interface Insight {
  observation: string;
  category: string;
}

// ─── API shapes ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: unknown;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

// ─── CV extraction result ────────────────────────────────────────────────────
export interface CandidateProfileDraft {
  id: string;
  name: string;
  summary: string | null;
  location: string | null;
  targetRoles: string[] | null;
  skills: string[];
  experiences: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  certifications: string[];
  languages: string[];
  links: Array<{ label: string; url: string }>;
  missingInformation: string[];
}

// ─── CV analysis result ──────────────────────────────────────────────────────
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
}

export interface CVAnalysisResult {
  overallReadiness: number;
  overallStatus: 'excellent' | 'good' | 'fair' | 'needs-improvement' | 'weak';
  categories: CVAnalysisCategory[];
  issues: CVIssue[];
  quickWins: string[];
  gaps: string[];
}

// ─── Form / UI shapes ────────────────────────────────────────────────────────
export interface OnboardingStep {
  id: string;
  label: string;
  field: string;
  type: 'text' | 'select' | 'textarea' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

// ─── Tailored CV & Generation Types ──────────────────────────────────────────
export interface TailoredCVCandidate {
  summary: string;
  skillsOrder: string[];
  experienceRewrites: Array<{
    id?: string;
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  projectRewrites: Array<{
    id?: string;
    name: string;
    description: string;
    technologies: string[];
  }>;
  changes: Array<{
    section: string;
    original: string;
    proposed: string;
    type: 'add' | 'remove' | 'rewrite';
    traceableTo: string;
  }>;
  reviewFlags: Array<{
    section: string;
    message: string;
    severity: 'info' | 'minor' | 'major' | 'critical';
  }>;
  atsScore: number;
}

export interface CoverLetterDraft {
  coverLetter: string;
  personalizationPoints: string[];
  source: { profileId: string; jobId: string };
}

export interface AnswerDraft {
  question: string;
  draftAnswer: string;
  missingUserInput: string[];
  confidence: number;
  warnings: string[];
}

// ─── Agent Request / Response / Events ───────────────────────────────────────
export interface AgentRequest {
  userId: string;
  request: string;
  context?: Record<string, unknown>;
  allowedTools?: string[];
}

export interface AgentResponse {
  taskId: string;
  status: 'idle' | 'planning' | 'running' | 'needs-approval' | 'completed' | 'failed';
  plan: string[];
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    toolUse?: {
      tool: string;
      input: Record<string, unknown>;
      output: unknown;
      status: 'pending' | 'running' | 'completed' | 'blocked';
      error?: string;
    };
  }>;
  result: unknown | null;
  needsApproval: boolean;
  approvalRequiredFor: string[];
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface AgentEvent {
  type: 'status_changed' | 'message_added' | 'step_completed' | 'approval_required';
  taskId: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

// ─── Document Vault ──────────────────────────────────────────────────────────
export interface VaultDocument {
  id: string;
  userId: UserId;
  applicationId?: string | null;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize?: number;
  isMasterResume?: boolean;
  uploadedAt: Date | string;
}

// ─── Interview Prep & Simulator ──────────────────────────────────────────────
export interface InterviewQuestionItem {
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'role-specific';
  framework: string;
  sampleAnswer: string;
  userDraft?: string;
  feedback?: {
    score: number;
    relevance: string;
    clarity: string;
    strengths: string[];
    improvements: string[];
  };
}

export interface InterviewSession {
  id: string;
  userId: UserId;
  jobId?: string;
  jobTitle: string;
  companyName: string;
  questions: InterviewQuestionItem[];
  overallFeedback?: string;
  createdAt: Date | string;
}

// ─── Career Insights & Skill Gaps ────────────────────────────────────────────
export interface SkillGapItem {
  skill: string;
  type: 'required' | 'preferred';
  status: 'possessed' | 'gap';
  demonstratedProject?: string;
}

export interface CareerInsightReport {
  targetRole: string;
  readinessPercentage: number;
  verifiedSkills: string[];
  requiredGaps: string[];
  preferredGaps: string[];
  recommendedLearnings: Array<{
    skill: string;
    title: string;
    provider: string;
    type: 'course' | 'project' | 'documentation';
  }>;
  relatedRoles: string[];
}

