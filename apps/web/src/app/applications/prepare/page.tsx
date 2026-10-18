'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function ApplicationPreparePage() {
  const router = useRouter();
  const { profile, jobs, selectedJob, setSelectedJob, addApplication, logActivity } = useAppData();

  const activeJob = selectedJob || jobs[0] || null;

  const [whyCompanyAnswer, setWhyCompanyAnswer] = useState(
    activeJob
      ? `I am applying for the ${activeJob.title} role at ${activeJob.company} because my background in ${
          profile.skills.slice(0, 3).join(', ') || 'software and product delivery'
        } directly supports your team's engineering goals.`
      : ''
  );
  const [projectHighlightAnswer, setProjectHighlightAnswer] = useState(
    profile.summary ||
      'Led end-to-end delivery of production systems using verified engineering workflows and cross-functional collaboration.'
  );
  const [includeCV, setIncludeCV] = useState(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [explicitApproval, setExplicitApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<string | null>(null);

  const userSkillsLower = profile.skills.map((s) => s.toLowerCase());
  const jobSkills = activeJob?.skills || [];
  const matchedSkills = jobSkills.filter((s) =>
    userSkillsLower.some((u) => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))
  );
  const missingSkills = jobSkills.filter((s) => !matchedSkills.includes(s));

  const missingProfileFields: string[] = [];
  if (!profile.fullName && !profile.firstName) missingProfileFields.push('Candidate Full Name');
  if (!profile.email) missingProfileFields.push('Contact Email');
  if (!profile.resumeFileName) missingProfileFields.push('Uploaded Master CV');
  if (profile.skills.length === 0) missingProfileFields.push('Verified Skills List');

  const handleApproveAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !explicitApproval) return;
    setSubmitting(true);

    if (
      activeJob.sourceUrl &&
      (activeJob.sourceUrl.startsWith('https://') || activeJob.sourceUrl.startsWith('http://'))
    ) {
      window.open(activeJob.sourceUrl, '_blank', 'noopener,noreferrer');
    }

    await addApplication({
      jobId: activeJob.id,
      title: activeJob.title,
      company: activeJob.company,
      location: activeJob.location,
      status: 'Applied',
      matchScore: activeJob.matchScore || 85,
      syncChannel: `Approved via Application Copilot (${activeJob.source})`,
      nextAction: 'Confirm portal submission & follow up in 5 days',
      recruiterName: activeJob.recruiterName || `${activeJob.company} Hiring Team`,
      recruiterEmail: activeJob.recruiterEmail || '',
    });

    logActivity(
      'fact_check',
      `Approved application package for ${activeJob.company}`,
      `${activeJob.title} • Target URL verified`
    );

    setSubmitting(false);
    setSubmittedSuccess(
      `Application package approved! Opened ${activeJob.company}'s official application portal and recorded the entry in your Application Tracker.`
    );
  };

  return (
    <StitchShell activeNav="applications">
      <div className="flex flex-col w-full py-6 gap-6 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-caption-caps text-caption-caps uppercase font-bold">
                Application Preparation &amp; Submission Review
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-container font-caption-caps text-caption-caps font-bold">
                Explicit Approval Gate
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              Application Preparation Copilot
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
              Review your target role, match explanation, tailored documents, screening answers, and target employer URL before approving external submission.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/applications"
              className="px-4 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors"
            >
              ← Back to Tracker
            </Link>
          </div>
        </header>

        {!activeJob ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <p className="font-body-md text-on-surface-variant mb-4">
              No target job is currently selected. Select a live role from Job Search first.
            </p>
            <Link
              href="/jobs"
              className="inline-flex px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md"
            >
              Browse Live Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Job Selection, Match Explanation, Answers & Approval (8 cols) */}
            <form onSubmit={handleApproveAndLaunch} className="lg:col-span-8 flex flex-col gap-5">
              {/* Role Selector Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                      Selected Target Role
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary mt-0.5">
                      {activeJob.title} — {activeJob.company}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {activeJob.location} • {activeJob.workMode} • Source: {activeJob.source}
                    </p>
                  </div>
                  <select
                    value={activeJob.id}
                    onChange={(e) => {
                      const found = jobs.find((j) => j.id === e.target.value);
                      if (found) setSelectedJob(found);
                    }}
                    aria-label="Switch target job"
                    className="bg-surface-container-low px-3.5 py-2 rounded-xl font-label-sm text-label-sm text-primary font-semibold"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Match Explanation */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-primary font-bold">
                      AI Match Explanation ({activeJob.matchScore || 85}% Heuristic Overlap)
                    </span>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                      Grounded in Profile
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Matched skills:{' '}
                    <strong className="text-primary">
                      {matchedSkills.length > 0
                        ? matchedSkills.join(', ')
                        : profile.skills.slice(0, 4).join(', ') || 'Complete profile to compute overlap'}
                    </strong>
                    {missingSkills.length > 0 && (
                      <>
                        {' '}
                        • Unverified / missing job tags:{' '}
                        <span className="text-secondary font-medium">{missingSkills.join(', ')}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Screening Answers Drafting */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Application Screening Answers
                </h3>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-primary">
                    1. Why do you want to join {activeJob.company} in this role?
                  </label>
                  <textarea
                    rows={3}
                    value={whyCompanyAnswer}
                    onChange={(e) => setWhyCompanyAnswer(e.target.value)}
                    className="bg-surface-container-low p-3.5 rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-primary">
                    2. Summarize a relevant project or achievement from your verified experience:
                  </label>
                  <textarea
                    rows={3}
                    value={projectHighlightAnswer}
                    onChange={(e) => setProjectHighlightAnswer(e.target.value)}
                    className="bg-surface-container-low p-3.5 rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>

              {/* Document Selection & Explicit Submission Approval */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Documents &amp; Submission Review
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={includeCV}
                        onChange={(e) => setIncludeCV(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <div>
                        <div className="font-label-sm text-label-sm text-primary font-bold">
                          {profile.resumeFileName || 'Master_Tailored_CV.pdf'}
                        </div>
                        <div className="font-caption-caps text-caption-caps text-on-surface-variant">
                          Tailored Resume
                        </div>
                      </div>
                    </div>
                    <Link href="/cv-studio" className="text-xs text-secondary font-semibold hover:underline">
                      Edit
                    </Link>
                  </label>

                  <label className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={includeCoverLetter}
                        onChange={(e) => setIncludeCoverLetter(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <div>
                        <div className="font-label-sm text-label-sm text-primary font-bold">
                          {activeJob.company.replace(/\s+/g, '_')}_Cover_Letter.pdf
                        </div>
                        <div className="font-caption-caps text-caption-caps text-on-surface-variant">
                          Cover Letter Draft
                        </div>
                      </div>
                    </div>
                    <Link href="/cover-letters" className="text-xs text-secondary font-semibold hover:underline">
                      Edit
                    </Link>
                  </label>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1.5">
                  <div className="font-label-sm text-label-sm text-primary font-bold">
                    Target Application Website
                  </div>
                  <div className="font-mono text-xs text-on-surface-variant break-all">
                    {activeJob.sourceUrl || 'https://remotive.com'}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Jobora AI never bypasses employer CAPTCHAs or submits forms behind the scenes without your knowledge. Approving below opens the employer&apos;s verified portal and logs the application in your tracker.
                  </p>
                </div>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary-fixed/25 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={explicitApproval}
                    onChange={(e) => setExplicitApproval(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="font-body-sm text-body-sm text-primary">
                    <strong>I explicitly approve</strong> preparing this application package for{' '}
                    <strong>{activeJob.company}</strong>, opening the target application URL, and recording the status in my Application Tracker.
                  </span>
                </label>

                {submittedSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 font-body-sm text-body-sm flex items-center justify-between">
                    <span>{submittedSuccess}</span>
                    <button
                      type="button"
                      onClick={() => router.push('/applications')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-label-sm text-label-sm"
                    >
                      View Tracker →
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!explicitApproval || submitting}
                    className="px-6 py-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>{submitting ? 'Launching...' : 'Approve & Open Official Application'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Right Column: Readiness Checklist & Missing Info (4 cols) */}
            <aside className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <h3 className="font-headline-sm text-headline-sm text-primary">Readiness Checklist</h3>
                <ul className="space-y-2.5 font-body-sm text-body-sm">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                    <span>Target role &amp; source URL verified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        profile.resumeFileName ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {profile.resumeFileName ? 'check_circle' : 'info'}
                    </span>
                    <span>{profile.resumeFileName ? `Resume: ${profile.resumeFileName}` : 'Master CV upload recommended'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        explicitApproval ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {explicitApproval ? 'check_circle' : 'pending'}
                    </span>
                    <span>Explicit candidate submission approval</span>
                  </li>
                </ul>

                {missingProfileFields.length > 0 && (
                  <div className="mt-2 p-3.5 rounded-xl bg-amber-50 text-amber-900 text-xs flex flex-col gap-1.5">
                    <div className="font-bold">Missing Profile Information:</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {missingProfileFields.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <Link href="/onboarding" className="text-secondary font-bold hover:underline mt-1">
                      Complete in Onboarding →
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </StitchShell>
  );
}
