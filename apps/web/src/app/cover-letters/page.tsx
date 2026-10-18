'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function CoverLettersPage() {
  const router = useRouter();
  const { profile, jobs, selectedJob, setSelectedJob, logActivity } = useAppData();

  const activeJob = selectedJob || jobs[0] || {
    id: 'job-1',
    title: 'AI Systems Engineer',
    company: 'Amazon MENA',
    location: 'Dubai, UAE',
    skills: ['PyTorch', 'RAG', 'FastAPI', 'AWS'],
  };

  const senderName = profile.fullName || 'Your Name';
  const [letterText, setLetterText] = useState('');

  useEffect(() => {
    const skillsStr =
      profile.skills.length > 0
        ? profile.skills.slice(0, 4).join(', ')
        : (activeJob.skills || ['PyTorch', 'LLM Fine-Tuning', 'Distributed Systems']).join(', ');

    setLetterText(
      `${senderName}\n${profile.location || 'Dubai, United Arab Emirates'} • ${profile.email || 'candidate@email.com'}\n\n${new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}\n\nHiring Committee\n${activeJob.company}\n${activeJob.location || 'Dubai, UAE'}\n\nRe: ${activeJob.title} Application\n\nDear Hiring Team at ${activeJob.company},\n\nI am writing to submit my application for the ${activeJob.title} role at ${activeJob.company}. With hands-on experience designing production AI architectures and high-throughput systems using ${skillsStr}, I am eager to bring immediate technical velocity to your engineering organization.\n\nIn my recent work, I architected low-latency Retrieval-Augmented Generation (RAG) and distributed inference pipelines that reduced P99 query latency by 38% while maintaining strict accuracy benchmarks. My background aligns directly with ${activeJob.company}'s focus on scalable, resilient cloud systems.\n\nThank you for your consideration. I look forward to discussing how my engineering background can support ${activeJob.company}'s upcoming product milestones.\n\nSincerely,\n${senderName}`
    );
  }, [activeJob.id, senderName, profile.location, profile.email, profile.skills]);

  const handleDownloadTxt = () => {
    const blob = new Blob([letterText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${activeJob.company.replace(/\s+/g, '_')}.txt`;
    a.click();
    logActivity('draft', `Exported tailored cover letter for ${activeJob.company}`, activeJob.title);
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
              Automatically synthesized from your profile and live target job requirements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {jobs.length > 0 && (
              <select
                value={activeJob.id}
                onChange={(e) => {
                  const found = jobs.find((j) => j.id === e.target.value);
                  if (found) setSelectedJob(found);
                }}
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
              onClick={handleDownloadTxt}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-variant transition-all flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Download</span>
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

        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm">
          <textarea
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            rows={18}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface leading-relaxed focus:outline-none resize-y"
          />
        </div>
      </div>
    </StitchShell>
  );
}
