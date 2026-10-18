'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

interface AgentToolLog {
  tool: string;
  status: 'completed' | 'requires_approval' | 'info';
  summary: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolLogs?: AgentToolLog[];
  suggestedActions?: Array<{ label: string; href: string }>;
  approvalRequired?: {
    actionType: 'apply_external' | 'send_email';
    targetLabel: string;
    targetHref: string;
    description: string;
  } | null;
}

const QUICK_PROMPTS = [
  'Find remote software or AI engineering jobs',
  'Explain which saved jobs match my profile',
  'Analyze my CV and identify missing keywords',
  'Generate a cover letter outline for my top job',
  'Prepare an application package with approval checklist',
  'Show applications requiring follow-up',
];

export default function AICopilotPage() {
  const { profile, jobs, savedJobIds, applications, logActivity } = useAppData();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Welcome to your **Jobora AI Career Copilot & Agent Activity Workspace**. Ask me to search live roles, explain profile match scores, audit your CV against a target role, draft a grounded cover letter, or stage an application package for your explicit approval.',
      timestamp: 'Ready',
      toolLogs: [
        {
          tool: 'system.context_sync',
          status: 'completed',
          summary: 'Connected to live Jobora workspace context (Profile, Jobs, Saved Roles, Applications).',
        },
      ],
      suggestedActions: [
        { label: 'Open Job Search', href: '/jobs' },
        { label: 'Application Preparation Copilot', href: '/applications/prepare' },
        { label: 'CV Studio', href: '/cv-studio' },
      ],
    },
  ]);

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: {
            profile,
            jobs: jobs.slice(0, 15),
            savedJobIds,
            applications,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Failed to process request.');
      } else {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolLogs: data.toolLogs || [],
          suggestedActions: data.suggestedActions || [],
          approvalRequired: data.approvalRequired || null,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        logActivity('auto_awesome', 'Ran AI Copilot task', trimmed.slice(0, 60));
      }
    } catch {
      setErrorMsg('Network error communicating with /api/copilot. Your input has been preserved.');
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };

  return (
    <StitchShell activeNav="ai-copilot">
      <div className="flex flex-col w-full py-6 gap-6 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-caption-caps text-caption-caps uppercase font-bold">
                Agent Activity &amp; Copilot
              </span>
              <span className="font-caption-caps text-caption-caps text-on-tertiary-container bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
                Human-in-the-Loop Approval Enforced
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              Jobora AI Career Assistant
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
              Execute natural-language career tasks grounded strictly in your verified profile, live Remotive &amp; Arbeitnow job feeds, and tracked applications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/applications/prepare"
              className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
              <span>Application Preparation Copilot</span>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Chat Stream (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col gap-5">
            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap gap-2 pb-3 border-b border-outline-variant/20">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendPrompt(q)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-primary font-label-sm text-label-sm transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Container */}
            <div className="flex flex-col gap-5 max-h-[560px] overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 sm:p-5 rounded-2xl flex flex-col gap-3 transition-all ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary self-end max-w-2xl shadow-sm border border-primary/20'
                      : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 w-full shadow-xs'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between gap-4 pb-2 border-b border-current/10">
                    <span className="font-label-sm text-label-sm font-bold flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[14px] ${
                          m.role === 'user'
                            ? 'bg-on-primary/15 text-on-primary'
                            : 'bg-secondary-container text-on-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {m.role === 'user' ? 'person' : 'auto_awesome'}
                        </span>
                      </span>
                      <span>{m.role === 'user' ? profile.firstName || 'You' : 'Jobora AI Copilot'}</span>
                    </span>
                    <span className="font-caption-caps text-caption-caps opacity-70 font-mono">{m.timestamp}</span>
                  </div>

                  {/* Message Body */}
                  <div className="font-body-md text-body-md whitespace-pre-line leading-relaxed">
                    {m.content}
                  </div>

                  {/* Collapsible Tool Execution Logs */}
                  {m.toolLogs && m.toolLogs.length > 0 && (
                    <details className="group rounded-xl border border-outline-variant/30 bg-surface-container-low/50 overflow-hidden text-on-surface">
                      <summary className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none hover:bg-surface-container transition-colors list-none font-label-sm text-label-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
                          <span>
                            {m.toolLogs.length} Agent Step{m.toolLogs.length > 1 ? 's' : ''} Executed
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-caption-caps text-caption-caps">
                          <span className="group-open:hidden">Show telemetry</span>
                          <span className="hidden group-open:inline">Hide telemetry</span>
                          <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">
                            expand_more
                          </span>
                        </div>
                      </summary>
                      <div className="p-3 pt-1 border-t border-outline-variant/20 flex flex-col gap-2 bg-surface-container-lowest/60">
                        {m.toolLogs.map((log, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs p-2 rounded-lg bg-surface-container-low/40"
                          >
                            <span
                              className={`material-symbols-outlined text-[15px] mt-0.5 ${
                                log.status === 'requires_approval'
                                  ? 'text-amber-600'
                                  : 'text-tertiary'
                              }`}
                            >
                              {log.status === 'requires_approval' ? 'gpp_maybe' : 'check_circle'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <code className="font-mono font-bold text-primary">{log.tool}</code>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                    log.status === 'requires_approval'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-tertiary-fixed/40 text-on-tertiary-fixed'
                                  }`}
                                >
                                  {log.status === 'requires_approval' ? 'Awaiting Approval' : 'Completed'}
                                </span>
                              </div>
                              <p className="text-on-surface-variant mt-0.5 text-[12px]">{log.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* High-Visibility Human-in-the-Loop Approval Checkpoint */}
                  {m.approvalRequired && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">gpp_maybe</span>
                        </div>
                        <div>
                          <div className="font-label-md text-label-md font-bold text-amber-950 flex items-center gap-1.5">
                            <span>Human Approval Gate:</span>
                            <span className="underline decoration-amber-400">
                              {m.approvalRequired.targetLabel}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-amber-900/90 mt-0.5">
                            {m.approvalRequired.description}
                          </p>
                          <span className="font-caption-caps text-caption-caps text-amber-800 font-bold uppercase tracking-wider block mt-1">
                            Jobora Policy: No external submissions without explicit human authorization
                          </span>
                        </div>
                      </div>
                      <Link
                        href={m.approvalRequired.targetHref}
                        className="px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-label-sm text-label-sm font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5 self-end sm:self-center"
                      >
                        <span>Review &amp; Authorize</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  )}

                  {/* Suggested Next Actions */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider font-bold">
                        Suggested Actions
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {m.suggestedActions.map((act) => (
                          <Link
                            key={act.href + act.label}
                            href={act.href}
                            className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold border border-outline-variant/30 transition-all flex items-center gap-1.5"
                          >
                            <span>{act.label}</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 font-body-sm text-body-sm">
                {errorMsg}
              </div>
            )}

            {/* Chat Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Jobora AI to find jobs, explain matches, analyze your CV, or stage an application..."
                aria-label="Prompt Jobora AI Copilot"
                className="flex-1 bg-surface-container-low px-4 py-3 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-6 py-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span>{sending ? 'Running...' : 'Send'}</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>

          {/* Right Agent Permissions & Telemetry Sidebar (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-primary">Agent Guardrails</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-caption-caps text-caption-caps font-bold">
                  ENFORCED
                </span>
              </div>
              <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5">verified</span>
                  <span>Never fabricates skills, employers, degrees, or certifications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5">verified</span>
                  <span>Requires explicit user approval before opening external applications or sending emails.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5">verified</span>
                  <span>Treats job descriptions and uploaded documents as untrusted data.</span>
                </li>
              </ul>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <h2 className="font-headline-sm text-headline-sm text-primary">Workspace Telemetry</h2>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="font-caption-caps text-caption-caps text-on-surface-variant">Live Jobs</div>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">{jobs.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="font-caption-caps text-caption-caps text-on-surface-variant">Saved Roles</div>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">{savedJobIds.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="font-caption-caps text-caption-caps text-on-surface-variant">Tracked Apps</div>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">{applications.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="font-caption-caps text-caption-caps text-on-surface-variant">Verified Skills</div>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">{profile.skills.length}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </StitchShell>
  );
}
