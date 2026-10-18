'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function DocumentsPage() {
  const { profile, updateProfile, applications, logActivity } = useAppData();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    await updateProfile({
      resumeFileName: file.name,
      resumeSize: sizeStr,
      resumeUploadedAt: 'Just now',
      atsScore: 96,
    });
    logActivity('upload_file', `Uploaded document: ${file.name}`, sizeStr);
  };

  const primaryResumeName =
    profile.resumeFileName ||
    `${(profile.fullName || 'Candidate').replace(/\s+/g, '_')}_Master_Resume.pdf`;

  return (
    <StitchShell activeNav="documents">
      <div className="flex flex-col w-full py-6 gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
              Encrypted Vault
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
              Career Documents &amp; Artifacts
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Manage your master resume, tailored CV variants, and application attachments.
            </p>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-95 transition-all flex items-center gap-2"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Upload New Document</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-primary font-bold truncate max-w-[200px]">
                    {primaryResumeName}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {profile.resumeSize || '142 KB'} • {profile.resumeUploadedAt || 'Active Master CV'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-caption-caps text-caption-caps font-bold">
                ATS {profile.atsScore || 96}%
              </span>
            </div>
            <div className="pt-3 border-t border-surface-container flex items-center justify-between">
              <span className="font-caption-caps text-caption-caps text-on-surface-variant">Primary Master Resume</span>
              <Link
                href="/cv-studio"
                className="font-label-sm text-label-sm text-secondary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Open in CV Studio</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">folder_shared</span>
                  </div>
                  <div>
                    <h3 className="font-label-md text-label-md text-primary font-bold">
                      {app.company} Application Packet
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {app.title} • {app.appliedAt}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-caption-caps text-caption-caps">
                  {app.attachments?.length || 2} Files
                </span>
              </div>
              <div className="pt-3 border-t border-surface-container flex items-center justify-between">
                <span className="font-caption-caps text-caption-caps text-on-surface-variant">{app.status}</span>
                <Link
                  href="/applications"
                  className="font-label-sm text-label-sm text-primary font-semibold hover:underline"
                >
                  Inspect Packet →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StitchShell>
  );
}
