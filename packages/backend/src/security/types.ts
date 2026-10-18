import type { ContentClassification } from '@jobora/types';

// ─── Security layer ──────────────────────────────────────────────────────────
export interface SecurityLayer {
  classifyContent(text: string): ContentClassificationResult;
  validateToolCall(toolName: string, input: Record<string, unknown>): ToolValidation;
  checkExternalAction(action: string, target: string): ExternalActionCheck;
  sanitizeUserInput(input: Record<string, unknown>): SanitizedInput;
}

export interface ContentClassificationResult {
  classification: ContentClassification;
  evidenceSummary: string;
  recommendedAction: 'log' | 'block' | 'warn' | 'allow';
  confidence: number;
}

export interface ToolValidation {
  valid: boolean;
  reason: string;
  requiredApprovals: string[];
  sanitizedInput: Record<string, unknown>;
}

export interface ExternalActionCheck {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
  requiresConfirmation: boolean;
  maxRiskScore: number;
}

export interface SanitizedInput {
  data: Record<string, unknown>;
  removedKeys: string[];
  warnings: string[];
}

// ─── Injection pattern rules ───────────────────────────────────────────────────
export interface InjectionRule {
  id: string;
  pattern: RegExp;
  severity: 'high' | 'medium' | 'low';
  description: string;
  action: 'block' | 'warn';
}

export interface SensitiveDataRule {
  id: string;
  patterns: RegExp[];
  message: string;
  action: 'redact' | 'block';
}
