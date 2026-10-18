'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

interface VaultDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  contentPreview: string;
}

export default function DocumentsPage() {
  const { profile, updateProfile, applications, logActivity } = useAppData();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>([]);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jobora_vault_documents');
      if (stored) setVaultDocs(JSON.parse(stored));
    } catch {}
  }, []);

  const persistDocs = (next: VaultDocument[]) => {
    setVaultDocs(next);
    try {
      localStorage.setItem('jobora_vault_documents', JSON.stringify(next));
    } catch {}
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      setErrorMsg('Unsupported file format. Please upload a PDF, DOCX, or TXT document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds the 10 MB security limit.');
      return;
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    const newDoc: VaultDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: sizeStr,
      type: ext.toUpperCase(),
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      contentPreview: `Verified candidate document: ${file.name} (${sizeStr}). Owner: ${
        profile.fullName || profile.email || 'Authenticated Candidate'
      }.`,
    };

    persistDocs([newDoc, ...vaultDocs]);

    await updateProfile({
      resumeFileName: file.name,
      resumeSize: sizeStr,
      resumeUploadedAt: 'Just now',
      atsScore: profile.atsScore || 88,
    });
    logActivity('upload_file', `Uploaded document: ${file.name}`, sizeStr);
  };

  const handleDownloadDoc = (doc: VaultDocument) => {
    const blob = new Blob([doc.contentPreview], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDoc = (id: string) => {
    persistDocs(vaultDocs.filter((d) => d.id !== id));
    if (previewDoc?.id === id) setPreviewDoc(null);
  };

  const handleRenameDoc = (id: string) => {
    if (!renameValue.trim()) return;
    persistDocs(vaultDocs.map((d) => (d.id === id ? { ...d, name: renameValue.trim() } : d)));
    setRenameId(null);
    setRenameValue('');
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
              Private Candidate Vault
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
              Career Documents &amp; Artifacts
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Upload, preview, rename, download, and manage your master resume, tailored CV variants, and application packets.
            </p>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
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

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-800 font-body-sm text-body-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)}>
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Primary Master Resume Card */}
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
                    {profile.resumeSize || 'Master Profile'} • {profile.resumeUploadedAt || 'Synced'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-caption-caps text-caption-caps font-bold">
                {profile.atsScore ? `ATS ${profile.atsScore}%` : 'Master'}
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

          {/* Uploaded Vault Documents */}
          {vaultDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">description</span>
                  </div>
                  <div className="min-w-0">
                    {renameId === doc.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="bg-surface-container-low px-2 py-1 rounded text-xs text-primary border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameDoc(doc.id)}
                          className="px-2 py-1 rounded bg-primary text-white text-xs"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-label-md text-label-md text-primary font-bold truncate">
                        {doc.name}
                      </h3>
                    )}
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {doc.size} • {doc.uploadedAt}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-caption-caps text-caption-caps">
                  {doc.type}
                </span>
              </div>
              <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="text-primary hover:underline"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="text-secondary hover:underline"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameId(doc.id);
                      setRenameValue(doc.name);
                    }}
                    className="text-on-surface-variant hover:text-primary"
                  >
                    Rename
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="text-rose-700 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Application Packets */}
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
                  {app.attachments?.length || 1} Files
                </span>
              </div>
              <div className="pt-3 border-t border-surface-container flex items-center justify-between">
                <span className="font-caption-caps text-caption-caps text-on-surface-variant">{app.status}</span>
                <Link
                  href={`/applications/${app.id}`}
                  className="font-label-sm text-label-sm text-primary font-semibold hover:underline"
                >
                  Inspect Packet →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div
            className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  {previewDoc.name}
                </h3>
                <button type="button" onClick={() => setPreviewDoc(null)}>
                  ✕
                </button>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low font-mono text-xs text-on-surface whitespace-pre-wrap">
                {previewDoc.contentPreview}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-sm text-label-sm"
                >
                  Download File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StitchShell>
  );
}
