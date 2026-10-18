import type { Application, ApplicationStatus, CoverLetter } from '@jobora/types';

// ─── Application package ─────────────────────────────────────────────────────
export interface ApplicationPackage {
  application: Application;
  job: Record<string, unknown>;
  profile: Record<string, unknown>;
  tailoredCV: {
    versionType: 'master' | 'tailored' | 'draft';
    id: string;
    content: string;
    changes: string[];
  };
  coverLetter: CoverLetter | null;
  answers: Record<string, unknown>[];
  missingInformation: string[];
  readiness: ReadinessCheck;
  documents: string[];
}

// ─── Readiness checklist ─────────────────────────────────────────────────────
export interface ReadinessItem {
  id: string;
  label: string;
  status: 'pending' | 'ready' | 'missing' | 'approved';
  detail?: string;
}

export interface ReadinessCheck {
  cvReady: boolean;
  coverLetterReady: boolean;
  questionsAnswered: boolean;
  requiredInfoComplete: boolean;
  userApprovalPending: boolean;
  overallPassed: boolean;
  checks: ReadinessItem[];
  missingItems: string[];
}

// ─── Content classification ──────────────────────────────────────────────────
export interface ContentClassificationResult {
  classification: 'safe-data' | 'suspicious-instruction' | 'high-risk-injection';
  evidenceSummary: string;
  recommendedAction: 'log' | 'block' | 'warn' | 'allow';
  confidence: number;
}

// ─── Application preparation input ───────────────────────────────────────────
export interface PrepareApplicationInput {
  userId: string;
  jobId: string;
  profileId: string;
  coverLetter?: string;
  answers?: Record<string, string>;
  tailoredCVId: string;
}

// ─── Application copilot ─────────────────────────────────────────────────────
export interface CopiedFormField {
  id: string;
  name: string;
  label: string;
  value: string;
  fieldType: string;
  detected: boolean;
  mapped: boolean;
  warnings: string[];
}

export interface CopiedFormMap {
  sourceUrl: string;
  domain: string;
  title: string;
  detectedFields: CopiedFormField[];
  mappedValues: Record<string, string>;
  warnings: string[];
  status: 'inspecting' | 'mapped' | 'reviewing' | 'submitting';
  step: string;
}

export interface CopiedActionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  userInitiated: boolean;
}
