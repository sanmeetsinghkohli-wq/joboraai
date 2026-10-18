import type { AgentTool, AgentToolObj, AgentPermission } from '@jobora/types';

export type { AgentTool, AgentToolObj, AgentPermission };

export interface Agent {
  userId: string;
  state: AgentState;
  messages: AgentMessage[];
  permissions: AgentPermission[];
  toolRegistry: Map<string, AgentToolObj>;
  sessionContext: Record<string, unknown>;
  startedAt: Date;
}

// ─── Agent state ─────────────────────────────────────────────────────────────
export type AgentStatus = 'idle' | 'planning' | 'running' | 'needs-approval' | 'completed' | 'failed';

export interface AgentState {
  status: AgentStatus;
  currentStep: number;
  totalSteps: number;
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
  permissions: Array<{
    userId: string;
    toolName: string;
    status: 'allowed' | 'denied' | 'requires-review';
    grantedAt: Date;
    expiresAt: Date | null;
    source: 'user' | 'policy' | 'default';
    justification?: string;
  }>;
  result: unknown | null;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface AgentRequest {
  userId: string;
  request: string;
  context?: Record<string, unknown>;
  allowedTools?: string[];
}

export interface AgentResponse {
  taskId: string;
  status: AgentStatus;
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

export interface AgentMessage {
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
}

export interface ToolResult {
  tool: string;
  success: boolean;
  output: unknown;
  durationMs: number;
  warnings: string[];
}

export interface ToolRegistry {
  tools: Map<string, AgentTool>;
  register(tool: AgentTool): void;
  get(name: string): AgentTool | undefined;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  userId: string;
  toolName: string;
  target: Record<string, unknown>;
  summary: string;
  dataToSubmit: Record<string, unknown>;
  documents: string[];
  reason: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AgentEvent {
  taskId: string;
  userId: string;
  type: 'tool-start' | 'tool-complete' | 'approval-request' | 'approval-granted' | 'approval-denied' | 'error' | 'progress' | 'completion';
  payload: Record<string, unknown>;
  timestamp: Date;
}
