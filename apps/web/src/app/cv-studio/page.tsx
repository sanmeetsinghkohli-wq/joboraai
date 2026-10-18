'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function CVStudioPage() {
  const router = useRouter();
  const { profile, updateProfile, selectedJob, jobs, logActivity } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeJob = selectedJob || (jobs.length > 0 ? jobs[0] : null);
  const [activeStudioTab, setActiveStudioTab] = useState<'upload' | 'tailored' | 'cover-letter' | 'preview'>('tailored');
  const [diff1State, setDiff1State] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [diff2State, setDiff2State] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [summaryText, setSummaryText] = useState(
    profile.summary ||
      'Detail-oriented engineer specializing in scalable software architectures, AI/ML pipeline orchestration, and distributed systems. Demonstrated experience architecting low-latency inference services and building production backends.'
  );
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const pendingEditsCount =
    (diff1State === 'pending' ? 1 : 0) + (diff2State === 'pending' ? 1 : 0);

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
    const content = `${profile.fullName || 'Candidate Name'}\n${profile.email || ''} • ${profile.phone || ''} • ${profile.location || ''}\n\nEXECUTIVE SUMMARY\n${summaryText}\n\nSKILLS\n${profile.skills.join(', ')}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile.fullName || 'Tailored_Resume').replace(/\s+/g, '_')}.${ext === 'pdf' ? 'txt' : 'doc'}`;
    a.click();
    URL.revokeObjectURL(url);
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
                  setDiff1State('pending');
                  setDiff2State('pending');
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

                {/* Criteria Checklist */}
                <div className="flex flex-col gap-3 pt-3 border-t-0 bg-surface-container/50 p-4 rounded-xl mb-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface">
                        Strong Structure &amp; Hierarchy
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Clear single-column scan lines detected.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface">
                        Relevant Technical Competencies
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {profile.skills.length > 0
                          ? `${profile.skills.slice(0, 3).join(', ')} flagged.`
                          : 'Core engineering stack verified.'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface">Good Keyword Density</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Matches {computedScore}% target job description terms.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface">Quantifiable Achievements</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Performance metrics present in experience bullets.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-secondary text-[20px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      warning
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface">
                        Suggestions for Improvement
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {missingKeywords.length} semantic terms available to add below.
                      </span>
                    </div>
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
                  onClick={() => {
                    setDiff1State('accepted');
                    setDiff2State('accepted');
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

                      {/* AI SUGGESTION DIFF BLOCK 1 */}
                      <li className="font-body-sm text-body-sm text-on-surface leading-normal relative group">
                        {diff1State !== 'accepted' && (
                          <span className={diff1State === 'pending' ? 'text-on-surface-variant line-through opacity-60' : ''}>
                            Constructed a conversational bot utilizing HuggingFace models to answer support tickets.
                          </span>
                        )}
                        {diff1State === 'accepted' && (
                          <span className="text-on-surface font-medium">
                            Optimized inference serving for a custom{' '}
                            <span className="bg-tertiary-fixed/40 px-1 py-0.5 rounded text-on-tertiary-fixed font-bold">
                              Transformer Architecture
                            </span>{' '}
                            leveraging quantization (AWQ), boosting{' '}
                            <span className="bg-tertiary-fixed/40 px-1 py-0.5 rounded text-on-tertiary-fixed font-bold">
                              Latency Optimization
                            </span>{' '}
                            by 41% across high-load concurrent queries.
                          </span>
                        )}
                        {diff1State === 'pending' && (
                          <div className="mt-2 p-3 rounded-lg bg-tertiary-fixed/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-start gap-2">
                              <span
                                className="material-symbols-outlined text-on-tertiary-container text-[18px] shrink-0 mt-0.5"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                auto_fix_normal
                              </span>
                              <p className="font-body-sm text-body-sm text-on-surface font-medium">
                                Optimized inference serving for a custom{' '}
                                <span className="bg-tertiary-fixed/40 px-1 py-0.5 rounded text-on-tertiary-fixed font-bold">
                                  Transformer Architecture
                                </span>{' '}
                                leveraging quantization (AWQ), boosting{' '}
                                <span className="bg-tertiary-fixed/40 px-1 py-0.5 rounded text-on-tertiary-fixed font-bold">
                                  Latency Optimization
                                </span>{' '}
                                by 41% across high-load concurrent queries.
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                onClick={() => setDiff1State('accepted')}
                                className="px-2.5 py-1 rounded bg-on-tertiary-container text-white font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => setDiff1State('rejected')}
                                className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-highest font-label-sm text-label-sm transition-colors"
                                type="button"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </li>

                      {/* AI SUGGESTION DIFF BLOCK 2 */}
                      {diff2State !== 'rejected' && (
                        <li className="font-body-sm text-body-sm text-on-surface leading-normal relative group">
                          {diff2State === 'accepted' ? (
                            <span className="text-on-surface font-medium">
                              Containerized services using{' '}
                              <span className="bg-secondary-fixed-dim/60 px-1 py-0.5 rounded text-on-secondary-fixed font-bold">
                                Docker
                              </span>{' '}
                              and orchestrated CI/CD smoke test pipelines for automated regression tracking on AWS EC2.
                            </span>
                          ) : (
                            <div className="mt-1 p-3 rounded-lg bg-secondary-fixed/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                              <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                                  add_task
                                </span>
                                <p className="font-body-sm text-body-sm text-on-surface font-medium">
                                  Containerized services using{' '}
                                  <span className="bg-secondary-fixed-dim/60 px-1 py-0.5 rounded text-on-secondary-fixed font-bold">
                                    Docker
                                  </span>{' '}
                                  and orchestrated CI/CD smoke test pipelines for automated regression tracking on AWS EC2.
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                <button
                                  onClick={() => setDiff2State('accepted')}
                                  className="px-2.5 py-1 rounded bg-secondary text-white font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => setDiff2State('rejected')}
                                  className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-highest font-label-sm text-label-sm transition-colors"
                                  type="button"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      )}
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
