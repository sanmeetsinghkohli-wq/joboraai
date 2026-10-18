// ─── Backend package exports ─────────────────────────────────────────────────

// CV extraction & analysis
export { extractCandidateProfile, analyzeCV } from './cv/index';
export type { CandidateProfileDraft, CVAnalysis, CVAnalysisCategory, CVIssue, ExtractionResult, CVExtractionInput, Experience, Education, Project, Skill, Certification, Language, ProfileLink } from './cv/types';

// Job discovery & matching
export { searchJobs, getJob, computeJobMatch, parseJobDescription } from './jobs/index';
export type { JobSearchInput, JobSearchResult, ParsedJob, MatchResult, JobMatch } from './jobs/types';

// Tailored CV & cover letter
export { generateTailoredCV, generateCoverLetter, draftApplicationAnswers } from './generation/index';
export type { TailoredCVCandidate, CoverLetterDraft, AnswerDraft } from './generation/types';

// Application preparation
export { buildApplicationPackage, generateApplicationReadiness, classifyContent } from './prep/index';
export type { ApplicationPackage, ReadinessCheck, ContentClassificationResult } from './prep/types';

// Agent system
export { createAgent, getToolRegistry, registerTool, runTool, planRequest, validateToolCall } from './agent/index';
export type { Agent, AgentToolObj, AgentState, AgentRequest, AgentResponse, ToolResult, AgentPermission, ApprovalRequest, AgentEvent } from './agent/types';

// Security
export { securityLayer } from './security/index';
export type { SecurityLayer, ToolValidation, ExternalActionCheck, SanitizedInput } from './security/types';
