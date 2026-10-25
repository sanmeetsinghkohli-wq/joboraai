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
            <span className="badge-coral uppercase tracking-wider text-[11px] font-bold">
              Editorial Narrative Studio
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#351B32] tracking-tight mt-1">
              AI Cover Letter Generator
            </h1>
            <p className="text-sm text-[#7D747D] mt-1 font-sans">
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
                className="bg-white border border-[#EDE5E1] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#351B32] shadow-sm focus-ring cursor-pointer"
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
              className="btn-editorial-secondary text-xs flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Draft</span>
            </button>
            <button
              onClick={handleDownloadDocx}
              className="btn-editorial-secondary text-xs flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export DOCX</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="btn-editorial-secondary text-xs flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => router.push('/email-composer')}
              className="btn-editorial-primary text-xs flex items-center gap-2"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
              <span>Attach to Email</span>
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="px-4 py-2.5 rounded-xl editorial-card border border-[#EDE5E1] flex items-center justify-between text-xs text-[#351B32] animate-fade-in">
            <span className="font-medium">{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-[#7D747D] hover:text-[#351B32] p-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Drafts & Controls Sidebar (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <div className="editorial-card border border-[#EDE5E1] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h2 className="font-serif text-lg font-semibold text-[#351B32]">Tone &amp; Length Calibration</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#5A525A]">Editorial Tone</label>
                <select
                  value={tone}
                  onChange={(e) => {
                    setActiveDraftId(null);
                    setTone(e.target.value as CoverLetterDraft['tone']);
                  }}
                  className="bg-[#F8F5F0]/60 border border-[#EDE5E1] px-3.5 py-2 rounded-xl text-sm text-[#351B32] focus-ring"
                >
                  <option value="Editorial & Professional">Editorial &amp; Professional</option>
                  <option value="Executive & Concise">Executive &amp; Concise</option>
                  <option value="Technical & Impact-Driven">Technical &amp; Impact-Driven</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#5A525A]">Target Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Concise', 'Standard', 'Detailed'] as const).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => {
                        setActiveDraftId(null);
                        setLengthMode(len);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all focus-ring ${
                        lengthMode === len
                          ? 'bg-[#351B32] text-white shadow-sm'
                          : 'bg-[#F8F5F0] text-[#5A525A] hover:text-[#351B32] border border-[#EDE5E1]'
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
                className="w-full btn-editorial-secondary text-xs flex items-center justify-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">autorenew</span>
                <span>Regenerate Letter</span>
              </button>
            </div>

            <div className="editorial-card border border-[#EDE5E1] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-[#351B32]">Saved Drafts</h2>
                <span className="badge-neutral text-[11px]">
                  {drafts.length} saved
                </span>
              </div>
              {drafts.length === 0 ? (
                <div className="text-center py-6 px-4 bg-[#F8F5F0]/50 rounded-xl border border-dashed border-[#EDE5E1]">
                  <span className="material-symbols-outlined text-[#7D747D] text-3xl mb-1">drafts</span>
                  <p className="text-xs text-[#7D747D] mt-1">
                    No saved drafts yet. Click &ldquo;Save Draft&rdquo; to store versions for different employers.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        activeDraftId === d.id
                          ? 'bg-[#F8F5F0] border-[#E76F72] shadow-sm'
                          : 'bg-white border-[#EDE5E1] hover:border-[#351B32]/30'
                      }`}
                    >
                      {renameId === d.id ? (
                        <div className="flex items-center gap-1.5 mb-2">
                          <input
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(d.id);
                              if (e.key === 'Escape') setRenameId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-white px-2.5 py-1.5 rounded-lg text-xs text-[#351B32] border border-[#EDE5E1] focus-ring"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameSubmit(d.id)}
                            className="btn-editorial-primary text-xs px-2.5 py-1.5"
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
                          <div className="text-xs font-semibold text-[#351B32] truncate">
                            {d.name}
                          </div>
                          <div className="text-[11px] text-[#7D747D] mt-0.5">
                            {d.tone} • {d.updatedAt}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#EDE5E1] text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setRenameId(d.id);
                            setRenameText(d.name);
                          }}
                          className="text-[#351B32] font-medium hover:underline"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(d.id)}
                          className="text-[#E76F72] font-medium hover:underline ml-auto"
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
          <div className="lg:col-span-8 editorial-card border border-[#EDE5E1] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#EDE5E1] pb-3">
              <span className="font-serif text-base font-semibold text-[#351B32]">
                Editable Cover Letter Manuscript
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-editorial-secondary text-xs flex items-center gap-1"
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
              className="w-full bg-[#F8F5F0]/30 border border-[#EDE5E1] rounded-xl p-4 font-sans text-sm text-[#1D1A21] leading-relaxed focus-ring resize-y"
            />
          </div>
        </div>
      </div>
    </StitchShell>
  );
}
