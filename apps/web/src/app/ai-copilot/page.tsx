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
            <div className="flex flex-col gap-4 max-h-[540px] overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl flex flex-col gap-3 ${
                    m.role === 'user'
                      ? 'bg-primary-container text-on-primary self-end max-w-xl'
                      : 'bg-surface-container-low text-on-surface w-full'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-label-sm text-label-sm font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        {m.role === 'user' ? 'person' : 'auto_awesome'}
                      </span>
                      {m.role === 'user' ? profile.firstName || 'You' : 'Jobora AI Copilot'}
                    </span>
                    <span className="font-caption-caps text-caption-caps opacity-75">{m.timestamp}</span>
                  </div>

                  <div className="font-body-md text-body-md whitespace-pre-line leading-relaxed">
                    {m.content}
                  </div>

                  {m.toolLogs && m.toolLogs.length > 0 && (
                    <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-1.5">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-bold">
                        Authorized Agent Tool Activity
                      </span>
                      {m.toolLogs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-on-surface">
                          <span className="material-symbols-outlined text-[15px] text-emerald-600 mt-0.5">
                            {log.status === 'requires_approval' ? 'gpp_maybe' : 'check_circle'}
                          </span>
                          <div>
                            <code className="font-mono font-bold text-primary">{log.tool}</code>:{' '}
                            <span className="text-on-surface-variant">{log.summary}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.approvalRequired && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-label-md text-label-md font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          Explicit Approval Required: {m.approvalRequired.targetLabel}
                        </div>
                        <p className="font-body-sm text-body-sm mt-0.5">
                          {m.approvalRequired.description}
                        </p>
                      </div>
                      <Link
                        href={m.approvalRequired.targetHref}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm font-bold whitespace-nowrap"
                      >
                        Review &amp; Approve →
                      </Link>
                    </div>
                  )}

                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.suggestedActions.map((act) => (
                        <Link
                          key={act.href + act.label}
                          href={act.href}
                          className="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <span>{act.label}</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      ))}
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
