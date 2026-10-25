'use client';

import React, { useState, useRef } from 'react';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

const INITIAL_PROMPTS = [
  {
    id: 'p-0',
    badge: 'Technical • High Priority',
    badgeStyle: 'badge-coral',
    statusBadge: '92/100',
    statusStyle: 'badge-emerald',
    statusIcon: 'check_circle',
    title: 'Explain how you optimized latency in your Multi-Agent RAG pipeline.',
    subtitle: 'Focus on vector retrieval caching, parallelized rerankers, and async LLM stream orchestration.',
    footerIcon: 'timer',
    footerLeft: '3m 42s recorded',
    defaultText: `In our Multi-Agent RAG architecture for customer support synthesis, we faced a major bottleneck where average end-to-end response times averaged 3.2 seconds. I began by instrumenting OpenTelemetry tracing across the retrieval lifecycle and discovered that 68% of latency stemmed from serial execution between the query-rewriting agent and the vector re-ranking model.\n\nTo solve this, I decoupled the query expansion agent into parallel speculative pipelines using Python's asyncio and LangGraph async primitives. Concurrently, we migrated from brute-force cosine distance to a quantized HNSW index using pgvector with an in-memory Redis semantic cache that cached high-frequency vector embeddings.\n\nFinally, we swapped the synchronous Cross-Encoder reranker with an optimized ONNX-runtime ColBERT model running on AWS SageMaker asynchronous endpoints with automatic scale-down. As a result, our P99 dropped from 3,200ms to 680ms, maintaining a 94.2% MRR (Mean Reciprocal Rank) while decreasing our per-query inference compute cost by 38%.`,
  },
  {
    id: 'p-1',
    badge: 'Behavioral • STAR Method',
    badgeStyle: 'badge-neutral',
    statusBadge: 'Pending',
    statusStyle: 'badge-neutral',
    statusIcon: '',
    title: 'Tell me about a time you resolved conflicting requirements between latency and accuracy.',
    subtitle: 'Amazon LP: Customer Obsession & Bias for Action. Emphasize stakeholder trade-off matrix.',
    footerIcon: 'mic_off',
    footerLeft: 'Unrecorded',
    defaultText: `Situation: During a recommendation engine revamp, our product team mandated a 50ms P99 constraint, while data science insisted on an ensemble model that required 180ms compute.\n\nTask: I was charged with finding a compromise architecture that preserved at least 95% of the ensemble's precision without breaking the strict SLA.\n\nAction: I led a fast proof-of-concept deploying a dual-stage cascading classifier. Stage 1 used an ultralight heuristic model to resolve 75% of clear-cut queries in under 12ms. Stage 2 routed only uncertain predictions to the dense neural net with early-exit pruning.\n\nResult: We achieved an overall P99 of 42ms with an NDCG drop of only 0.4%, satisfying both teams and unlocking product launch.`,
  },
  {
    id: 'p-2',
    badge: 'System Design • Cloud',
    badgeStyle: 'badge-neutral',
    statusBadge: 'Drafting',
    statusStyle: 'badge-coral',
    statusIcon: '',
    title: 'How would you scale inference for LLM embeddings on AWS SageMaker with cost constraints?',
    subtitle: 'Serverless endpoints vs. spot instance fleets, model quantization (AWQ/GPTQ), and batch queueing.',
    footerIcon: 'edit_note',
    footerLeft: 'Notes in progress',
    defaultText: `Drafting notes:\n1. Choose AWS Inferentia2 or G5 instances depending on batch concurrency and FP16 vs INT8 quantization.\n2. Employ SageMaker Multi-Model Endpoints (MME) to consolidate rarely invoked embedding models onto shared memory.\n3. Implement Auto-Scaling based on SageMaker InvocationsPerInstance with proactive cooling down to avoid idle compute billing.`,
  },
];

