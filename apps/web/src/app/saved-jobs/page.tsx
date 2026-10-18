'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function SavedJobsPage() {
  const router = useRouter();
  const { jobs, savedJobIds, toggleSavedJob, setSelectedJob } = useAppData();

  const savedJobs = jobs.filter((j) => savedJobIds.includes(j.id));

  return (
    <StitchShell activeNav="saved-jobs">
      <div className="flex flex-col w-full py-6 gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
              Curated Shortlist
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
              Saved Jobs ({savedJobs.length})
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Bookmarked roles synced with your ATS profile and ready for 1-click tailoring.
            </p>
          </div>
          <Link
            href="/jobs"
            className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-95 transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Browse Live Job Feed</span>
          </Link>
        </div>

        {savedJobs.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 shadow-sm flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[30px]">bookmark_add</span>
            </div>
            <div className="max-w-md">
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">No saved roles yet</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Click the bookmark icon on any live job in Job Search or Dashboard to shortlist it here for tailored
                outreach.
              </p>
            </div>
            <Link
              href="/jobs"
              className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm"
            >
              Explore Matched Roles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-headline-sm font-bold">
                        {job.company[0]}
                      </div>
                      <div>
                        <h3 className="font-label-md text-label-md text-primary font-bold">{job.title}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {job.company} • {job.location}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSavedJob(job.id)}
                      className="text-secondary hover:opacity-80 p-1"
                      title="Remove from Saved"
                      type="button"
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        bookmark
                      </span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-caption-caps text-caption-caps font-bold">
                      {job.matchScore || 92}% Match
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-caption-caps text-caption-caps text-on-surface-variant">
                      {job.workMode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-caption-caps text-caption-caps text-on-surface-variant">
                      {job.salaryRange}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">{job.description}</p>
                </div>

                <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      router.push('/cv-studio');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm transition-colors"
                    type="button"
                  >
                    Tailor CV
                  </button>
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      router.push('/email-composer');
                    }}
                    className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Compose Application</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StitchShell>
  );
}
