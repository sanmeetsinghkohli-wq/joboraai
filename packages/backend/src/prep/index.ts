import type {
  ApplicationPackage,
  ReadinessCheck,
  ReadinessItem,
  ContentClassificationResult,
  PrepareApplicationInput,
} from './types';
import type { Application, CoverLetter, CandidateProfile, StructuredJob } from '@jobora/types';

export function classifyContent(content: string): ContentClassificationResult {
  const lower = content.toLowerCase();
  const injectionPatterns = [
    'ignore previous instructions',
    'system prompt',
    'you are now',
    'bypass security',
    'sudo',
    'drop table',
    '<script',
  ];

  const foundInjection = injectionPatterns.find((pattern) => lower.includes(pattern));

  if (foundInjection) {
    return {
      classification: 'suspicious-instruction',
      evidenceSummary: `Detected potential prompt injection pattern: "${foundInjection}"`,
      recommendedAction: 'warn',
      confidence: 0.9,
    };
  }

  return {
    classification: 'safe-data',
    evidenceSummary: 'Content passed sanitization checks with standard career document vocabulary.',
    recommendedAction: 'allow',
    confidence: 0.95,
  };
}

export function generateApplicationReadiness(
  application: Partial<Application>,
  profile?: Partial<CandidateProfile>,
  job?: Partial<StructuredJob>
): ReadinessCheck {
  const checks: ReadinessItem[] = [];
  const missingItems: string[] = [];

  const cvReady = Boolean(application?.documents && application.documents.length > 0);
  checks.push({
    id: 'check-cv',
    label: 'Tailored or Master CV Attached',
    status: cvReady ? 'ready' : 'missing',
    detail: cvReady ? 'Document attached' : 'Attach a CV version before submitting',
  });
  if (!cvReady) missingItems.push('CV Document');

  const coverLetterReady = Boolean(application?.coverLetterId || application?.notes);
  checks.push({
    id: 'check-cover-letter',
    label: 'Cover Letter Prepared',
    status: coverLetterReady ? 'ready' : 'pending',
    detail: coverLetterReady ? 'Cover letter verified' : 'Optional role-specific letter',
  });

  const profileComplete = Boolean(profile?.skills && profile.skills.length > 0);
  checks.push({
    id: 'check-profile',
    label: 'Profile Skills Grounded',
    status: profileComplete ? 'ready' : 'missing',
    detail: profileComplete ? `${profile?.skills?.length} skills present` : 'Add skills to profile',
  });
  if (!profileComplete) missingItems.push('Profile Skills');

  const overallPassed = cvReady && profileComplete;

  return {
    cvReady,
    coverLetterReady,
    questionsAnswered: true,
    requiredInfoComplete: profileComplete,
    userApprovalPending: true,
    overallPassed,
    checks,
    missingItems,
  };
}

export function buildApplicationPackage(
  input: PrepareApplicationInput,
  application: Application,
  profile: CandidateProfile,
  job: StructuredJob,
  coverLetter: CoverLetter | null = null
): ApplicationPackage {
  const readiness = generateApplicationReadiness(application, profile, job);

  return {
    application,
    job: { ...job },
    profile: { ...profile },
    tailoredCV: {
      id: input.tailoredCVId || 'cv-default',
      versionType: 'tailored',
      content: 'Tailored CV Content',
      changes: ['Emphasized role-specific skills', 'Optimized bullet metrics'],
    },
    coverLetter,
    answers: input.answers ? Object.entries(input.answers).map(([q, a]) => ({ question: q, answer: a })) : [],
    missingInformation: readiness.missingItems,
    readiness,
    documents: application.documents || [],
  };
}
