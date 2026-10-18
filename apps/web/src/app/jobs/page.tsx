'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData, type LiveJob } from '@/context/AppDataContext';

function JobSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    profile,
    jobs,
    loadingJobs,
    jobsSyncedAt,
    providerStatus,
    providerDetails,
    restrictedPlatforms,
    refreshJobs,
    addCustomJob,
    savedJobIds,
    toggleSavedJob,
    selectedJob,
    setSelectedJob,
    addApplication,
  } = useAppData();

  const [queryInput, setQueryInput] = useState(searchParams?.get('q') || '');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'match' | 'company'>('overview');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showProviderHealthModal, setShowProviderHealthModal] = useState(false);
  const [geminiMatch, setGeminiMatch] = useState<{
    engine: string;
    headline: string;
    alignedSkills: string[];
    missingOrAdjacentSkills: string[];
    locationFit: string;
    tailoringTips: string[];
  } | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [newJobRecruiterEmail, setNewJobRecruiterEmail] = useState('');

  useEffect(() => {
    const q = searchParams?.get('q');
    if (q) {
      setQueryInput(q);
      refreshJobs(q, locationFilter);
    }
    const sel = searchParams?.get('selected');
    if (sel && jobs.length > 0) {
      const found = jobs.find((j) => j.id === sel);
      if (found) setSelectedJob(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, jobs.length]);

  const currentJob: LiveJob | null = selectedJob || (jobs.length > 0 ? jobs[0] : null);

  useEffect(() => {
    if (!currentJob) return;
    let active = true;
    setLoadingMatch(true);
    fetch('/api/jobs/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job: currentJob, profile }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.match) {
          setGeminiMatch(data.match);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingMatch(false);
      });
    return () => {
      active = false;
    };
  }, [currentJob, profile]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshJobs(queryInput, locationFilter);
  };

  const handleLocationChipClick = (locValue: string) => {
    const nextLoc = locationFilter.toLowerCase() === locValue.toLowerCase() ? '' : locValue;
    setLocationFilter(nextLoc);
    refreshJobs(queryInput, nextLoc);
  };

  const handleTailorAndApply = () => {
    if (!currentJob) return;
    setSelectedJob(currentJob);
    setToastMsg(`Aligning your CV for ${currentJob.title} at ${currentJob.company}...`);
    setTimeout(() => {
      router.push(`/cv-studio?jobId=${encodeURIComponent(currentJob.id)}`);
    }, 800);
  };

  const handleQuickApply = async () => {
    if (!currentJob) return;
    const applyLink = currentJob.applicationUrl || currentJob.sourceUrl;
    if (applyLink && (applyLink.startsWith('https://') || applyLink.startsWith('http://'))) {
      window.open(applyLink, '_blank', 'noopener,noreferrer');
    }
    await addApplication({
      jobId: currentJob.id,
      title: currentJob.title,
      company: currentJob.company,
      location: currentJob.location,
      status: 'Applied',
      matchScore: currentJob.matchScore || 85,
      syncChannel: `${currentJob.source} Portal`,
      recruiterName: currentJob.recruiterName || 'Hiring Team',
      recruiterEmail: currentJob.recruiterEmail || '',
    });
    setToastMsg(
      `Opened ${currentJob.company}'s official application portal and recorded this role in your Applications Tracker.`
    );
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleCreateCustomJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobCompany) return;
    await addCustomJob({
      title: newJobTitle,
      company: newJobCompany,
      location: newJobLocation || 'Dubai, United Arab Emirates',
      description: newJobDesc,
      skills: newJobSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      recruiterEmail: newJobRecruiterEmail,
    });
    setShowAddJobModal(false);
    setNewJobTitle('');
    setNewJobCompany('');
    setNewJobLocation('');
    setNewJobDesc('');
    setNewJobSkills('');
    setNewJobRecruiterEmail('');
  };

  const gccFilterChips = [
    { label: 'All Regions', value: '' },
    { label: 'UAE (All)', value: 'UAE' },
    { label: 'Dubai', value: 'Dubai' },
    { label: 'Abu Dhabi', value: 'Abu Dhabi' },
    { label: 'Sharjah', value: 'Sharjah' },
    { label: 'Saudi Arabia', value: 'Saudi Arabia' },
    { label: 'Qatar', value: 'Qatar' },
    { label: 'Remote', value: 'Remote' },
  ];

  return (
    <StitchShell activeNav="job-search">
      <div className="flex flex-col w-full">
        {/* Top Command & Filter Bar */}
        <header className="w-full bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(53,27,50,0.05)] mb-6 flex flex-col gap-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[22px]">
                search
              </span>
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full pl-11 pr-28 py-2.5 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:bg-surface-container-lowest transition-all"
                placeholder="Search UAE, GCC & global roles, companies, or skills..."
                type="text"
              />
              <span className="absolute right-3.5 px-2 py-0.5 rounded bg-surface-container-highest font-caption-caps text-caption-caps text-on-surface-variant">
                {jobs.length} ROLES
              </span>
            </form>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                onClick={() => setShowProviderHealthModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface font-label-md text-label-md whitespace-nowrap"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-600">monitoring</span>
                <span>Source Health &amp; APIs</span>
              </button>
              <button
                onClick={() => setShowAddJobModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-md text-label-md whitespace-nowrap shadow-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Paste Job Description</span>
              </button>
            </div>
          </div>

          {/* UAE & GCC Priority Location Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider flex items-center gap-1 whitespace-nowrap">
              <span className="material-symbols-outlined text-[15px] text-secondary">public</span>
              GCC &amp; Global Filters:
            </span>
            {gccFilterChips.map((chip) => {
              const isActive = locationFilter.toLowerCase() === chip.value.toLowerCase();
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleLocationChipClick(chip.value)}
                  className={`px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Active Provider Health Strip */}
          <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-surface-container">
            <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider">
              Live Feeds:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerStatus.greenhouse_gcc === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>UAE/GCC Employer ATS</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerStatus.remotive === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>Remotive</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerStatus.arbeitnow === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>Arbeitnow</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerStatus.jobicy === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>Jobicy</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerStatus.himalayas === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>Himalayas</span>
            </div>
            {providerStatus.jsearch === 'ok' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>JSearch GCC</span>
              </div>
            )}
            {providerStatus.adzuna === 'ok' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Adzuna</span>
              </div>
            )}
            {jobsSyncedAt && (
              <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                Synced {new Date(jobsSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => {
                setQueryInput('');
                setLocationFilter('');
                refreshJobs('', '');
              }}
              className="font-label-sm text-label-sm text-secondary hover:underline ml-auto"
              type="button"
            >
              Reset &amp; Refresh Live Feed
            </button>
          </div>
        </header>

        {/* Master-Detail Content Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Job Feed Master List (5 cols on lg) */}
          <section aria-label="Available Job Listings" className="lg:col-span-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-primary">Live Matches</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm">
                  {jobs.length} roles
                </span>
              </div>
              <button
                onClick={() => router.push('/onboarding')}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Preferences</span>
              </button>
            </div>

            {loadingJobs && jobs.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
                <span className="material-symbols-outlined text-secondary text-[28px] animate-spin">refresh</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                  Loading live job postings...
                </p>
              </div>
            ) : (
              jobs.map((job) => {
                const isSelected = currentJob?.id === job.id;
                return (
                  <article
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`group relative bg-surface-container-lowest rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'shadow-[0_2px_12px_rgba(53,27,50,0.06)] ring-2 ring-primary/90'
                        : 'shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04)] hover:ring-1 hover:ring-secondary/40 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center p-2 text-primary font-bold text-headline-sm">
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="font-label-md text-label-md text-primary font-bold group-hover:text-secondary transition-colors leading-tight">
                            {job.title}
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span>{job.company}</span>
                            <span className="text-surface-tint">•</span>
                            <span>{job.location}</span>
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm flex items-center gap-1 font-bold whitespace-nowrap">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        {job.matchScore || 88}% match
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-3">
                      {job.description}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface font-caption-caps text-caption-caps uppercase">
                          {job.workMode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface font-caption-caps text-caption-caps uppercase">
                          {job.employmentType}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{job.postedAt}</span>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          {/* RIGHT COLUMN: Inspector / Detailed Job Preview (7 cols on lg) */}
          <div aria-label="Selected Role Details" className="lg:col-span-7 flex flex-col gap-5 sticky top-20">
            {currentJob ? (
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(53,27,50,0.06)] relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-0">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center p-3 text-primary font-bold text-headline-lg shadow-sm">
                      {currentJob.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-headline-md text-headline-md text-primary leading-tight">
                          {currentJob.title}
                        </h1>
                        <span className="px-3 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-[15px]">verified</span>
                          {currentJob.matchScore || 88}% match
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-on-surface">{currentJob.company}</span>
                        <span>•</span>
                        <span>{currentJob.location}</span>
                        <span>•</span>
                        <span className="text-secondary font-medium">{currentJob.workMode}</span>
                      </p>
                    </div>
                  </div>
                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => toggleSavedJob(currentJob.id)}
                      className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors flex items-center justify-center"
                      title="Save Job"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {savedJobIds.includes(currentJob.id) ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                    {currentJob.sourceUrl && (
                      <a
                        href={currentJob.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors flex items-center justify-center"
                        title="Open Original Listing"
                      >
                        <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                      </a>
                    )}
                    <button
                      onClick={handleTailorAndApply}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all shadow-md hover:shadow-lg"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">magic_button</span>
                      <span>Tailor CV &amp; Apply</span>
                    </button>
                  </div>
                </div>

                {/* Detail Tabs Bar */}
                <nav aria-label="Role Sections" className="flex items-center gap-2 pt-2 pb-4 overflow-x-auto">
                  {(['overview', 'requirements', 'match', 'company'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={
                        activeTab === tab
                          ? 'px-4 py-2 rounded-xl bg-surface-container-high text-primary font-label-md text-label-md font-bold capitalize'
                          : 'px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md transition-colors capitalize'
                      }
                      type="button"
                    >
                      {tab === 'match' ? 'AI Match Breakdown' : tab === 'company' ? 'Company & Source' : tab}
                    </button>
                  ))}
                </nav>

                {/* AI Match Insight Callout Card */}
                <div className="my-4 p-4 sm:p-5 rounded-2xl bg-surface-container-low flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-label-md text-label-md font-bold">
                      <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
                      <span>Why you&apos;re a {currentJob.matchScore || 88}% match for this role</span>
                    </div>
                    <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                      {loadingMatch
                        ? 'Analyzing Fit...'
                        : geminiMatch?.engine === 'gemini-2.0-flash'
                        ? 'Gemini 2.0 Flash Match'
                        : 'Profile Match Engine'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    {geminiMatch?.headline ? (
                      geminiMatch.headline
                    ) : profile.skills.length > 0 ? (
                      <>
                        Your profile skills (<strong className="font-semibold text-primary">{profile.skills.slice(0, 4).join(', ')}</strong>) align with{' '}
                        <strong className="font-semibold text-primary">{currentJob.company}</strong>&apos;s technical stack for{' '}
                        <strong className="font-semibold text-primary">{currentJob.title}</strong>.
                      </>
                    ) : (
                      <>
                        Upload your resume in <strong className="font-semibold text-primary">CV Studio</strong> or{' '}
                        <strong className="font-semibold text-primary">Onboarding</strong> to calculate exact skill overlap against{' '}
                        <strong className="font-semibold text-primary">{currentJob.company}</strong>.
                      </>
                    )}
                  </p>
                  {geminiMatch?.locationFit && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {geminiMatch.locationFit}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="flex items-center gap-2 bg-surface-container-lowest p-2.5 rounded-xl">
                      <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                        check_circle
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface leading-tight">
                        Core stack: {(currentJob.skills || []).slice(0, 3).join(', ') || 'Software Engineering'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-lowest p-2.5 rounded-xl">
                      <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                      <span className="font-body-sm text-body-sm text-on-surface leading-tight">
                        Source: {currentJob.source}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Overview Section */}
                <div className="flex flex-col gap-4 mt-6">
                  <div>
                    <h3 className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider mb-2">
                      About The Role
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {currentJob.description}
                    </p>
                  </div>
                  {currentJob.responsibilities && currentJob.responsibilities.length > 0 && (
                    <div>
                      <h3 className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider mb-2">
                        Key Highlights
                      </h3>
                      <ul className="flex flex-col gap-2.5 font-body-md text-body-md text-on-surface-variant">
                        {currentJob.responsibilities.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">
                              check_small
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required Competencies / Tags */}
                  <div>
                    <h3 className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider mb-2.5">
                      Required Competencies &amp; Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(currentJob.skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-xl bg-surface-container text-primary font-label-sm text-label-sm flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Quick Summary Bento */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Type
                      </span>
                      <span className="font-label-md text-label-md text-primary font-bold mt-1">
                        {currentJob.employmentType}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Compensation
                      </span>
                      <span className="font-label-md text-label-md text-primary font-bold mt-1 truncate">
                        {currentJob.salaryRange}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Work Mode
                      </span>
                      <span className="font-label-md text-label-md text-primary font-bold mt-1">
                        {currentJob.workMode}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Posted
                      </span>
                      <span className="font-label-md text-label-md text-primary font-bold mt-1">
                        {currentJob.postedAt}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Sticky Action Bar inside Inspector */}
                  <div className="pt-6 mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md font-bold">
                        {(currentJob.recruiterName || currentJob.company).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-primary font-bold leading-tight">
                          {currentJob.recruiterName || `${currentJob.company} Talent Team`}
                        </span>
                        <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                          {currentJob.source}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleQuickApply}
                        className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-colors"
                        type="button"
                      >
                        1-Click Quick Apply
                      </button>
                      <button
                        onClick={handleTailorAndApply}
                        className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all shadow-md flex items-center gap-2"
                        type="button"
                      >
                        <span>Tailor CV with Jobora AI</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Provider Health & Partner API Transparency Modal */}
        {showProviderHealthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
            <div className="bg-surface-container-lowest max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Job Source Telemetry &amp; Partner API Status
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Real-time health, latency, UAE/GCC coverage, and partner API licensing status.
                  </p>
                </div>
                <button
                  onClick={() => setShowProviderHealthModal(false)}
                  className="text-on-surface-variant hover:text-primary"
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div>
                <h4 className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider mb-2.5">
                  Active &amp; Configurable Job Providers
                </h4>
                <div className="flex flex-col gap-2.5">
                  {providerDetails.map((prov) => (
                    <div
                      key={prov.id}
                      className="p-3.5 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              prov.status === 'ok'
                                ? 'bg-emerald-500'
                                : prov.status === 'unconfigured'
                                ? 'bg-slate-400'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span className="font-label-md text-label-md text-primary font-bold">
                            {prov.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-high font-caption-caps text-caption-caps text-on-surface-variant">
                            {prov.gccCoverage}
                          </span>
                        </div>
                        {prov.note && (
                          <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                            {prov.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                          {prov.jobsReturned} jobs
                        </span>
                        {prov.latencyMs !== null && (
                          <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                            {prov.latencyMs}ms
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm uppercase">
                          {prov.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {restrictedPlatforms.length > 0 && (
                <div>
                  <h4 className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider mb-2.5">
                    Partner-Restricted Platforms (Enterprise Approval Required)
                  </h4>
                  <div className="flex flex-col gap-2">
                    {restrictedPlatforms.map((plat) => (
                      <div
                        key={plat.id}
                        className="p-3 rounded-xl bg-surface-container-low/70 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-primary font-bold">
                            {plat.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container font-caption-caps text-caption-caps text-on-surface-variant">
                            Partner Approval Required
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {plat.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowProviderHealthModal(false)}
                  className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-label-md font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paste Custom Job Modal */}
        {showAddJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
            <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Add Real Job Description
                </h3>
                <button
                  onClick={() => setShowAddJobModal(false)}
                  className="text-on-surface-variant hover:text-primary"
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleCreateCustomJob} className="flex flex-col gap-3">
                <input
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="Job Title (e.g. AI Engineer)"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <input
                  required
                  value={newJobCompany}
                  onChange={(e) => setNewJobCompany(e.target.value)}
                  placeholder="Company Name"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <input
                  value={newJobLocation}
                  onChange={(e) => setNewJobLocation(e.target.value)}
                  placeholder="Location (e.g. Dubai, UAE or Remote)"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <input
                  value={newJobRecruiterEmail}
                  onChange={(e) => setNewJobRecruiterEmail(e.target.value)}
                  placeholder="Recruiter / Application Email (optional)"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <input
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                  placeholder="Skills comma-separated (e.g. Python, PyTorch, Docker)"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <textarea
                  required
                  rows={4}
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddJobModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-label-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-label-md font-bold"
                  >
                    Parse &amp; Add Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Interactive Toast Alert */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 max-w-md bg-inverse-surface text-inverse-on-surface p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50">
            <span className="material-symbols-outlined text-tertiary-fixed text-[24px]">auto_awesome</span>
            <div className="flex flex-col flex-1">
              <span className="font-label-md text-label-md font-bold">Jobora Copilot</span>
              <span className="font-body-sm text-body-sm opacity-80">{toastMsg}</span>
            </div>
            <button
              className="text-inverse-on-surface/60 hover:text-inverse-on-surface"
              onClick={() => setToastMsg(null)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </div>
    </StitchShell>
  );
}

export default function JobSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <JobSearchContent />
    </Suspense>
  );
}
