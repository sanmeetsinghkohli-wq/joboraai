'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

const ALL_STATUSES = [
  'Discovered',
  'Saved',
  'Preparing',
  'Ready to Apply',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Closed',
];

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { applications, updateApplicationStatus, deleteApplication } = useAppData();

  const appId = params?.id ? String(params.id) : '';
  const app = applications.find((a) => a.id === appId) || applications[0] || null;

  const handleDelete = async () => {
    if (!app) return;
    await deleteApplication(app.id);
    router.push('/applications');
  };

  return (
    <StitchShell activeNav="applications">
      <div className="flex flex-col w-full py-6 gap-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/applications"
            className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Applications Tracker</span>
          </Link>
          {app && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-label-sm text-label-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Delete Record</span>
            </button>
          )}
        </div>

        {!app ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <h1 className="font-headline-md text-headline-md text-primary mb-2">Application Not Found</h1>
            <p className="font-body-sm text-on-surface-variant mb-4">
              This application record does not exist or has been removed.
            </p>
            <Link
              href="/applications"
              className="inline-flex px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md"
            >
              Return to Tracker
            </Link>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
              <div>
                <span className="font-caption-caps text-caption-caps text-secondary uppercase font-bold">
                  {app.syncChannel}
                </span>
                <h1 className="font-headline-lg text-headline-lg text-primary mt-0.5">
                  {app.title} — {app.company}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {app.location} • Applied {app.appliedAt} • {app.matchScore}% Match
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                  Current Stage
                </label>
                <select
                  value={app.status}
                  onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                  className="bg-surface-container-low px-3.5 py-2 rounded-xl font-label-md text-label-md text-primary font-bold"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Status History &amp; Timeline</h2>
              <div className="space-y-3">
                {(app.timeline || []).map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-container-low flex items-start justify-between gap-4">
                    <div>
                      <div className="font-label-md text-label-md text-primary font-bold">{step.title}</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{step.description}</p>
                    </div>
                    <span className="font-mono text-xs text-on-surface-variant whitespace-nowrap">
                      {step.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </StitchShell>
  );
}
