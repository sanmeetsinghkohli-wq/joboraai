import type { SecurityLayer, ContentClassificationResult, ToolValidation, ExternalActionCheck, SanitizedInput, InjectionRule, SensitiveDataRule } from './types';
import { z } from 'zod';

// ─── Injection rules ─────────────────────────────────────────────────────────
const INJECTION_RULES: InjectionRule[] = [
  {
    id: 'ignore-instruction',
    pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier|given)\s+(instructions|prompts|commands|directions|orders)/i,
    severity: 'high',
    description: 'Attempt to ignore prior instructions',
    action: 'block',
  },
  {
    id: 'disregard-all',
    pattern: /disregard\s+(all\s+)?(previous|prior|above|earlier|given)/i,
    severity: 'high',
    description: 'Attempt to disregard previous context',
    action: 'block',
  },
  {
    id: 'override-system',
    pattern: /(?:override|reset|delete|clear)\s+(all|everything|system\s+instructions|your\s+instructions|the\s+system)/i,
    severity: 'high',
    description: 'Attempt to override system instructions',
    action: 'block',
  },
  {
    id: 'role-adopt',
    pattern: /([^.]*)you\s+are\s+(now|a|my)\s+(assistant|admin|developer|root|supervisor)/i,
    severity: 'high',
    description: 'Attempt to adopt a different role',
    action: 'block',
  },
  {
    id: 'reveal-system',
    pattern: /system\s+(prompt|instruction|rule|directive|instructions)\s+(?:is|are|was|were)?\s*(?::"|'=|reveal|show|display|expose)/i,
    severity: 'medium',
    description: 'Attempt to reveal system prompts',
    action: 'warn',
  },
  {
    id: 'leak-context',
    pattern: /(:|'|"|=|>)\s*(?:api\s+key|secret|password|token|auth|credential|private)\s*/i,
    severity: 'high',
    description: 'Attempt to obtain secrets',
    action: 'block',
  },
  {
    id: 'command-injection',
    pattern: /(?:(?:!|\$\(|`|;)\s*(?:rm|del|format|format|copy|move|shutdown|reboot|sudo|chmod|chown|wget|curl)\b)/i,
    severity: 'high',
    description: 'Attempt command injection',
    action: 'block',
  },
  {
    id: 'data-theft',
    pattern: /(?:export|print|return|output|display)\s+(?:all\s+)?(?:api\s+keys|secrets|credentials|database\s+credentials|environment)/i,
    severity: 'high',
    description: 'Attempt data theft',
    action: 'block',
  },
];

// ─── Sensitive data rules ────────────────────────────────────────────────────
const SENSITIVE_DATA_RULES: SensitiveDataRule[] = [
  {
    id: 'api-key-pattern',
    patterns: [
      /sk-[A-Za-z0-9]{20,}/,
      /ghp_[A-Za-z0-9]{30,}/,
      /AIza[A-Za-z0-9_-]{30,}/,
      /xox[baprs]-([A-Za-z0-9-]{10,})/,
      /-----BEGIN\s+(?:RSA|OPENSSH|SEC1)?\s+PRIVATE\s+KEY-----/,
    ],
    message: 'Sensitive credential detected in content',
    action: 'redact',
  },
  {
    id: 'password-pattern',
    patterns: [
      /password\s*[:=]\s*\S{6,}/i,
      /passwd\s*[:=]\s*\S{6,}/i,
      /secret\s*[:=]\s*\S{6,}/i,
    ],
    message: 'Password or secret detected',
    action: 'redact',
  },
  {
    id: 'email-pattern',
    patterns: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    ],
    message: 'Email address detected',
    action: 'redact',
  },
];

// ─── Security layer implementation ───────────────────────────────────────────
export const securityLayer: SecurityLayer = {
  classifyContent(text: string): ContentClassificationResult {
    if (!text || text.length === 0) {
      return { classification: 'safe-data', evidenceSummary: 'Empty content', recommendedAction: 'log', confidence: 1.0 };
    }

    const lower = text.toLowerCase();
    const highRiskPatterns: string[] = [];
    const mediumRiskPatterns: string[] = [];

    for (const rule of INJECTION_RULES) {
      if (rule.pattern.test(lower)) {
        if (rule.severity === 'high') {
          highRiskPatterns.push(rule.description);
        } else {
          mediumRiskPatterns.push(rule.description);
        }
      }
    }

    // Differentiate: "ignore instructions" in a job posting directed at a human is not injection
    const humanDirected = /human|applicant|apply now|read this before applying/i.test(lower);
    const aiDirected = /agent|ai|assistant|ignore the\s+(?:above|previous|prior)|override all/gi.test(lower);

    if (highRiskPatterns.length > 0 && !humanDirected) {
      return {
        classification: 'high-risk-injection',
        evidenceSummary: highRiskPatterns.join('; '),
        recommendedAction: 'block',
        confidence: 0.95,
      };
    }

    if (mediumRiskPatterns.length > 0 && !humanDirected) {
      return {
        classification: 'suspicious-instruction',
        evidenceSummary: mediumRiskPatterns.join('; '),
        recommendedAction: 'warn',
        confidence: 0.8,
      };
    }

    // Check for secrets
    for (const rule of SENSITIVE_DATA_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(lower)) {
          return {
            classification: 'high-risk-injection',
            evidenceSummary: rule.message,
            recommendedAction: 'block',
            confidence: 0.98,
          };
        }
      }
    }

    return { classification: 'safe-data', evidenceSummary: 'No injection patterns detected', recommendedAction: 'allow', confidence: 0.99 };
  },

  validateToolCall(toolName: string, input: Record<string, unknown>): ToolValidation {
    const sanitized: Record<string, unknown> = {};
    const removedKeys: string[] = [];
    const warnings: string[] = [];

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        const lowerVal = value.toLowerCase();
        const suspiciousPatterns = [
          /ignore\s+(all\s+)?(previous|prior|above|earlier)/i,
          /disregard\s+(all\s+)?(previous|prior)/i,
          /override\s+(all|everything|system)/i,
          /you\s+are\s+(now|a|my)\s+(assistant|admin|root)/i,
          /api\s*[:=]\s*\S{10,}/i,
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(lowerVal)) {
            warnings.push(`Possible injection pattern in key "${key}"`);
            removedKeys.push(key);
            break;
          }
        }
      }

      if (value === null || typeof value === 'undefined') {
        removedKeys.push(key);
        warnings.push(`Null/undefined value removed from key "${key}"`);
      } else if (typeof value === 'string' && value.length > 10000) {
        warnings.push(`Very long string truncated in key "${key}"`);
        sanitized[key] = value.substring(0, 10000);
      } else {
        sanitized[key] = value;
      }
    }

    return {
      valid: removedKeys.length === 0,
      reason: removedKeys.length === 0 ? 'Input accepted' : 'Suspicious or invalid fields removed',
      requiredApprovals: [],
      sanitizedInput: sanitized,
    };
  },

  checkExternalAction(action: string, target: string): ExternalActionCheck {
    const blockedDomains = ['http://localhost', 'http://127.0.0.1', 'file://'];
    const lowerAction = action.toLowerCase();
    const lowerTarget = target.toLowerCase();

    if (blockedDomains.some((d) => lowerTarget.includes(d))) {
      return {
        allowed: false,
        reason: 'Localhost and file URLs are blocked for external actions',
        requiresApproval: true,
        requiresConfirmation: true,
        maxRiskScore: 10,
      };
    }

    const highRiskActions = ['submit', 'delete', 'send', 'pay', 'transfer', 'withdraw', 'upload'];
    const isHighRisk = highRiskActions.some((a) => lowerAction.includes(a));

    return {
      allowed: !isHighRisk,
      reason: isHighRisk ? 'High-risk external action requires explicit confirmation' : 'Action allowed after review',
      requiresApproval: isHighRisk,
      requiresConfirmation: isHighRisk,
      maxRiskScore: isHighRisk ? 8 : 2,
    };
  },

  sanitizeUserInput(input: Record<string, unknown>): SanitizedInput {
    const sanitized: Record<string, unknown> = {};
    const removedKeys: string[] = [];
    const warnings: string[] = [];

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        // Limit extremely long strings
        if (value.length > 50000) {
          warnings.push(`Key "${key}" truncated to 50000 chars`);
          sanitized[key] = value.substring(0, 50000);
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        const nested = this.sanitizeUserInput(value as Record<string, unknown>);
        sanitized[key] = nested.data;
        removedKeys.push(...nested.removedKeys);
        warnings.push(...nested.warnings);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else {
        removedKeys.push(key);
        warnings.push(`Non-string/non-object key "${key}" removed`);
      }
    }

    return { data: sanitized, removedKeys, warnings };
  },
};