export default function InterviewPrepPage() {
  const { selectedJob, jobs, setSelectedJob, logActivity } = useAppData();

  const activeJob = selectedJob || jobs[0] || {
    id: 'job-amazon',
    title: 'AI Engineering Intern',
    company: 'Amazon MENA',
  };

  const [prompts, setPrompts] = useState(INITIAL_PROMPTS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'questions' | 'practice' | 'rubric' | 'history'>('questions');
  const [frameworkOpen, setFrameworkOpen] = useState(true);
  const [answerText, setAnswerText] = useState(INITIAL_PROMPTS[0].defaultText);
  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [overallScore, setOverallScore] = useState(92);
  const [techScore, setTechScore] = useState(9.4);
  const [pacingScore, setPacingScore] = useState(8.8);
  const [starScore, setStarScore] = useState(9.0);
  const [personaIdx, setPersonaIdx] = useState(0);
  const [filterCategory, setFilterCategory] = useState<'all' | 'Technical' | 'Behavioral' | 'System'>('all');
  const [savedPromptIds, setSavedPromptIds] = useState<string[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const evalRef = useRef<HTMLDivElement | null>(null);

  const personas = [
    {
      name: 'Dr. Aris Thorne',
      role: 'Bar Raiser & Staff AI Architect',
      quote: '“I look for engineering tradeoffs. Don’t just state what you did; justify why you discarded alternative architectures.”',
    },
    {
      name: 'Nadia Al-Mansoori',
      role: 'VP of Engineering, MENA Cloud',
      quote: '“Quantify every architectural decision in terms of P99 latency, SLA reliability, and unit compute cost.”',
    },
  ];

  const currentPrompt = prompts[selectedIdx] || prompts[0];
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const charCount = answerText.length;

  const handleSelectPrompt = (idx: number) => {
    setSelectedIdx(idx);
    setAnswerText(prompts[idx].defaultText);
  };

  const handleCycleFilter = () => {
    const order: Array<'all' | 'Technical' | 'Behavioral' | 'System'> = ['all', 'Technical', 'Behavioral', 'System'];
    const next = order[(order.indexOf(filterCategory) + 1) % order.length];
    setFilterCategory(next);
    setStatusNotice(next === 'all' ? 'Showing all interview prompt categories' : `Filtered prompts: ${next}`);
  };

  const handleToggleSavePrompt = () => {
    const id = currentPrompt.id;
    setSavedPromptIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      setStatusNotice(exists ? 'Removed prompt from saved focus list' : 'Saved prompt to your interview focus list');
      return next;
    });
  };

  const handleSaveDraft = () => {
    setPrompts((prev) =>
      prev.map((p, idx) =>
        idx === selectedIdx ? { ...p, defaultText: answerText, statusBadge: 'Draft Saved' } : p
      )
    );
    try {
      const saved = JSON.parse(localStorage.getItem('jobora_interview_sessions') || '[]');
      saved.unshift({
        id: `sess-${Date.now()}`,
        promptId: currentPrompt.id,
        title: currentPrompt.title,
        company: activeJob.company,
        answerText,
        score: overallScore,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem('jobora_interview_sessions', JSON.stringify(saved.slice(0, 20)));
    } catch {}
    logActivity('bookmark_added', `Saved interview response draft`, currentPrompt.title);
    setStatusNotice('Response draft saved to session history.');
  };

  const handleGenerateCustomQuestion = () => {
    const newPrompt = {
      id: `p-${Date.now()}`,
      badge: `${activeJob.company} • Custom AI`,
      badgeStyle: 'bg-secondary-fixed text-on-secondary-fixed',
      statusBadge: 'New',
      statusStyle: 'text-secondary bg-secondary-fixed/50',
      statusIcon: '',
      title: `How would you architect a fault-tolerant microservice for ${activeJob.title} at ${activeJob.company}?`,
      subtitle: 'Tailored to live job requirements: high availability, observability, and graceful degradation.',
      footerIcon: 'auto_awesome',
      footerLeft: 'Generated just now',
      defaultText: `Situation: At ${activeJob.company}, high-concurrency workloads require strict SLA guarantees.\n\nTask: Design a resilient inference & API layer.\n\nAction: Implemented circuit breakers, semantic caching, and horizontal pod autoscaling.\n\nResult: Achieved 99.99% uptime and 45% lower tail latency.`,
    };
    setPrompts((prev) => [...prev, newPrompt]);
    setSelectedIdx(prompts.length);
    setAnswerText(newPrompt.defaultText);
    logActivity('psychology', `Generated interview prompt for ${activeJob.company}`, newPrompt.title);
  };

  const handleReadAloud = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPrompt.title);
      window.speechSynthesis.speak(utterance);
      setStatusNotice('Reading question aloud via browser speech synthesis...');
    } else {
      setStatusNotice('Browser Speech Synthesis is unavailable in this environment.');
    }
  };

  const handleListenBack = () => {
    if (!answerText.trim()) {
      setStatusNotice('Please enter a response before playing audio.');
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(answerText);
      window.speechSynthesis.speak(utterance);
      setStatusNotice('Playing back your response via browser speech synthesis...');
    } else {
      setStatusNotice('Browser Speech Synthesis is unavailable in this environment.');
    }
  };

  const handleRunEvaluation = () => {
    setEvaluating(true);
    setTimeout(() => {
      const hasMetrics = /\d+%|\d+ms|\d+x/i.test(answerText);
      const lengthBonus = Math.min(12, Math.floor(wordCount / 20));
      const computed = Math.min(98, Math.max(68, 76 + lengthBonus + (hasMetrics ? 8 : 0)));
      setOverallScore(computed);
      setTechScore(Number((computed / 10 + 0.2).toFixed(1)));
      setPacingScore(Number((computed / 10 - 0.3).toFixed(1)));
      setStarScore(Number((computed / 10).toFixed(1)));
      setEvaluating(false);
      setStatusNotice(`Heuristic STAR rubric evaluation complete: ${computed}/100`);
      logActivity('neurology', `Completed AI Interview Evaluation (${computed}/100)`, currentPrompt.title);
      evalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 650);
  };

  return (
    <StitchShell activeNav="interview-prep">
      <div className="flex flex-col w-full">
        {/* Ambient Atmospheric Backing Elements */}
        <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
          <div className="pointer-events-none absolute -top-12 right-12 w-96 h-96 bg-gradient-to-br from-secondary/15 via-surface-tint/10 to-transparent rounded-full blur-3xl -z-10"></div>
          <div className="pointer-events-none absolute top-96 left-4 w-80 h-80 bg-gradient-to-tr from-tertiary-fixed/20 to-transparent rounded-full blur-2xl -z-10"></div>

          {/* Workspace Header Block */}
          {/* Workspace Header Block */}
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="badge-coral">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E76F72] animate-pulse"></span>
                  Simulated Assessment v2.4
                </span>
                <span className="text-[#63555F] font-label-sm text-label-sm">
                  · {prompts.length} of 8 Modules Prepared
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#351B32] tracking-tight font-bold">
                Practice for Your Interview
              </h1>
              <p className="font-body-md text-body-md text-[#63555F] max-w-2xl">
                Calibrate your executive presence, system architecture vocabulary, and structured responses using
                Jobora’s adaptive interviewer.
              </p>
            </div>

            {/* Target Selection Dropdown Card */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative group bg-white border border-[#EDE5E1] p-2.5 pl-4 pr-3 rounded-2xl shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-[#E76F72]/50 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-center text-[#351B32] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="font-caption-caps text-caption-caps text-[#63555F] uppercase tracking-wider">
                      Target Track
                    </span>
                    {jobs.length > 0 ? (
                      <select
                        value={activeJob.id}
                        onChange={(e) => {
                          const found = jobs.find((j) => j.id === e.target.value);
                          if (found) setSelectedJob(found);
                        }}
                        className="font-label-md text-label-md text-[#351B32] font-bold bg-transparent focus:outline-none cursor-pointer truncate max-w-[240px]"
                      >
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.company} — {j.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-label-md text-label-md text-[#351B32] font-bold truncate">
                        {activeJob.company} — {activeJob.title}
                      </span>
                    )}
                    <span className="font-label-sm text-label-sm text-[#E76F72] font-semibold truncate">
                      Round 1: Coding &amp; Systems Architecture
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#63555F] text-[20px] group-hover:translate-y-0.5 transition-transform">
                  unfold_more
                </span>
              </div>
              <button
                onClick={() => {
                  setIsRecording(true);
                  setActiveTab('practice');
                }}
                className="btn-editorial-coral shrink-0 focus-ring"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Start Live Mock</span>
              </button>
            </div>
          </header>

          {/* Navigation Segmented Tabs */}
          <div className="flex items-center justify-between border-b-0 pb-1 overflow-x-auto scrollbar-none">
            <div className="flex items-center p-1 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] gap-1">
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md font-semibold transition-all focus-ring ${
                  activeTab === 'questions'
                    ? 'bg-white text-[#351B32] shadow-xs font-bold border border-[#EDE5E1]'
                    : 'text-[#63555F] hover:text-[#351B32]'
                }`}
                type="button"
              >
                Overview &amp; Questions
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 focus-ring ${
                  activeTab === 'practice'
                    ? 'bg-white text-[#351B32] shadow-xs font-bold border border-[#EDE5E1]'
                    : 'text-[#63555F] hover:text-[#351B32]'
                }`}
                type="button"
              >
                <span>Practice Mode</span>
                <span className="w-2 h-2 rounded-full bg-[#E76F72]"></span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('rubric');
                  evalRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md font-semibold transition-all focus-ring ${
                  activeTab === 'rubric'
                    ? 'bg-white text-[#351B32] shadow-xs font-bold border border-[#EDE5E1]'
                    : 'text-[#63555F] hover:text-[#351B32]'
                }`}
                type="button"
              >
                AI Feedback &amp; Rubric
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md font-semibold transition-all focus-ring ${
                  activeTab === 'history'
                    ? 'bg-white text-[#351B32] shadow-xs font-bold border border-[#EDE5E1]'
                    : 'text-[#63555F] hover:text-[#351B32]'
                }`}
                type="button"
              >
                Session History
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[#63555F] font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[18px] text-[#268566]">verified</span>
              <span>Auto-syncing audio &amp; text transcripts</span>
            </div>
          </div>

          {/* Main Workspace Grid: 12 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Question Navigator (4 Cols) */}
            <aside className="lg:col-span-4 flex flex-col gap-4">
              <div className="editorial-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-[#351B32] font-bold">Interview Prompts</span>
                    <span className="badge-neutral">
                      {prompts.length} Focus Items
                    </span>
                  </div>
                  <button
                    onClick={handleCycleFilter}
                    className="p-1.5 rounded-lg text-[#63555F] hover:bg-[#FAF6F2] hover:text-[#351B32] transition-colors flex items-center gap-1 focus-ring"
                    title={`Filter Prompts (${filterCategory})`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    {filterCategory !== 'all' && (
                      <span className="font-caption-caps text-caption-caps text-[#E76F72] font-bold">
                        {filterCategory}
                      </span>
                    )}
                  </button>
                </div>

                {prompts
                  .map((p, idx) => ({ p, idx }))
                  .filter(({ p }) => filterCategory === 'all' || p.badge.includes(filterCategory))
                  .map(({ p, idx }) => {
                  const isSelected = idx === selectedIdx;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPrompt(idx)}
                      className={`p-4 rounded-xl cursor-pointer transition-all relative group border ${
                        isSelected
                          ? 'bg-[#FAF6F2] border-[#E76F72] shadow-xs'
                          : 'bg-white border-[#EDE5E1] hover:border-[#E76F72]/40 hover:bg-[#FAF6F2]/50'
                      }`}
                    >
                      {isSelected && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#E76F72] rounded-r-full"></div>}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-caption-caps text-caption-caps font-bold uppercase ${p.badgeStyle}`}
                        >
                          {p.badge}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2.5 py-0.5 rounded-full ${p.statusStyle}`}
                        >
                          {p.statusIcon ? (
                            <span className="material-symbols-outlined text-[14px]">{p.statusIcon}</span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          )}
                          {idx === 0 ? `${overallScore}/100` : p.statusBadge}
                        </span>
                      </div>
                      <h4 className="font-label-md text-label-md text-[#351B32] font-bold mb-1.5 leading-snug">
                        {p.title}
                      </h4>
                      <p className="font-body-sm text-body-sm text-[#63555F] line-clamp-2 mb-3">
                        {p.subtitle}
                      </p>
                      <div className="flex items-center justify-between text-[#63555F] font-caption-caps text-caption-caps pt-2 border-t border-[#EDE5E1]/60">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">{p.footerIcon}</span> {p.footerLeft}
                        </span>
                        <span
                          className={
                            isSelected
                              ? 'text-[#E76F72] font-bold group-hover:translate-x-0.5 transition-transform'
                              : 'font-semibold text-[#351B32]'
                          }
                        >
                          {isSelected ? 'Active In Editor →' : 'Select to Practice'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Custom AI Prompt Generator CTA */}
                <div className="p-3.5 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#E76F72] text-[22px]">auto_awesome</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-[#351B32] font-bold">
                        Generate Custom Question
                      </span>
                      <span className="font-caption-caps text-caption-caps text-[#63555F]">
                        Tailored to {activeJob.company} job description
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateCustomQuestion}
                    className="w-8 h-8 rounded-lg bg-white border border-[#EDE5E1] flex items-center justify-center text-[#351B32] hover:bg-[#351B32] hover:text-white transition-colors shadow-xs focus-ring"
                    type="button"
                    aria-label="Generate custom question"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              {/* Mentorship & Interviewer Readiness Widget */}
              <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">
                    Interviewer Personas
                  </span>
                  <button
                    onClick={() => setPersonaIdx((personaIdx + 1) % personas.length)}
                    className="font-label-sm text-label-sm text-secondary font-semibold hover:underline"
                    type="button"
                  >
                    Switch Persona
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    alt={personas[personaIdx].name}
                    className="w-11 h-11 rounded-full object-cover shadow-sm"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuaRZ4qLahpdUt8aROV2jk_fDkhO9OXrRdflfNjWVt1xpaFGTiINdOekQk1E3lb3G-vBIu3xwz5113RMbglF2R1mLkOI7PbOcs0nWi5YGqccbi0dJNTNM0eK8Z5QTRWHuhek9DXF8BsRmI90Vcw6q1zPkuqlKe1A7pKOJ4A9vgi4b-_9bTGKn0DlbamBGWav-LEX0wRvR-dOt2MCI9Wk9oghVu9MDzD20oCJDSkSzS6fZqizw5cVNk"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md text-primary font-bold truncate">
                      {personas[personaIdx].name}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {personas[personaIdx].role}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm italic">
                  {personas[personaIdx].quote}
                </div>
              </div>
            </aside>

            {/* Right Column: Interactive Practice Arena & AI Evaluation (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {statusNotice && (
                <div className="px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-label-sm font-label-sm text-primary">
                  <span>{statusNotice}</span>
                  <button
                    type="button"
                    onClick={() => setStatusNotice(null)}
                    className="text-on-surface-variant hover:text-primary"
                  >
                    ✕
                  </button>
                </div>
              )}
              {/* Question Focal Arena */}
              <div className="editorial-card p-6 sm:p-7 flex flex-col gap-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E76F72]"></span>
                    <span className="font-caption-caps text-caption-caps text-[#E76F72] font-bold uppercase tracking-wider">
                      Active Evaluation Question
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReadAloud}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF6F2] border border-[#EDE5E1] font-label-sm text-label-sm text-[#351B32] hover:bg-white transition-colors flex items-center gap-1.5 focus-ring"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">volume_up</span> Read Aloud
                    </button>
                    <button
                      onClick={handleToggleSavePrompt}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF6F2] border border-[#EDE5E1] font-label-sm text-label-sm text-[#351B32] hover:bg-white transition-colors flex items-center gap-1.5 focus-ring"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#E76F72]">
                        {savedPromptIds.includes(currentPrompt.id) ? 'bookmark' : 'bookmark_border'}
                      </span>{' '}
                      {savedPromptIds.includes(currentPrompt.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="font-serif text-2xl text-[#351B32] font-bold leading-tight">
                    {currentPrompt.title}
                  </h2>
                  <p className="font-body-md text-body-md text-[#63555F]">
                    The interviewer wants to see both algorithmic reasoning and systems profiling (e.g., embedding
                    lookups, token streaming overhead, vector DB indices like HNSW vs. IVFFlat).
                  </p>
                </div>

                {/* Interviewer Rubric Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="badge-neutral">
                    <span className="material-symbols-outlined text-[15px] text-[#E76F72]">radar</span> Target: P99 &lt;
                    850ms
                  </span>
                  <span className="badge-neutral">
                    <span className="material-symbols-outlined text-[15px] text-[#268566]">tune</span> Hybrid
                    Search + RRF
                  </span>
                  <span className="badge-neutral">
                    <span className="material-symbols-outlined text-[15px] text-[#63555F]">schema</span> Async LangGraph
                    Execution
                  </span>
                </div>

                {/* STAR Helper Accordion Tray */}
                <div className="p-4 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex flex-col gap-3">
                  <div
                    onClick={() => setFrameworkOpen(!frameworkOpen)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#E76F72] text-[20px]">psychology</span>
                      <span className="font-label-md text-label-md text-[#351B32] font-bold">
                        Recommended Framework: STAR + Quantified Impact
                      </span>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[#63555F] text-[20px] transition-transform ${
                        frameworkOpen ? '' : 'rotate-180'
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                  {frameworkOpen && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-white border border-[#EDE5E1] flex flex-col gap-0.5">
                        <span className="font-caption-caps text-caption-caps text-[#E76F72] font-bold">
                          Situation (15%)
                        </span>
                        <span className="font-body-sm text-body-sm text-[#63555F]">
                          Pipeline P99 spiking to 3.2s on high-concurrency requests.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-[#EDE5E1] flex flex-col gap-0.5">
                        <span className="font-caption-caps text-caption-caps text-[#E76F72] font-bold">Task (10%)</span>
                        <span className="font-body-sm text-body-sm text-[#63555F]">
                          Slash latency sub-second without degrading recall score.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-[#EDE5E1] flex flex-col gap-0.5">
                        <span className="font-caption-caps text-caption-caps text-[#E76F72] font-bold">
                          Action (55%)
                        </span>
                        <span className="font-body-sm text-body-sm text-[#63555F]">
                          Added Redis vector cache, quantization &amp; speculative streaming.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-[#EDE5E1] flex flex-col gap-0.5">
                        <span className="font-caption-caps text-caption-caps text-[#E76F72] font-bold">
                          Result (20%)
                        </span>
                        <span className="font-body-sm text-body-sm text-[#63555F]">
                          4.1x throughput boost; latency dropped to 680ms at 99th percentile.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Speech & Text Arena */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-[#351B32] font-bold">Your Response</span>
                      {isRecording && (
                        <span className="badge-coral">
                          <span className="w-2 h-2 rounded-full bg-[#E76F72] animate-ping"></span> Recording Audio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-caption-caps text-caption-caps text-[#63555F]">
                        {wordCount} Words · {charCount.toLocaleString()} Characters
                      </span>
                      <button
                        onClick={() => setAnswerText('')}
                        className="text-[#63555F] hover:text-[#351B32] transition-colors text-label-sm font-label-sm flex items-center gap-1 focus-ring"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">clear_all</span> Reset
                      </button>
                    </div>
                  </div>

                  {/* Answer Textarea Container */}
                  <div className="relative rounded-xl bg-white border border-[#EDE5E1] focus-within:ring-2 focus-within:ring-[#E76F72]/30 focus-within:border-[#E76F72] transition-all shadow-2xs">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="w-full bg-transparent p-4 font-body-md text-body-md text-[#1D1A21] placeholder-[#63555F]/60 focus:outline-none resize-y leading-relaxed"
                      placeholder="Type your structured technical answer or click Record Voice to practice vocal cadence..."
                      rows={7}
                    />
                  </div>

                  {/* Response Control Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`btn-editorial-secondary focus-ring ${
                          isRecording
                            ? '!bg-[#E76F72] !text-white !border-[#E76F72]'
                            : ''
                        }`}
                        type="button"
                      >
                        <span className={`material-symbols-outlined text-[20px] ${isRecording ? 'text-white animate-pulse' : 'text-[#E76F72]'}`}>mic</span>
                        <span>{isRecording ? 'Stop Recording' : 'Record Voice'}</span>
                      </button>
                      <button
                        onClick={handleListenBack}
                        className="btn-editorial-secondary focus-ring"
                        title="Generate audio playback of response"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px] text-[#351B32]">play_circle</span>
                        <span>Listen Back</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveDraft}
                        className="btn-editorial-secondary focus-ring"
                        type="button"
                      >
                        Save Draft
                      </button>
                      <button
                        disabled={evaluating}
                        onClick={handleRunEvaluation}
                        className="btn-editorial-primary focus-ring"
                        type="button"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${evaluating ? 'animate-spin' : ''}`}>
                          {evaluating ? 'refresh' : 'neurology'}
                        </span>
                        <span>{evaluating ? 'Evaluating...' : 'Run AI Evaluation'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Evaluation & Rubric Breakdown Panel */}
              <div
                ref={evalRef}
                className="editorial-card p-6 sm:p-7 flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-center text-[#E76F72]">
                      <span className="material-symbols-outlined text-[28px]">insights</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl text-[#351B32] font-bold">
                          AI Assessment Score
                        </span>
                        <span className="badge-emerald">
                          Top 8% Candidate Tier
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-[#63555F]">
                        Calibrated against Senior Machine Learning Interview Benchmarks
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-[#FAF6F2] border border-[#EDE5E1] px-4 py-2 rounded-xl self-start sm:self-auto">
                    <span className="font-serif text-3xl font-bold text-[#351B32] leading-none">
                      {overallScore}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-caption-caps text-caption-caps uppercase text-[#63555F]">
                        Overall
                      </span>
                      <span className="font-label-sm text-label-sm text-[#E76F72] font-bold">/ 100 PTS</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Progress Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#351B32] font-bold">Technical Depth</span>
                      <span className="font-label-md text-label-md text-[#351B32] font-bold">{techScore} / 10</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#268566] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, techScore * 10)}%` }}
                      ></div>
                    </div>
                    <p className="font-caption-caps text-caption-caps text-[#63555F]">
                      Identified HNSW quantization and OpenTelemetry metrics.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#351B32] font-bold">
                        Conciseness &amp; Pacing
                      </span>
                      <span className="font-label-md text-label-md text-[#351B32] font-bold">{pacingScore} / 10</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E76F72] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, pacingScore * 10)}%` }}
                      ></div>
                    </div>
                    <p className="font-caption-caps text-caption-caps text-[#63555F]">
                      154 wpm delivered. High information density without filler.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-[#351B32] font-bold">STAR Adherence</span>
                      <span className="font-label-md text-label-md text-[#351B32] font-bold">{starScore} / 10</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#268566] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, starScore * 10)}%` }}
                      ></div>
                    </div>
                    <p className="font-caption-caps text-caption-caps text-[#63555F]">
                      Direct quantifiable outcome (4.1x boost, 38% AWS savings).
                    </p>
                  </div>
                </div>

                {/* Strong Points Identified vs. Recommendations Bento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#268566]">
                        check_circle
                      </span>
                      <span className="font-label-md text-label-md text-[#351B32] font-bold">
                        Strong Points Identified
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                        <span className="badge-emerald shrink-0 mt-0.5">
                          Quantified Metrics
                        </span>
                        <p className="font-body-sm text-body-sm text-[#1D1A21]">
                          Specified concrete percentiles (
                          <strong className="font-semibold text-[#351B32]">P99 dropped 3,200ms → 680ms</strong>) rather
                          than vague speedups.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                        <span className="badge-emerald shrink-0 mt-0.5">
                          Systems Architecture
                        </span>
                        <p className="font-body-sm text-body-sm text-[#1D1A21]">
                          Explicitly addressed distributed cache invalidation strategies and ONNX runtime optimizations.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                        <span className="badge-emerald shrink-0 mt-0.5">
                          Cost Consciousness
                        </span>
                        <p className="font-body-sm text-body-sm text-[#1D1A21]">
                          Emphasized cloud fiscal responsibility (
                          <strong className="font-semibold text-[#351B32]">38% inference reduction</strong>), heavily
                          aligning with leadership principles.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#E76F72]">tips_and_updates</span>
                      <span className="font-label-md text-label-md text-[#351B32] font-bold">
                        Recommended Improvements
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <div className="p-3.5 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex items-start gap-3">
                        <span className="badge-coral shrink-0 mt-0.5">
                          Failover Handling
                        </span>
                        <p className="font-body-sm text-body-sm text-[#1D1A21]">
                          Clarify cache misses: What is your fallback SLA if the Redis semantic cache cluster becomes
                          unavailable during a traffic surge?
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex items-start gap-3">
                        <span className="badge-coral shrink-0 mt-0.5">
                          Model Drift
                        </span>
                        <p className="font-body-sm text-body-sm text-[#1D1A21]">
                          Mention how you continuously evaluate embedding alignment when retraining or tuning vector
                          databases.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex items-start gap-3">
                        <span className="badge-coral shrink-0 mt-0.5">
                          Delivery Note
                        </span>
                        <p className="font-body-sm text-body-sm text-[#1D1A21]">
                          Pause for 1-2 seconds between the technical root cause and your implementation step to let the
                          interviewer absorb your schema.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Practice History Timeline & Progress Trend Chart */}
              <div className="editorial-card p-6 sm:p-7 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-caption-caps text-caption-caps text-[#63555F] uppercase tracking-wider">
                      Historical Progress
                    </span>
                    <h3 className="font-serif text-2xl text-[#351B32] font-bold">Simulated Attempt Trajectory</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-coral">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E76F72]"></span> Actual Score
                    </span>
                    <span className="badge-emerald">
                      <span className="w-2.5 h-1 bg-[#268566]"></span> Target Benchmark (85)
                    </span>
                  </div>
                </div>

                {/* Trend Chart Visual */}
                <div className="relative w-full h-44 bg-[#FAF6F2] border border-[#EDE5E1] rounded-xl p-4 flex flex-col justify-end overflow-hidden">
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-40">
                    <div className="w-full border-b border-dashed border-[#EDE5E1] text-[10px] text-[#63555F] font-caption-caps">
                      100 PTS
                    </div>
                    <div className="w-full border-b border-dashed border-[#EDE5E1] text-[10px] text-[#63555F] font-caption-caps">
                      85 BENCHMARK
                    </div>
                    <div className="w-full border-b border-dashed border-[#EDE5E1] text-[10px] text-[#63555F] font-caption-caps">
                      70 THRESHOLD
                    </div>
                    <div className="w-full border-b border-dashed border-[#EDE5E1] text-[10px] text-[#63555F] font-caption-caps">
                      50 BASELINE
                    </div>
                  </div>
                  <svg className="w-full h-28 overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 600 120">
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#E76F72" stopOpacity="0.25"></stop>
                        <stop offset="100%" stopColor="#E76F72" stopOpacity="0.0"></stop>
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,95 Q 100,82 150,75 T 300,50 T 450,30 T 600,14 L 600,120 L 0,120 Z"
                      fill="url(#scoreGrad)"
                    ></path>
                    <path
                      d="M 0,95 Q 100,82 150,75 T 300,50 T 450,30 T 600,14"
                      fill="none"
                      stroke="#E76F72"
                      strokeLinecap="round"
                      strokeWidth="3"
                    ></path>
                    <circle cx="0" cy="95" fill="#351B32" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="150" cy="75" fill="#351B32" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="300" cy="50" fill="#351B32" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="450" cy="30" fill="#351B32" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle cx="600" cy="14" fill="#E76F72" r="5.5" stroke="#ffffff" strokeWidth="2"></circle>
                  </svg>
                  <div className="flex items-center justify-between text-on-surface-variant font-caption-caps text-caption-caps pt-2 z-10">
                    <span>Attempt 1 (64)</span>
                    <span>Attempt 2 (72)</span>
                    <span>Attempt 3 (80)</span>
                    <span>Attempt 4 (86)</span>
                    <span className="font-bold text-secondary">Today • Attempt 5 ({overallScore})</span>
                  </div>
                </div>

                {/* Chronological History Log */}
                <div className="flex flex-col gap-3">
                  <span className="font-caption-caps text-caption-caps text-[#63555F] uppercase tracking-wider font-semibold">
                    Detailed Past Attempts
                  </span>
                  <div
                    onClick={() => handleSelectPrompt(0)}
                    className="p-3.5 rounded-xl bg-white border border-[#EDE5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#E76F72]/50 hover:bg-[#FAF6F2]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-center text-[#E76F72] shrink-0">
                        <span className="material-symbols-outlined text-[18px]">mic</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-[#351B32] font-bold">
                          Attempt #5: Latency Optimization (Multi-Agent RAG)
                        </span>
                        <span className="font-caption-caps text-caption-caps text-[#63555F]">
                          Today, 11:24 AM · Audio + Transcript · 3m 42s
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span className="font-headline-sm text-headline-sm text-[#E76F72] font-bold">
                        {overallScore}/100
                      </span>
                      <span className="material-symbols-outlined text-[20px] text-[#63555F]">
                        chevron_right
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => handleSelectPrompt(2)}
                    className="p-3.5 rounded-xl bg-white border border-[#EDE5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#E76F72]/50 hover:bg-[#FAF6F2]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-center text-[#351B32] shrink-0">
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-[#351B32] font-bold">
                          Attempt #4: AWS SageMaker Cost vs. Scale
                        </span>
                        <span className="font-caption-caps text-caption-caps text-[#63555F]">
                          Yesterday, 4:15 PM · Text Response · 410 words
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span className="font-headline-sm text-headline-sm text-[#351B32] font-bold">86/100</span>
                      <span className="material-symbols-outlined text-[20px] text-[#63555F]">
                        chevron_right
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => handleSelectPrompt(1)}
                    className="p-3.5 rounded-xl bg-white border border-[#EDE5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#E76F72]/50 hover:bg-[#FAF6F2]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-center text-[#351B32] shrink-0">
                        <span className="material-symbols-outlined text-[18px]">mic</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-[#351B32] font-bold">
                          Attempt #3: Conflicting Latency &amp; Accuracy Requirements
                        </span>
                        <span className="font-caption-caps text-caption-caps text-[#63555F]">
                          Oct 24, 2:30 PM · Audio · 4m 12s
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span className="font-headline-sm text-headline-sm text-[#63555F] font-bold">80/100</span>
                      <span className="material-symbols-outlined text-[20px] text-[#63555F]">
                        chevron_right
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StitchShell>
  );
}
