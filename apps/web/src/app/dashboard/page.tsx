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
      ? `Extract your verified skills and benchmark them against ${jobs.length} live opportunities.`
      : 'Extract your verified skills and benchmark them against verified career opportunities.';
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
    nextActionTitle = `Prepare for scheduled interview at ${upcomingInterview.company}`;
    nextActionDescription = `Practice mock technical and STAR-method behavioral rounds for ${upcomingInterview.title}.`;
    nextActionCta = 'Open Interview Studio';
    nextActionHref = '/interview';
    nextActionIcon = 'psychology_alt';
  } else if (topJob) {
    nextActionTitle = `Tailor your CV for ${topJob.title} at ${topJob.company}`;
    nextActionDescription = `High fit alignment in ${topJob.location} (${topJob.source}). Review keyword recommendations before applying.`;
    nextActionCta = 'Tailor CV & Apply';
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
    <StitchShell activeNav="dashboard">
      <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6 pb-12">
        {/* Concise Header & Next Best Action Cockpit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#351B32] tracking-tight">
              Good {timeOfDay}{displayFirstName ? `, ${displayFirstName}` : ''}
            </h1>
            <p className="text-sm text-[#7D747D] mt-0.5">
              Targeting <span className="font-medium text-[#351B32]">{profile.targetRole || 'Software & AI Engineering'}</span> • {profile.location || 'Dubai & Remote'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F2] border border-[#EDE5E1] text-xs font-semibold text-[#351B32]">
              <span className="w-2 h-2 rounded-full bg-[#268566]"></span>
              {jobs.length} live matches synced
            </span>
          </div>
        </div>

        {/* Primary Next Action Banner (Calm, Focused, High-Clarity) */}
        <div className="bg-white border border-[#EDE5E1] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#D8C7C0]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6F2] border border-[#EDE5E1] flex items-center justify-center text-[#E76F72] shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[22px]">{nextActionIcon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E76F72]">
                  Priority Recommendation
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#351B32] leading-snug">
                {nextActionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#7D747D] mt-1 max-w-2xl leading-relaxed">
                {nextActionDescription}
              </p>
            </div>
          </div>
          <div className="shrink-0 self-start md:self-center">
            <Link
              href={nextActionHref}
              className="btn-editorial-primary !py-2 !px-4 text-xs font-bold flex items-center gap-2 focus-ring"
            >
              <span>{nextActionCta}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* 3 Useful Summary Metrics (Zero Clutter, Real Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/applications"
            className="editorial-card p-5 group hover:border-[#D8C7C0] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D747D]">
                Active Submissions
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#7D747D] group-hover:text-[#351B32] transition-colors">
                send
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-[#351B32]">
                {activeApplicationsCount}
              </span>
              <span className="text-xs text-[#7D747D]">tracked in pipeline</span>
            </div>
            <p className="text-xs text-[#8A7F88] mt-1 truncate">
              {interviewCount > 0 ? `${interviewCount} in interview rounds` : '0 currently in interview'}
            </p>
          </Link>

          <Link
            href="/onboarding"
            className="editorial-card p-5 group hover:border-[#D8C7C0] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D747D]">
                Profile Readiness
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#7D747D] group-hover:text-[#351B32] transition-colors">
                verified
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-[#351B32]">
                {profileCompletionPct}%
              </span>
              <span className="text-xs text-[#7D747D]">ATS calibrated</span>
            </div>
            <p className="text-xs text-[#8A7F88] mt-1 truncate">
              {profile.skills.length > 0 ? `${profile.skills.length} verified technical skills` : 'Add skills to boost match'}
            </p>
          </Link>

          <Link
            href="/jobs"
            className="editorial-card p-5 group hover:border-[#D8C7C0] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D747D]">
                Live Matches
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#7D747D] group-hover:text-[#351B32] transition-colors">
                travel_explore
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-[#351B32]">
                {jobs.length}
              </span>
              <span className="text-xs text-[#7D747D]">opportunities live</span>
            </div>
            <p className="text-xs text-[#8A7F88] mt-1 truncate">
              UAE, GCC &amp; Global Remote
            </p>
          </Link>
        </div>

        {/* Main Content Area (8 Cols: Recommended Jobs | 4 Cols: Pipeline & Quick Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* LEFT: Recommended Jobs */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#351B32]">
                  Recommended Opportunities
                </h2>
                <p className="text-xs text-[#7D747D] mt-0.5">
                  Algorithmic matches based on your skills and target role
                </p>
              </div>
              <Link
                href="/jobs"
                className="text-xs font-semibold text-[#E76F72] hover:text-[#351B32] flex items-center gap-1 transition-colors"
              >
                <span>View all {jobs.length}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {loadingJobs && topJobs.length === 0 ? (
              <div className="editorial-card p-8 text-center">
                <span className="material-symbols-outlined text-[#E76F72] text-[28px] animate-spin">refresh</span>
                <p className="text-xs text-[#7D747D] mt-2">Loading curated live opportunities...</p>
              </div>
            ) : topJobs.length === 0 ? (
              <div className="editorial-card p-8 text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-[32px] text-[#7D747D]">work_off</span>
                <h3 className="text-sm font-semibold text-[#351B32] mt-2">No matching jobs found</h3>
                <p className="text-xs text-[#7D747D] mt-1 max-w-sm">
                  Adjust your search criteria or target role in settings to view more opportunities.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {topJobs.map((job) => (
                  <article
                    key={job.id}
                    className="editorial-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#D8C7C0] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#E76F72]">{job.company}</span>
                        <span className="text-xs text-[#8A7F88]">• {job.location}</span>
                        {job.matchScore && (
                          <span className="badge-emerald text-[11px] py-0 px-2">
                            {job.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#351B32] truncate">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {(job.skills || []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF6F2] border border-[#EDE5E1] text-[#574B53]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          router.push(`/jobs?selected=${encodeURIComponent(job.id)}`);
                        }}
                        className="btn-editorial-secondary !py-1.5 !px-3 text-xs focus-ring"
                        type="button"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleTailorCV(job)}
                        className="btn-editorial-primary !py-1.5 !px-3 text-xs font-semibold focus-ring"
                        type="button"
                      >
                        Tailor CV
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: Applications Pipeline & Quick Navigation */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            {/* Pipeline Status Summary */}
            <div className="editorial-card p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EDE5E1]">
                <h3 className="font-serif text-sm font-semibold text-[#351B32]">Pipeline Status</h3>
                <Link href="/applications" className="text-[11px] font-semibold text-[#E76F72] hover:underline">
                  Manage →
                </Link>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#574B53] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#351B32]"></span>
                    Submitted / Applied
                  </span>
                  <span className="font-bold text-[#351B32]">
                    {applications.filter((a) => a.status === 'applied').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#574B53] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Screening / Review
                  </span>
                  <span className="font-bold text-[#351B32]">
                    {applications.filter((a) => a.status === 'screen').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#574B53] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E76F72]"></span>
                    Interview Scheduled
                  </span>
                  <span className="font-bold text-[#351B32]">
                    {interviewCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Studio Tools */}
            <div className="editorial-card p-5">
              <h3 className="font-serif text-sm font-semibold text-[#351B32] mb-3 pb-2 border-b border-[#EDE5E1]">
                Career Studio Tools
              </h3>
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/cv-studio"
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[#574B53] hover:bg-[#FAF6F2] hover:text-[#351B32] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#7D747D]">description</span>
                  <span>CV Studio &amp; ATS Diff</span>
                </Link>
                <Link
                  href="/cover-letters"
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[#574B53] hover:bg-[#FAF6F2] hover:text-[#351B32] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#7D747D]">history_edu</span>
                  <span>Cover Letter Generator</span>
                </Link>
                <Link
                  href="/interview"
                  className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-[#574B53] hover:bg-[#FAF6F2] hover:text-[#351B32] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-[#7D747D]">psychology_alt</span>
                    <span>Interview Simulator</span>
                  </div>
                  <span className="text-[11px] text-[#8A7F88]">{interviewCount > 0 ? `${interviewCount} active` : '0 scheduled calls'}</span>
                </Link>
                <Link
                  href="/career-insights"
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[#574B53] hover:bg-[#FAF6F2] hover:text-[#351B32] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#7D747D]">insights</span>
                  <span>Skill Gap Matrix</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity Log */}
            <div className="editorial-card p-5">
              <h3 className="font-serif text-sm font-semibold text-[#351B32] mb-3 pb-2 border-b border-[#EDE5E1]">
                Recent Workspace Activity
              </h3>
              {activities.length === 0 ? (
                <p className="text-xs text-[#7D747D] py-1">
                  Actions like updating your CV, saving roles, or submitting applications will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 3).map((act) => (
                    <div key={act.id} className="text-xs">
                      <p className="font-medium text-[#351B32] leading-snug">{act.title}</p>
                      <span className="text-[11px] text-[#8A7F88]">{act.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </StitchShell>
  );
}
