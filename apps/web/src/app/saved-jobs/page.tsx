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
            <span className="badge-coral uppercase tracking-wider text-[11px] font-bold">
              Curated Shortlist
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#351B32] tracking-tight mt-1">
              Saved Jobs ({savedJobs.length})
            </h1>
            <p className="text-sm text-[#7D747D] mt-1 font-sans">
              Bookmarked roles synced with your ATS profile and ready for 1-click tailoring.
            </p>
          </div>
          <Link
            href="/jobs"
            className="btn-editorial-primary flex items-center gap-2 self-start md:self-auto text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Browse Live Job Feed</span>
          </Link>
        </div>

        {savedJobs.length === 0 ? (
          <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-12 shadow-sm flex flex-col items-center text-center gap-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#E76F72]">
              <span className="material-symbols-outlined text-[30px]">bookmark_add</span>
            </div>
            <div className="max-w-md">
              <h2 className="font-serif text-xl font-bold text-[#351B32]">No saved roles yet</h2>
              <p className="text-sm text-[#7D747D] mt-1.5 leading-relaxed">
                Click the bookmark icon on any live job in Job Search or Dashboard to shortlist it here for tailored
                outreach.
              </p>
            </div>
            <Link
              href="/jobs"
              className="btn-editorial-primary text-xs mt-2"
            >
              Explore Matched Roles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedJobs.map((job) => (
              <div
                key={job.id}
                className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#351B32]/30 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#351B32] text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
                        {job.company[0]}
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-semibold text-[#351B32]">{job.title}</h3>
                        <p className="text-xs text-[#7D747D]">
                          {job.company} • {job.location}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSavedJob(job.id)}
                      className="text-[#E76F72] hover:opacity-80 p-1 rounded-lg focus-ring transition-opacity"
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
                    <span className="badge-emerald text-[11px] font-bold">
                      {job.matchScore || 92}% Match
                    </span>
                    <span className="badge-neutral text-[11px]">
                      {job.workMode}
                    </span>
                    <span className="badge-neutral text-[11px]">
                      {job.salaryRange}
                    </span>
                  </div>

                  <p className="text-xs text-[#5A525A] line-clamp-3 leading-relaxed">{job.description}</p>
                </div>

                <div className="pt-3 border-t border-[#EDE5E1] flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      router.push('/cv-studio');
                    }}
                    className="btn-editorial-secondary text-xs"
                    type="button"
                  >
                    Tailor CV
                  </button>
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      router.push('/email-composer');
                    }}
                    className="btn-editorial-primary text-xs flex items-center gap-1.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Compose</span>
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
