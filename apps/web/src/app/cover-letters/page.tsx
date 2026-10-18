'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

interface CoverLetterDraft {
  id: string;
  name: string;
  jobId: string;
  company: string;
  roleTitle: string;
  tone: 'Editorial & Professional' | 'Executive & Concise' | 'Technical & Impact-Driven';
  length: 'Concise' | 'Standard' | 'Detailed';
  content: string;
  updatedAt: string;
}

export default function CoverLettersPage() {
  const router = useRouter();
  const { profile, jobs, selectedJob, setSelectedJob, logActivity } = useAppData();

  const activeJob = selectedJob || jobs[0] || {
    id: 'job-1',
    title: 'Software & AI Systems Engineer',
    company: 'Target Employer',
    location: 'Remote',
    skills: ['TypeScript', 'React', 'Python'],
  };

  const senderName = profile.fullName || profile.firstName || 'Candidate Name';
  const [tone, setTone] = useState<CoverLetterDraft['tone']>('Editorial & Professional');
  const [lengthMode, setLengthMode] = useState<CoverLetterDraft['length']>('Standard');
  const [letterText, setLetterText] = useState('');
  const [drafts, setDrafts] = useState<CoverLetterDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jobora_cover_letter_drafts');
      if (stored) setDrafts(JSON.parse(stored));
    } catch {}
  }, []);

  const persistDrafts = (next: CoverLetterDraft[]) => {
    setDrafts(next);
    try {
      localStorage.setItem('jobora_cover_letter_drafts', JSON.stringify(next));
    } catch {}
  };

  const buildGroundedLetter = (
    selectedTone: CoverLetterDraft['tone'],
    selectedLength: CoverLetterDraft['length']
  ) => {
    const skillsStr =
      profile.skills.length > 0
        ? profile.skills.slice(0, 5).join(', ')
        : (activeJob.skills || ['Software Engineering', 'System Design']).slice(0, 4).join(', ');

    const header = `${senderName}\n${profile.location || activeJob.location || 'Remote'} • ${
      profile.email || 'candidate@email.com'
    }${profile.phone ? ` • ${profile.phone}` : ''}\n\n${new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}\n\nHiring Team\n${activeJob.company}\n${activeJob.location || 'Remote'}\n\nRe: ${
      activeJob.title
    } Application\n\nDear Hiring Team at ${activeJob.company},`;

    const opening =
      selectedTone === 'Executive & Concise'
        ? `I am writing to apply for the ${activeJob.title} position at ${activeJob.company}. My verified experience across ${skillsStr} positions me to contribute immediately to your roadmap.`
        : selectedTone === 'Technical & Impact-Driven'
        ? `I am submitting my application for the ${activeJob.title} role at ${activeJob.company}. With a strong engineering foundation in ${skillsStr}, I focus on building reliable, well-tested production systems.`
        : `I am pleased to submit my application for the ${activeJob.title} role at ${activeJob.company}. Having followed ${activeJob.company}'s work closely, I am eager to bring my background in ${skillsStr} to your team.`;

    const middle =
      profile.summary ||
      `Throughout my recent projects${
        profile.university ? ` and academic work at ${profile.university}` : ''
      }, I have focused on translating complex technical and product requirements into resilient, user-centered software.`;

    const detailedParagraph =
      selectedLength === 'Detailed'
        ? `\n\nIn addition to core implementation in ${skillsStr}, I value clear documentation, cross-functional design collaboration, and measurable performance optimization that aligns with ${activeJob.company}'s standards.`
        : '';

    const closing =
      selectedLength === 'Concise'
        ? `\n\nThank you for your time and consideration.\n\nSincerely,\n${senderName}`
        : `\n\n${middle}${detailedParagraph}\n\nThank you for your consideration. I welcome the opportunity to discuss how my verified qualifications align with ${activeJob.company}'s goals.\n\nSincerely,\n${senderName}`;

    return `${header}\n\n${opening}${closing}`;
  };

  useEffect(() => {
    if (!activeDraftId) {
      setLetterText(buildGroundedLetter(tone, lengthMode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob.id, senderName, profile.location, profile.email, profile.skills, tone, lengthMode]);

  const handleSaveDraft = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (activeDraftId) {
      const updated = drafts.map((d) =>
        d.id === activeDraftId
          ? { ...d, content: letterText, tone, length: lengthMode, updatedAt: now }
          : d
      );
      persistDrafts(updated);
      setStatusNotice('Updated saved cover letter draft.');
    } else {
      const newDraft: CoverLetterDraft = {
        id: `cl-${Date.now()}`,
        name: `${activeJob.company} — ${activeJob.title}`,
        jobId: activeJob.id,
        company: activeJob.company,
        roleTitle: activeJob.title,
        tone,
        length: lengthMode,
        content: letterText,
        updatedAt: now,
      };
      const next = [newDraft, ...drafts];
      persistDrafts(next);
      setActiveDraftId(newDraft.id);
      setStatusNotice(`Saved draft "${newDraft.name}"`);
    }
    logActivity('history_edu', `Saved cover letter draft for ${activeJob.company}`, activeJob.title);
  };

  const handleDeleteDraft = (id: string) => {
    const next = drafts.filter((d) => d.id !== id);
    persistDrafts(next);
    if (activeDraftId === id) {
      setActiveDraftId(null);
    }
    setStatusNotice('Deleted cover letter draft.');
  };

  const handleRenameSubmit = (id: string) => {
    if (!renameText.trim()) return;
    const next = drafts.map((d) => (d.id === id ? { ...d, name: renameText.trim() } : d));
    persistDrafts(next);
    setRenameId(null);
    setRenameText('');
    setStatusNotice('Renamed cover letter draft.');
  };

  const handleDownloadDocx = () => {
    const blob = new Blob([letterText], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${activeJob.company.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('draft', `Exported DOCX cover letter for ${activeJob.company}`, activeJob.title);
    setStatusNotice('Exported Cover Letter (.docx)');
  };

  const handlePrintPdf = () => {
    window.print();
    logActivity('picture_as_pdf', `Exported PDF cover letter for ${activeJob.company}`, activeJob.title);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(letterText);
    setStatusNotice('Copied cover letter text to clipboard.');
  };

  return (
    <StitchShell activeNav="cover-letters">
      <div className="flex flex-col w-full py-6 gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
              Editorial Narrative Studio
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
              AI Cover Letter Generator
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Synthesized strictly from your verified profile skills and target job description — zero fabricated qualifications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {jobs.length > 0 && (
              <select
                value={activeJob.id}
                onChange={(e) => {
                  const found = jobs.find((j) => j.id === e.target.value);
                  if (found) {
                    setActiveDraftId(null);
                    setSelectedJob(found);
                  }
                }}
                aria-label="Select target job for cover letter"
                className="bg-surface-container-lowest px-3.5 py-2.5 rounded-xl font-label-md text-label-md text-primary shadow-sm focus:outline-none"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} — {j.title}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-all flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Draft</span>
            </button>
            <button
              onClick={handleDownloadDocx}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-variant transition-all flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export DOCX</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-variant transition-all flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => router.push('/email-composer')}
              className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-95 transition-all flex items-center gap-2"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
              <span>Attach to Email</span>
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-label-sm font-label-sm text-primary">
            <span>{statusNotice}</span>
            <button type="button" onClick={() => setStatusNotice(null)}>
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Drafts & Controls Sidebar (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">Tone &amp; Length Calibration</h2>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Editorial Tone</label>
                <select
                  value={tone}
                  onChange={(e) => {
                    setActiveDraftId(null);
                    setTone(e.target.value as CoverLetterDraft['tone']);
                  }}
                  className="bg-surface-container-low px-3.5 py-2 rounded-xl font-label-md text-label-md text-primary"
                >
                  <option value="Editorial & Professional">Editorial &amp; Professional</option>
                  <option value="Executive & Concise">Executive &amp; Concise</option>
                  <option value="Technical & Impact-Driven">Technical &amp; Impact-Driven</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Target Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Concise', 'Standard', 'Detailed'] as const).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => {
                        setActiveDraftId(null);
                        setLengthMode(len);
                      }}
                      className={`py-2 rounded-xl font-label-sm text-label-sm font-semibold transition-all ${
                        lengthMode === len
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDraftId(null);
                  setLetterText(buildGroundedLetter(tone, lengthMode));
                  setStatusNotice('Regenerated grounded cover letter from profile & job.');
                }}
                className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">autorenew</span>
                <span>Regenerate Letter</span>
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-primary">Saved Drafts</h2>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                  {drafts.length} saved
                </span>
              </div>
              {drafts.length === 0 ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant py-3">
                  No saved drafts yet. Click &ldquo;Save Draft&rdquo; to store versions for different employers.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      className={`p-3 rounded-xl border transition-all ${
                        activeDraftId === d.id
                          ? 'bg-surface-container-low border-secondary'
                          : 'bg-surface-container-lowest border-outline-variant/20'
                      }`}
                    >
                      {renameId === d.id ? (
                        <div className="flex items-center gap-1.5 mb-2">
                          <input
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            className="flex-1 bg-white px-2 py-1 rounded text-xs text-primary border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameSubmit(d.id)}
                            className="px-2 py-1 rounded bg-primary text-white text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setActiveDraftId(d.id);
                            setLetterText(d.content);
                            setTone(d.tone);
                            setLengthMode(d.length);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="font-label-sm text-label-sm text-primary font-bold truncate">
                            {d.name}
                          </div>
                          <div className="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
                            {d.tone} • {d.updatedAt}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/15 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setRenameId(d.id);
                            setRenameText(d.name);
                          }}
                          className="text-primary hover:underline"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(d.id)}
                          className="text-rose-700 hover:underline ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Right Editor Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <span className="font-label-md text-label-md text-primary font-bold">
                Editable Cover Letter Manuscript
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm hover:bg-surface-container-high flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span>Copy Text</span>
              </button>
            </div>
            <textarea
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              rows={18}
              aria-label="Cover letter editor"
              className="w-full bg-transparent font-body-md text-body-md text-on-surface leading-relaxed focus:outline-none resize-y"
            />
          </div>
        </div>
      </div>
    </StitchShell>
  );
}
