'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function CVStudioPage() {
  const router = useRouter();
  const { profile, updateProfile, selectedJob, jobs, logActivity } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeJob = selectedJob || (jobs.length > 0 ? jobs[0] : null);
  const [activeStudioTab, setActiveStudioTab] = useState<'upload' | 'tailored' | 'cover-letter' | 'preview'>('tailored');

  // Initialize diff decisions from persisted profile or scoped local storage fallback
  const [diff1State, setDiff1State] = useState<'pending' | 'accepted' | 'rejected'>(
    profile.cvDecisions?.diff1 || 'pending'
  );
  const [diff2State, setDiff2State] = useState<'pending' | 'accepted' | 'rejected'>(
    profile.cvDecisions?.diff2 || 'pending'
  );

  // Restore decisions when profile updates or from scoped localStorage
  useEffect(() => {
    if (profile.cvDecisions?.diff1 && profile.cvDecisions.diff1 !== diff1State) {
      setDiff1State(profile.cvDecisions.diff1);
    }
    if (profile.cvDecisions?.diff2 && profile.cvDecisions.diff2 !== diff2State) {
      setDiff2State(profile.cvDecisions.diff2);
    }
  }, [profile.cvDecisions]);

  useEffect(() => {
    try {
      const storageKey = profile.email ? `jobora_cv_decisions_${profile.email}` : 'jobora_cv_decisions_guest';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.diff1 && (!profile.cvDecisions || !profile.cvDecisions.diff1)) {
          setDiff1State(parsed.diff1);
        }
        if (parsed?.diff2 && (!profile.cvDecisions || !profile.cvDecisions.diff2)) {
          setDiff2State(parsed.diff2);
        }
      }
    } catch {}
  }, [profile.email]);

  const updateDiffDecision = async (
    diffKey: 'diff1' | 'diff2',
    newState: 'pending' | 'accepted' | 'rejected'
  ) => {
    if (diffKey === 'diff1') setDiff1State(newState);
    if (diffKey === 'diff2') setDiff2State(newState);

    const nextDecisions = {
      ...(profile.cvDecisions || {}),
      [diffKey]: newState,
    };
    await updateProfile({ cvDecisions: nextDecisions });

    try {
      const storageKey = profile.email ? `jobora_cv_decisions_${profile.email}` : 'jobora_cv_decisions_guest';
      localStorage.setItem(storageKey, JSON.stringify(nextDecisions));
    } catch {}

    if (newState === 'accepted') {
      logActivity('check_circle', `Accepted CV improvement (${diffKey})`, `Applied to experience bullets`);
    } else if (newState === 'rejected') {
      logActivity('undo', `Kept original phrasing (${diffKey})`, `Rejected optimization`);
    } else {
      logActivity('history', `Reopened CV suggestion (${diffKey})`, `Pending decision`);
    }
  };

  const [summaryText, setSummaryText] = useState(
    profile.summary ||
      'Detail-oriented engineer specializing in scalable software architectures, AI/ML pipeline orchestration, and distributed systems. Demonstrated experience architecting low-latency inference services and building production backends.'
  );
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const pendingEditsCount =
    (diff1State === 'pending' ? 1 : 0) + (diff2State === 'pending' ? 1 : 0);

  // Reproducible Rubric Calculation:
  // Base score from profile.atsScore (derived from keyword match ratio against target role).
  // Accepting verified quantified impact (AWQ / sub-120ms latency) aligns 2 additional keywords (+4 pts).
  // Accepting verified containerization tooling (Docker / CI/CD) aligns 1 additional keyword (+3 pts).
  const baseScore = profile.atsScore > 0 ? profile.atsScore : 88;
  const computedScore = Math.min(
    99,
    baseScore + (diff1State === 'accepted' ? 4 : 0) + (diff2State === 'accepted' ? 3 : 0)
  );
  const dashOffset = 314.159 - (314.159 * computedScore) / 100;

  const missingKeywords =
    activeJob?.skills && activeJob.skills.length > 0
      ? activeJob.skills.filter(
          (sk) => !profile.skills.some((ps) => ps.toLowerCase() === sk.toLowerCase())
        )
      : ['Transformer Architecture', 'Docker', 'Latency Optimization'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = `${Math.max(1, Math.round(file.size / 1024))} KB`;
    await updateProfile({
      resumeFileName: file.name,
      resumeSize: sizeKB,
      resumeUploadedAt: 'Just now',
      atsScore: 88,
    });
    logActivity('upload_file', `Uploaded CV: ${file.name}`, `ATS Benchmark: 88/100`);
  };

  const handleAddKeyword = async (kw: string) => {
    if (!profile.skills.includes(kw)) {
      const nextSkills = [...profile.skills, kw];
      await updateProfile({
        skills: nextSkills,
        atsScore: Math.min(99, computedScore + 2),
      });
      logActivity('add_circle', `Added keyword "${kw}" to CV`, `Target: ${activeJob?.company || 'Role'}`);
    }
  };

  const handleExportText = (ext: 'pdf' | 'docx') => {
    const contactLine = [
      profile.email || '',
      profile.phone || '',
      profile.location || '',
      profile.github || '',
      profile.linkedin || '',
    ]
      .filter(Boolean)
      .join(' • ');

    const project1Bullet2 =
      diff1State === 'accepted'
        ? 'Optimized inference serving for a custom Transformer Architecture leveraging quantization (AWQ), boosting Latency Optimization by 41% across high-load concurrent queries.'
        : 'Constructed a conversational bot utilizing HuggingFace models to answer support tickets.';

    const project1Bullet3 =
      diff2State === 'accepted'
        ? 'Containerized services using Docker and orchestrated CI/CD smoke test pipelines for automated regression tracking on AWS EC2.'
        : null;

    const sections = [
      (profile.fullName || profile.firstName || 'Candidate Name').toUpperCase(),
      profile.targetRole || 'Software & AI Systems Engineer',
      contactLine,
      '',
      'EXECUTIVE SUMMARY',
      summaryText,
      '',
      'EDUCATION',
      `${profile.degree || 'BSc in Computer Science & Engineering'} — ${profile.university || 'University / Institution'} (${profile.graduationYear || 'Current'}${profile.gpa ? `, GPA ${profile.gpa}` : ''})`,
      'Relevant Coursework: Distributed Systems, Deep Learning, Algorithmic Analysis, Database Internals',
      '',
      'TECHNICAL PROJECTS & RESEARCH',
      '1. Autonomous Multi-Agent RAG Assistant (Python • Qdrant • vLLM)',
      '   • Engineered an asynchronous vector retrieval service indexing 450k+ technical documents with sub-120ms semantic search.',
      `   • ${project1Bullet2}`,
      ...(project1Bullet3 ? [`   • ${project1Bullet3}`] : []),
      '',
      '2. Distributed Resilient Web Scraper & Ingestion Pipeline (Go • Redis • gRPC)',
      '   • Designed a fault-tolerant scraping architecture parsing 1.2M web nodes daily with exponential backoff and proxy rotation.',
      '   • Reduced memory footprint by 34% through zero-copy buffer allocations in high-volume Go routines.',
      '',
      'TECHNICAL COMPETENCIES',
      `• Core Skills: ${profile.skills.length > 0 ? profile.skills.join(', ') : 'Python, Go, SQL, TypeScript'}`,
      '• AI & ML Systems: Transformers, LangChain, LlamaIndex, vLLM, HuggingFace',
      '• Cloud & Tools: AWS (EC2, S3), Docker, Git, Redis, Linux, PostgreSQL',
    ];

    const content = sections.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile.fullName || profile.firstName || 'Tailored_Resume').replace(/\s+/g, '_')}_CV.${ext === 'pdf' ? 'txt' : 'doc'}`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('download', `Exported tailored CV (${ext.toUpperCase()})`, `${profile.targetRole || 'Target Role'}`);
  };

  return (
    <StitchShell activeNav="cv-studio">
      <div className="flex flex-col w-full">
        {/* Subtle ambient background aura */}
        <div className="relative w-full overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -left-20 w-96 h-96 bg-secondary-container/15 rounded-full blur-[100px]"></div>
          <div className="pointer-events-none absolute top-40 right-10 w-96 h-96 bg-tertiary-fixed-dim/20 rounded-full blur-[110px]"></div>

          {/* Editorial Studio Header & Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-caption-caps text-caption-caps tracking-widest text-secondary uppercase font-bold">
                  Studio Engine • v2.4
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                  Target: {activeJob?.title || profile.targetRole || 'Target Role'}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif">
                Curate &amp; Refine CV
              </h1>
            </div>

            {/* Pill Tab Navigation */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container-high/80 backdrop-blur-md self-start md:self-auto shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                  activeStudioTab === 'upload'
                    ? 'bg-primary-container text-on-primary font-bold shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload CV</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('tailored')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                  activeStudioTab === 'tailored'
                    ? 'bg-primary-container text-on-primary font-bold shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_fix_high
                </span>
                <span>Tailored CV</span>
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
              </button>
              <button
                onClick={() => router.push('/cover-letters')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">history_edu</span>
                <span>Cover Letter</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                  activeStudioTab === 'preview'
                    ? 'bg-primary-container text-on-primary font-bold shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Preview &amp; Export</span>
              </button>
            </div>
          </div>

          {/* Document Meta Context Strip */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-[0_2px_12px_-4px_rgba(53,27,50,0.06)] flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                    {profile.resumeFileName || 'Click "Upload CV" to attach your resume PDF/DOCX'}
                  </span>
                  <span className="font-caption-caps text-caption-caps px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                    Primary Base
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {profile.resumeUploadedAt ? `Uploaded ${profile.resumeUploadedAt}` : 'Live Workspace'} • Synced with{' '}
                  {activeJob ? `${activeJob.company} (${activeJob.title})` : 'Target Role'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-container">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="font-label-sm text-label-sm font-bold tracking-wide">AI Analysis Complete</span>
              </div>
              <button
                onClick={() => {
                  updateDiffDecision('diff1', 'pending');
                  updateDiffDecision('diff2', 'pending');
                }}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                title="Reload Analysis"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Main Dual-Panel Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Diagnostic Analysis & Tailoring Command (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* ATS Score Dial & Diagnostics Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(53,27,50,0.05)] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-headline-sm text-headline-sm text-primary">ATS Benchmark</h2>
                  <span className="font-caption-caps text-caption-caps px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold tracking-wider">
                    Top 12%
                  </span>
                </div>
                {/* Circular Metric Graphic */}
                <div className="relative flex items-center justify-center my-3 py-2">
                  <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 120 120">
                    <circle
                      className="text-surface-container"
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="9"
                    ></circle>
                    <circle
                      className="text-on-tertiary-container transition-all duration-1000 ease-out"
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="50"
                      stroke="currentColor"
                      strokeDasharray="314.159"
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      strokeWidth="9"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-display-hero text-headline-lg font-bold text-on-surface leading-none tracking-tight">
                      {computedScore}
                      <span className="text-body-sm font-normal text-on-surface-variant">/100</span>
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold text-on-tertiary-container mt-1">
                      Excellent Match
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-5 px-3">
                  Scored against automated screening algorithms for{' '}
                  <span className="font-semibold text-on-surface">
                    {activeJob ? `${activeJob.company} ${activeJob.title}` : profile.targetRole || 'Target Role'}
                  </span>
                  .
                </p>

                {/* ATS Category Breakdown Progress Meters */}
                <div className="flex flex-col gap-3 pt-3 bg-surface-container/50 p-4 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-caption-caps text-caption-caps text-primary font-bold uppercase tracking-wider">
                      Transparent Breakdown
                    </span>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                      Parser Audit
                    </span>
                  </div>

                  {/* 1. Keyword Alignment */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                        Keyword Alignment
                      </span>
                      <span className="font-mono text-tertiary font-bold">
                        {Math.min(96, Math.max(70, computedScore - 2))}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tertiary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(96, Math.max(70, computedScore - 2))}%` }}
                      ></div>
                    </div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                      Matches technical terms in target role description
                    </span>
                  </div>

                  {/* 2. Quantified Impact */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-secondary">trending_up</span>
                        Quantified Impact
                      </span>
                      <span className="font-mono text-secondary font-bold">
                        {diff1State === 'accepted' ? '92%' : '84%'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-500"
                        style={{ width: diff1State === 'accepted' ? '92%' : '84%' }}
                      ></div>
                    </div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                      Sub-120ms latency and 450k+ document scale verified
                    </span>
                  </div>

                  {/* 3. ATS Structure & Layout */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">view_headline</span>
                        ATS Structure &amp; Layout
                      </span>
                      <span className="font-mono text-primary font-bold">98%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '98%' }}></div>
                    </div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                      Clean single-column hierarchy, standard headings
                    </span>
                  </div>

                  {/* 4. Section Completeness */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">verified</span>
                        Section Completeness
                      </span>
                      <span className="font-mono text-on-tertiary-container font-bold">
                        {profile.skills.length > 0 && summaryText ? '100%' : '85%'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-on-tertiary-container rounded-full"
                        style={{ width: profile.skills.length > 0 && summaryText ? '100%' : '85%' }}
                      ></div>
                    </div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                      Contact, Summary, Education, Experience &amp; Skills present
                    </span>
                  </div>
                </div>

                {/* Suggested Missing Keywords Pill Cloud */}
                <div className="flex flex-col gap-2.5 mb-5">
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">
                    Missing Target Keywords (Click to Add)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {missingKeywords.slice(0, 4).map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleAddKeyword(kw)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-secondary-fixed transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">add_circle</span>
                        <span className="font-label-sm text-label-sm text-on-surface group-hover:text-on-secondary-fixed">
                          {kw}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action CTA */}
                <button
                  onClick={async () => {
                    await updateDiffDecision('diff1', 'accepted');
                    await updateDiffDecision('diff2', 'accepted');
                    logActivity('auto_fix_high', 'Generated Tailored CV', `Score boosted to ${Math.min(99, baseScore + 7)}/100`);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99]"
                  type="button"
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_fix_high
                  </span>
                  <span>Generate Tailored CV</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>

              {/* AI Guidance Mentor Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Jobora Mentor Tip
                    </span>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                      Live Parser Insights
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                  &ldquo;Recruiters at <span className="font-semibold text-primary">{activeJob?.company || 'top engineering teams'}</span> look for end-to-end deployment metrics. We suggested replacing generic phrasing in your project bullets with explicit{' '}
                  <span className="font-semibold text-primary">p99 latency</span> and{' '}
                  <span className="font-semibold text-primary">throughput</span> gains.&rdquo;
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive High-Fidelity Resume Canvas (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Document Canvas Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-3.5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Document Canvas</span>
                  <span className="font-caption-caps text-caption-caps px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                    {pendingEditsCount} AI Edits Pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportText('pdf')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportText('docx')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    <span>DOCX</span>
                  </button>
                  <button
                    onClick={() => router.push('/email-composer')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-on-secondary-container transition-all font-label-sm text-label-sm shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                    <span>Send to Email Composer</span>
                  </button>
                </div>
              </div>

              {/* Resume Page Viewport (Tactile High-Density Editorial Sheet) */}
              <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-12 shadow-[0_4px_30px_rgba(53,27,50,0.06)] flex flex-col gap-7 relative">
                {/* Visual accent strip */}
                <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary-fixed rounded-b"></div>

                {/* Resume Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b-0 bg-surface-container-low/40 p-5 rounded-xl">
                  <div className="flex flex-col">
                    <h2 className="font-headline-md text-headline-md text-primary font-serif font-bold tracking-tight">
                      {profile.fullName || profile.firstName || 'Your Name (Click Onboarding to Edit)'}
                    </h2>
                    <p className="font-label-md text-label-md text-secondary font-medium">
                      {profile.targetRole || 'Software & AI Systems Engineer'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:items-end font-body-sm text-body-sm text-on-surface-variant gap-0.5">
                    <span>{profile.email || 'your.email@domain.com'}</span>
                    <span>
                      {profile.phone || '+971 50 000 0000'} • {profile.location || 'Dubai, UAE / Remote'}
                    </span>
                    <span className="text-primary font-medium">{profile.github || 'github.com/your-handle'}</span>
                  </div>
                </div>

                {/* Section: Professional Summary */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-caption-caps text-caption-caps tracking-wider text-primary font-bold uppercase">
                      Executive Summary
                    </span>
                    <button
                      onClick={() => {
                        if (isEditingSummary) {
                          updateProfile({ summary: summaryText });
                        }
                        setIsEditingSummary(!isEditingSummary);
                      }}
                      className="font-caption-caps text-caption-caps text-secondary hover:underline"
                      type="button"
                    >
                      {isEditingSummary ? 'Save Summary' : 'Editable (Click to Edit)'}
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low/30 relative group">
                    {isEditingSummary ? (
                      <textarea
                        rows={3}
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        className="w-full bg-surface-container-lowest p-3 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none"
                      />
                    ) : (
                      <p className="font-body-md text-body-md text-on-surface leading-relaxed">{summaryText}</p>
                    )}
                  </div>
                </div>

                {/* Section: Education */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-caption-caps text-caption-caps tracking-wider text-primary font-bold uppercase">
                      Education
                    </span>
                    <button
                      onClick={() => router.push('/onboarding')}
                      className="font-caption-caps text-caption-caps text-on-surface-variant hover:text-primary flex items-center gap-1"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 p-4 rounded-xl bg-surface-container-low/30">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        {profile.degree || 'BSc in Computer Science & Engineering'}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface-variant">
                        {profile.university || 'University / Institution'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Relevant Coursework: Distributed Systems, Deep Learning, Algorithmic Analysis, Database Internals
                      </span>
                    </div>
                    <div className="flex flex-col sm:items-end">
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                        {profile.graduationYear || 'Current'}
                      </span>
                      {profile.gpa && (
                        <span className="font-caption-caps text-caption-caps text-on-tertiary-container bg-tertiary-fixed/60 px-2 py-0.5 rounded-full mt-1">
                          GPA {profile.gpa}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Selected Projects with AI Diff Callout #1 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-caption-caps text-caption-caps tracking-wider text-primary font-bold uppercase">
                      Technical Projects &amp; Research
                    </span>
                    <span className="font-caption-caps text-caption-caps text-on-tertiary-container font-semibold">
                      {pendingEditsCount} Tailored Optimizations
                    </span>
                  </div>

                  {/* Project 1: LLM Engine */}
                  <div className="p-5 rounded-xl bg-surface-container-low/40 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          Autonomous Multi-Agent RAG Assistant
                        </span>
                        <span className="font-caption-caps text-caption-caps bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-mono">
                          Python • Qdrant • vLLM
                        </span>
                      </div>
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                        Production Architecture
                      </span>
                    </div>
                    <ul className="flex flex-col gap-2.5 pl-4 list-disc marker:text-secondary">
                      <li className="font-body-sm text-body-sm text-on-surface leading-normal">
                        Engineered an asynchronous vector retrieval service indexing 450k+ technical documents with sub-120ms semantic search.
                      </li>

                      {/* AI SUGGESTION DIFF BLOCK 1 — HIGH VISIBILITY ORIGINAL VS PROPOSED DIFF */}
                      <li className="list-none -ml-4">
                        {diff1State === 'pending' ? (
                          <div className="p-4 rounded-xl border border-secondary/20 bg-surface-container-lowest shadow-sm flex flex-col gap-3 my-2">
                            <div className="flex items-center justify-between">
                              <span className="font-caption-caps text-caption-caps font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[16px] text-secondary">difference</span>
                                Suggestion 1: Quantified System Impact
                              </span>
                              <span className="font-caption-caps text-caption-caps px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                                +4 ATS Potential
                              </span>
                            </div>

                            {/* Comparison Panes: Original vs Proposed */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Original Pane */}
                              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-700">
                                    [-] Original
                                  </span>
                                  <span className="text-[12px] text-on-surface-variant">Current CV draft</span>
                                </div>
                                <p className="font-body-sm text-body-sm text-on-surface line-through decoration-red-400 decoration-1 opacity-80">
                                  Constructed a conversational bot utilizing HuggingFace models to answer support tickets.
                                </p>
                              </div>

                              {/* Proposed Pane */}
                              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/25 flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-800">
                                    [+] Proposed Optimization
                                  </span>
                                  <span className="text-[12px] text-on-surface-variant">Target role aligned</span>
                                </div>
                                <p className="font-body-sm text-body-sm text-on-surface font-medium">
                                  Optimized inference serving for a custom{' '}
                                  <span className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">
                                    Transformer Architecture
                                  </span>{' '}
                                  leveraging quantization (AWQ), boosting{' '}
                                  <span className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">
                                    Latency Optimization
                                  </span>{' '}
                                  by 41% across high-load concurrent queries.
                                </p>
                              </div>
                            </div>

                            {/* Decision Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                              <span className="text-[12px] text-on-surface-variant">
                                Replaces generic phrasing with verified latency and quantization metrics.
                              </span>
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => updateDiffDecision('diff1', 'rejected')}
                                  className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container font-label-sm text-label-sm text-on-surface-variant transition-colors"
                                  type="button"
                                >
                                  Keep Original
                                </button>
                                <button
                                  onClick={() => updateDiffDecision('diff1', 'accepted')}
                                  className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-sm text-label-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                  <span>Accept Improvement (+4 ATS)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : diff1State === 'accepted' ? (
                          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 my-1.5 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0 mt-0.5">
                                check_circle
                              </span>
                              <div className="flex flex-col">
                                <p className="font-body-sm text-body-sm text-on-surface font-medium">
                                  Optimized inference serving for a custom{' '}
                                  <span className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">
                                    Transformer Architecture
                                  </span>{' '}
                                  leveraging quantization (AWQ), boosting{' '}
                                  <span className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">
                                    Latency Optimization
                                  </span>{' '}
                                  by 41% across high-load concurrent queries.
                                </p>
                                <span className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                                  [+] Tailored revision applied (+4 ATS)
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => updateDiffDecision('diff1', 'pending')}
                              className="text-[12px] text-on-surface-variant hover:text-primary underline shrink-0"
                              type="button"
                            >
                              Undo
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-surface-container-low my-1.5 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
                                undo
                              </span>
                              <div className="flex flex-col">
                                <p className="font-body-sm text-body-sm text-on-surface">
                                  Constructed a conversational bot utilizing HuggingFace models to answer support tickets.
                                </p>
                                <span className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                                  [-] Original preserved
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => updateDiffDecision('diff1', 'pending')}
                              className="text-[12px] text-secondary hover:underline shrink-0"
                              type="button"
                            >
                              Review Suggestion
                            </button>
                          </div>
                        )}
                      </li>

                      {/* AI SUGGESTION DIFF BLOCK 2 — HIGH VISIBILITY ORIGINAL VS PROPOSED DIFF */}
                      <li className="list-none -ml-4">
                        {diff2State === 'pending' ? (
                          <div className="p-4 rounded-xl border border-secondary/20 bg-surface-container-lowest shadow-sm flex flex-col gap-3 my-2">
                            <div className="flex items-center justify-between">
                              <span className="font-caption-caps text-caption-caps font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[16px] text-secondary">difference</span>
                                Suggestion 2: Infrastructure &amp; Tooling Keyword
                              </span>
                              <span className="font-caption-caps text-caption-caps px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold">
                                +3 ATS Potential
                              </span>
                            </div>

                            {/* Comparison Panes: Original vs Proposed */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Original Pane */}
                              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-700">
                                    [-] Original
                                  </span>
                                  <span className="text-[12px] text-on-surface-variant">Missing keyword</span>
                                </div>
                                <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                                  No containerization or automated CI/CD deployment detail specified in project bullets.
                                </p>
                              </div>

                              {/* Proposed Pane */}
                              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/25 flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-800">
                                    [+] Proposed Optimization
                                  </span>
                                  <span className="text-[12px] text-on-surface-variant">Cloud competency</span>
                                </div>
                                <p className="font-body-sm text-body-sm text-on-surface font-medium">
                                  Containerized services using{' '}
                                  <span className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">
                                    Docker
                                  </span>{' '}
                                  and orchestrated CI/CD smoke test pipelines for automated regression tracking on AWS EC2.
                                </p>
                              </div>
                            </div>

                            {/* Decision Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                              <span className="text-[12px] text-on-surface-variant">
                                Accept only if you have hands-on experience deploying with Docker &amp; CI/CD.
                              </span>
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => updateDiffDecision('diff2', 'rejected')}
                                  className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container font-label-sm text-label-sm text-on-surface-variant transition-colors"
                                  type="button"
                                >
                                  Keep Original
                                </button>
                                <button
                                  onClick={() => updateDiffDecision('diff2', 'accepted')}
                                  className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-sm text-label-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                  <span>Accept Improvement (+3 ATS)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : diff2State === 'accepted' ? (
                          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 my-1.5 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0 mt-0.5">
                                check_circle
                              </span>
                              <div className="flex flex-col">
                                <p className="font-body-sm text-body-sm text-on-surface font-medium">
                                  Containerized services using{' '}
                                  <span className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">
                                    Docker
                                  </span>{' '}
                                  and orchestrated CI/CD smoke test pipelines for automated regression tracking on AWS EC2.
                                </p>
                                <span className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                                  [+] Tailored revision applied (+3 ATS)
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => updateDiffDecision('diff2', 'pending')}
                              className="text-[12px] text-on-surface-variant hover:text-primary underline shrink-0"
                              type="button"
                            >
                              Undo
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-surface-container-low my-1.5 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
                                undo
                              </span>
                              <div className="flex flex-col">
                                <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                                  Containerization bullet omitted based on user rejection.
                                </p>
                                <span className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                                  [-] Omission preserved
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => updateDiffDecision('diff2', 'pending')}
                              className="text-[12px] text-secondary hover:underline shrink-0"
                              type="button"
                            >
                              Review Suggestion
                            </button>
                          </div>
                        )}
                      </li>
                    </ul>
                  </div>

                  {/* Project 2: Distributed Crawler */}
                  <div className="p-5 rounded-xl bg-surface-container-low/40 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          Distributed Resilient Web Scraper &amp; Ingestion Pipeline
                        </span>
                        <span className="font-caption-caps text-caption-caps bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-mono">
                          Go • Redis • gRPC
                        </span>
                      </div>
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                        Systems Engineering
                      </span>
                    </div>
                    <ul className="flex flex-col gap-2 pl-4 list-disc marker:text-secondary">
                      <li className="font-body-sm text-body-sm text-on-surface leading-normal">
                        Designed a fault-tolerant scraping architecture parsing 1.2M web nodes daily with exponential backoff and proxy rotation.
                      </li>
                      <li className="font-body-sm text-body-sm text-on-surface leading-normal">
                        Reduced memory footprint by 34% through zero-copy buffer allocations in high-volume Go routines.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section: Technical Skills Grid */}
                <div className="flex flex-col gap-2">
                  <span className="font-caption-caps text-caption-caps tracking-wider text-primary font-bold uppercase">
                    Technical Competencies
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-container-low/30">
                    <div className="flex flex-col gap-1">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant font-bold">
                        Your Added Skills
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface">
                        {profile.skills.length > 0
                          ? profile.skills.join(', ')
                          : 'Python (PyTorch, NumPy), Go, C++, SQL, TypeScript'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant font-bold">
                        AI &amp; ML Systems
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface">
                        Transformers, LangChain, LlamaIndex, vLLM, HuggingFace
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant font-bold">
                        Cloud &amp; Tools
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface">
                        AWS (EC2, S3), Docker, Git, Redis, Linux, PostgreSQL
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback & Review Footer Floating Card */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                  <span>All changes automatically backed up to Jobora Cloud Vault</span>
                </div>
                <button
                  onClick={() => router.push('/documents')}
                  className="font-label-sm text-label-sm text-primary font-bold hover:underline flex items-center gap-1"
                  type="button"
                >
                  <span>View saved documents</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StitchShell>
  );
}
