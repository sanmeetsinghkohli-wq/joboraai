'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData, type LiveJob } from '@/context/AppDataContext';

export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    jobs,
    loadingJobs,
    savedJobIds,
    toggleSavedJob,
    setSelectedJob,
    applications,
    activities,
  } = useAppData();

  const greetingHour = new Date().getHours();
  const timeOfDay = greetingHour < 12 ? 'morning' : greetingHour < 18 ? 'afternoon' : 'evening';
  const displayFirstName = profile.firstName || (profile.fullName ? profile.fullName.split(' ')[0] : '');

  // Calculate real profile completion percentage based on filled fields
  const completionFields = [
    profile.fullName || profile.firstName,
    profile.email,
    profile.targetRole,
    profile.location,
    profile.skills.length > 0 ? 'yes' : '',
    profile.resumeFileName,
    profile.summary,
  ];
  const filledCount = completionFields.filter(Boolean).length;
  const profileCompletionPct = Math.max(20, Math.round((filledCount / completionFields.length) * 100));

  const activeApplicationsCount = applications.length;
  const interviewCount = applications.filter((a) => a.status.toLowerCase().includes('interview')).length;
  const upcomingInterview = applications.find((a) => a.status.toLowerCase().includes('interview'));

  const handleTailorCV = (job: LiveJob) => {
    setSelectedJob(job);
    router.push(`/cv-studio?jobId=${encodeURIComponent(job.id)}`);
  };

  const handleApply = (job: LiveJob) => {
    setSelectedJob(job);
    router.push(`/email-composer?jobId=${encodeURIComponent(job.id)}`);
  };

  const handlePreviewFit = (job: LiveJob) => {
    setSelectedJob(job);
    router.push(`/jobs?selected=${encodeURIComponent(job.id)}`);
  };

  const topJobs = jobs.slice(0, 4);
  const topJob = jobs.length > 0 ? jobs[0] : null;
  const hasUploadedResume = Boolean(profile.resumeFileName);

  // Compute honest Next Best Action based on real user state
  let nextActionTitle = '';
  let nextActionDescription = '';
  let nextActionCta = '';
  let nextActionHref = '';
  let nextActionIcon = '';

  if (!hasUploadedResume) {
    nextActionTitle = 'Upload your Master CV to calibrate ATS matching';
    nextActionDescription = jobs.length > 0
      ? `Our AI extracts your verified skills and benchmarks them against ${jobs.length} live UAE and global opportunities.`
      : 'Our AI extracts your verified skills and benchmarks them against verified career opportunities.';
    nextActionCta = 'Upload CV in Studio';
    nextActionHref = '/cv-studio';
    nextActionIcon = 'upload_file';
  } else if (savedJobIds.length > 0 && activeApplicationsCount === 0) {
    nextActionTitle = `Stage your application package for ${savedJobIds.length} saved role${savedJobIds.length > 1 ? 's' : ''}`;
    nextActionDescription = 'You have bookmarked opportunities. Tailor your resume bullets and draft custom cover letters before submitting.';
    nextActionCta = 'Review Saved Roles';
    nextActionHref = '/saved-jobs';
    nextActionIcon = 'bookmark';
  } else if (upcomingInterview) {
    nextActionTitle = `Prepare for your scheduled interview at ${upcomingInterview.company}`;
    nextActionDescription = `Practice mock technical and STAR-method behavioral rounds for ${upcomingInterview.title}.`;
    nextActionCta = 'Open Interview Studio';
    nextActionHref = '/interview';
    nextActionIcon = 'psychology_alt';
  } else if (topJob) {
    nextActionTitle = `Tailor your CV for ${topJob.title} at ${topJob.company}`;
    nextActionDescription = `High fit alignment in ${topJob.location} (${topJob.source}). Review keyword recommendations before applying.`;
    nextActionCta = 'Tailor CV & Review Fit';
    nextActionHref = `/cv-studio?jobId=${encodeURIComponent(topJob.id)}`;
    nextActionIcon = 'auto_fix_high';
  } else {
    nextActionTitle = 'Explore live opportunities matching your profile';
    nextActionDescription = jobs.length > 0
      ? `Browse ${jobs.length} verified roles across Dubai, Abu Dhabi, Saudi Arabia, and remote engineering hubs.`
      : 'Browse verified live roles across Dubai, Abu Dhabi, Saudi Arabia, and remote engineering hubs.';
    nextActionCta = 'Browse Live Jobs';
    nextActionHref = '/jobs';
    nextActionIcon = 'travel_explore';
  }

  return (
    <StitchShell activeNav="home-dashboard">
      <div className="flex flex-col w-full">
        {/* Top Greeting & Key Stat Tiles (Editorial Asymmetry) */}
        <section className="mb-space-xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
                  Personalized Copilot
                </span>
                <span className="h-1 w-1 rounded-full bg-secondary"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {profile.location || Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif font-bold">
                Good {timeOfDay}
                {displayFirstName ? `, ${displayFirstName}` : ''}{' '}
                <span className="inline-block transform hover:rotate-12 transition-transform origin-bottom-right cursor-default">
                  👋
                </span>
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Here is your actionable career pipeline, active applications, and curated live opportunities.
              </p>
            </div>
            {/* Live Pipeline Readiness Pill */}
            <div className="flex items-center gap-3 bg-white border border-[#EDE5E1] px-4 py-2.5 rounded-2xl shadow-xs">
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-secondary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  Target Role: {profile.targetRole || 'Software & AI Engineering'}
                </span>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant font-mono">
                  {jobs.length} Live Postings Synced
                </span>
              </div>
            </div>
          </div>

          {/* Personalized Next-Action Hero Banner */}
          <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#351B32] via-[#41223E] to-[#351B32] text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#E76F72]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#E76F72] shrink-0">
                <span className="material-symbols-outlined text-[26px]">{nextActionIcon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-caption-caps text-[10px] uppercase tracking-widest text-[#E76F72] bg-white/10 px-2 py-0.5 rounded-full font-bold">
                    Recommended Next Action
                  </span>
                </div>
                <h2 className="font-headline-sm text-lg sm:text-xl font-bold leading-snug">
                  {nextActionTitle}
                </h2>
                <p className="font-body-sm text-white/80 text-sm mt-1 max-w-2xl">
                  {nextActionDescription}
                </p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-3 shrink-0 self-start md:self-center">
              <Link
                href={nextActionHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E76F72] text-white font-bold text-sm hover:bg-[#d85f62] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <span>{nextActionCta}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Stat Metric Trio Bento */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Applications Metric */}
            <Link
              href="/applications"
              className="md:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-200 border border-[#EDE5E1]"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-[22px]">send</span>
                </div>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-fixed px-2.5 py-1 rounded-full font-bold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>Live Pipeline
                </span>
              </div>
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-hero text-headline-lg font-headline-lg text-primary leading-none font-bold">
                    {activeApplicationsCount}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">Active Submissions</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                  {activeApplicationsCount === 0
                    ? 'No applications sent yet — click any job below to tailor and apply'
                    : `${applications.filter((a) => a.status === 'applied').length} awaiting review, ${applications.filter((a) => a.status === 'interview').length} in interview`}
                </p>
              </div>
            </Link>

            {/* Interviews Metric (Honest State) */}
            <Link
              href="/interview"
              className="md:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-200 border border-[#EDE5E1]"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </div>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-secondary-container bg-secondary-fixed-dim/40 px-2.5 py-1 rounded-full font-bold">
                  <span className="material-symbols-outlined text-[14px]">event</span>
                  {interviewCount > 0 ? 'Active Rounds' : 'On-Demand Prep'}
                </span>
              </div>
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-hero text-headline-lg font-headline-lg text-primary leading-none font-bold">
                    {interviewCount}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">Scheduled Calls</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                  {upcomingInterview
                    ? `${upcomingInterview.company} (${upcomingInterview.title})`
                    : '0 scheduled calls — Practice mock technical & STAR rounds anytime'}
                </p>
              </div>
            </Link>

            {/* Profile Completion Ring Card */}
            <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4 group hover:shadow-md transition-all duration-200 border border-[#EDE5E1]">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Profile Strength
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary mt-1">
                    {profileCompletionPct}% Complete
                  </h3>
                </div>
                <div className="mt-3">
                  <Link
                    className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-secondary hover:text-on-secondary-container transition-colors group/link font-bold"
                    href="/onboarding"
                  >
                    <span>{profileCompletionPct < 100 ? 'Complete your profile' : 'Update preferences'}</span>
                    <span className="material-symbols-outlined text-[16px] group-hover/link:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
              {/* SVG Circular Progress Visualizer */}
              <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Ring */}
                  <path
                    className="text-surface-container-highest stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3.5"
                  ></path>
                  {/* Progress Arc */}
                  <path
                    className="text-secondary stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray={`${profileCompletionPct}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  ></path>
                </svg>
                <span className="absolute font-headline-sm text-label-md text-primary font-bold">
                  {profileCompletionPct}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Body 2-Column Split: Recommended Jobs (8 Cols) vs Insights & Actions (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Recommended Jobs */}
          <section className="lg:col-span-8 flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-3">
                <h2 className="font-headline-md text-headline-md text-primary">Recommended for You</h2>
                <span className="font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full font-bold">
                  {jobs.length} live matches
                </span>
              </div>
              <Link
                className="font-label-md text-label-md text-secondary hover:text-on-secondary-container flex items-center gap-1 font-semibold group"
                href="/jobs"
              >
                <span>View all jobs</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_right_alt
                </span>
              </Link>
            </div>

            {loadingJobs && topJobs.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm text-center">
                <span className="material-symbols-outlined text-secondary text-[32px] animate-spin">refresh</span>
                <p className="font-label-md text-label-md text-primary mt-2">
                  Fetching live job openings from Remotive &amp; Arbeitnow APIs...
                </p>
              </div>
            ) : (
              topJobs.map((job, index) => {
                const isSaved = savedJobIds.includes(job.id);
                if (index === 0) {
                  return (
                    <article
                      key={job.id}
                      className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-container via-secondary to-primary-container"></div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center font-headline-md text-headline-sm text-primary font-bold flex-shrink-0 shadow-sm">
                            {job.company.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors">
                                {job.title}
                              </h3>
                              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-fixed px-2.5 py-0.5 rounded-full font-bold">
                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                {job.matchScore || 92}% match
                              </span>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                              {job.company} • {job.location} • {job.workMode} • {job.employmentType}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSavedJob(job.id)}
                          aria-label="Save Job"
                          className="text-on-surface-variant hover:text-secondary p-2 rounded-lg hover:bg-surface-container transition-colors self-start"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[22px]">
                            {isSaved ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>
                      </div>
                      <div className="mt-4 p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">
                            psychology
                          </span>
                          <div className="text-left">
                            <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
                              AI Fit Analysis
                            </span>
                            <p className="font-body-sm text-body-sm text-primary">
                              Strong alignment for{' '}
                              <span className="font-bold">
                                {(job.skills || []).slice(0, 3).join(', ') || 'Software Engineering'}
                              </span>
                              . Live posting verified via {job.source}.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {(job.skills || []).slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="font-caption-caps text-caption-caps bg-surface-container-lowest px-2 py-1 rounded text-on-surface-variant font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-5 pt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-on-surface-variant font-caption-caps text-caption-caps">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          <span>
                            {job.postedAt} • {job.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleTailorCV(job)}
                            className="px-4 py-2 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-1.5 font-bold"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">magic_button</span>Tailor CV
                          </button>
                          <button
                            onClick={() => handleApply(job)}
                            className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all flex items-center gap-2 shadow-sm font-bold"
                            type="button"
                          >
                            <span>Quick Apply</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                  <article
                    key={job.id}
                    className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center font-headline-md text-headline-sm text-primary font-bold flex-shrink-0 shadow-sm">
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors">
                              {job.title}
                            </h3>
                            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-fixed px-2.5 py-0.5 rounded-full font-bold">
                              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                              {job.matchScore || 88}% match
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                            {job.company} • {job.location} • {job.workMode} • {job.employmentType}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSavedJob(job.id)}
                        aria-label="Save Job"
                        className="text-on-surface-variant hover:text-secondary p-2 rounded-lg hover:bg-surface-container transition-colors self-start"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {isSaved ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(job.skills || []).slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="font-caption-caps text-caption-caps bg-surface-container-low px-2.5 py-1 rounded-lg text-on-surface-variant"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 pt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                        {job.postedAt} • {job.source}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handlePreviewFit(job)}
                          className="px-4 py-2 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors font-semibold"
                          type="button"
                        >
                          Preview Fit
                        </button>
                        <button
                          onClick={() => handleApply(job)}
                          className="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all flex items-center gap-1.5 font-bold"
                          type="button"
                        >
                          <span>Apply</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          {/* RIGHT COLUMN: Quick Actions, Upcoming Interview, Mini Activity */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            {/* Quick Actions Grid */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Quick Actions</h3>
                <span className="material-symbols-outlined text-secondary text-[20px]">bolt</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/onboarding')}
                  className="flex flex-col items-start p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group"
                  type="button"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform mb-2">
                    <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  </div>
                  <span className="font-label-md text-label-md text-primary font-bold">Upload CV</span>
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
                    Parse new version
                  </span>
                </button>
                <button
                  onClick={() => router.push('/cover-letters')}
                  className="flex flex-col items-start p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group"
                  type="button"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary group-hover:scale-105 transition-transform mb-2">
                    <span className="material-symbols-outlined text-[20px]">history_edu</span>
                  </div>
                  <span className="font-label-md text-label-md text-primary font-bold">Cover Letter</span>
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
                    Draft with 1-click
                  </span>
                </button>
                <button
                  onClick={() => router.push('/jobs')}
                  className="flex flex-col items-start p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group"
                  type="button"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform mb-2">
                    <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                  </div>
                  <span className="font-label-md text-label-md text-primary font-bold">Explore Jobs</span>
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
                    Browse live roles
                  </span>
                </button>
                <button
                  onClick={() => router.push('/interview')}
                  className="flex flex-col items-start p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group"
                  type="button"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-tertiary-container group-hover:scale-105 transition-transform mb-2">
                    <span className="material-symbols-outlined text-[20px]">psychology_alt</span>
                  </div>
                  <span className="font-label-md text-label-md text-primary font-bold">Prep Interview</span>
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
                    Mock questions
                  </span>
                </button>
              </div>
            </div>

            {/* Interview Readiness / Scheduled Call Card */}
            <div className="bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary-fixed bg-secondary-fixed-dim/20 px-2.5 py-0.5 rounded-full">
                  {upcomingInterview ? 'Scheduled Interview' : 'Interview Simulator'}
                </span>
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-primary/80">
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  {upcomingInterview ? 'Confirmed' : 'On-Demand'}
                </span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-primary font-bold">
                {upcomingInterview
                  ? `${upcomingInterview.title} • ${upcomingInterview.company}`
                  : `Prep for ${profile.targetRole || 'Target Role'}`}
              </h4>
              <p className="font-body-sm text-body-sm text-on-primary/80 mt-0.5">
                {upcomingInterview
                  ? (upcomingInterview.nextAction || 'Interview round scheduled')
                  : '0 scheduled calls. Practice technical questions & STAR responses anytime.'}
              </p>
              <div className="my-5 p-3.5 rounded-xl bg-surface/10 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-on-primary/10 flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </div>
                  <div>
                    <span className="font-label-md text-label-md text-on-primary block leading-tight font-bold">
                      {upcomingInterview ? 'Next Round Preparation' : 'STAR Method Rubric'}
                    </span>
                    <span className="font-caption-caps text-caption-caps text-on-primary/70">
                      Real-time audio &amp; text simulation
                    </span>
                  </div>
                </div>
                <span className="font-caption-caps text-caption-caps bg-secondary px-2 py-0.5 rounded text-on-secondary font-bold">
                  AI Practice
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  className="flex-1 bg-surface text-primary py-2.5 px-4 rounded-xl font-label-md text-label-md text-center hover:bg-surface-container-lowest transition-colors font-bold shadow-sm flex items-center justify-center gap-2"
                  href="/interview"
                >
                  <span className="material-symbols-outlined text-[18px]">video_call</span>
                  <span>{upcomingInterview ? 'Open Interview Room' : 'Start Mock Session'}</span>
                </Link>
                <button
                  onClick={() => router.push('/interview')}
                  aria-label="Practice Questions"
                  className="p-2.5 rounded-xl bg-surface/10 hover:bg-surface/20 transition-colors text-on-primary"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">quiz</span>
                </button>
              </div>
            </div>

            {/* Recent Copilot Activity Feed */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Recent Activity</h3>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant">Live session</span>
              </div>
              <div className="flex flex-col gap-4">
                {activities.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant py-2">
                    Your real actions (uploading your CV, tailoring bullets, saving or applying to jobs) appear here automatically.
                  </p>
                ) : (
                  activities.slice(0, 4).map((act) => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px]">{act.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body-sm text-body-sm text-primary leading-snug font-bold">{act.title}</p>
                        <span className="font-caption-caps text-caption-caps text-on-surface-variant block mt-1">
                          {act.timestamp} • {act.subtitle}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => router.push('/applications')}
                className="w-full mt-5 py-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-colors text-center font-bold"
                type="button"
              >
                View Application Pipeline ({applications.length})
              </button>
            </div>

            {/* Quick Mentor Tip Micro-card */}
            <div className="bg-surface-container-high/60 rounded-2xl p-5 flex items-start gap-3.5">
              <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">
                tips_and_updates
              </span>
              <div>
                <span className="font-label-sm text-label-sm text-primary font-bold">Copilot Tip</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Select any live job posting on the left and click &ldquo;Tailor CV&rdquo; to align your resume keywords before sending via your connected mailbox.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </StitchShell>
  );
}
