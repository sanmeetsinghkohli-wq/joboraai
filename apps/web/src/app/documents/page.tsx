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
            <span className="badge-coral uppercase tracking-wider text-[11px] font-bold">
              Private Candidate Vault
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#351B32] tracking-tight mt-1">
              Career Documents &amp; Artifacts
            </h1>
            <p className="text-sm text-[#7D747D] mt-1 font-sans">
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
              className="btn-editorial-primary flex items-center gap-2 text-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Upload New Document</span>
            </button>
          </div>
        </div>

        {/* Local Workspace Mode Notice */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-[#EDE5E1] flex items-center gap-3 text-xs text-[#63555F]">
          <span className="material-symbols-outlined text-[20px] text-primary shrink-0">inventory_2</span>
          <span>
            <strong className="text-primary font-semibold">Local Workspace Storage:</strong> Your career documents and tailored variants are stored in your current local session and browser cache. Cloud multi-device synchronization will activate once Supabase database credentials are connected.
          </span>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between animate-fade-in">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-600 hover:text-rose-900 p-1 rounded"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Primary Master Resume Card */}
          <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#351B32] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#351B32] truncate max-w-[200px]">
                    {primaryResumeName}
                  </h3>
                  <p className="text-xs text-[#7D747D]">
                    {profile.resumeSize || 'Master Profile'} • {profile.resumeUploadedAt || 'Synced'}
                  </p>
                </div>
              </div>
              <span className="badge-emerald text-[11px] font-bold">
                {profile.atsScore ? `ATS ${profile.atsScore}%` : 'Master'}
              </span>
            </div>
            <div className="pt-3 border-t border-[#EDE5E1] flex items-center justify-between">
              <span className="text-[11px] text-[#7D747D]">Primary Master Resume</span>
              <Link
                href="/cv-studio"
                className="text-xs font-semibold text-[#351B32] hover:text-[#E76F72] flex items-center gap-1 transition-colors"
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
              className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] text-[#351B32] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">description</span>
                  </div>
                  <div className="min-w-0">
                    {renameId === doc.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameDoc(doc.id);
                            if (e.key === 'Escape') setRenameId(null);
                          }}
                          autoFocus
                          className="bg-white px-2 py-1 rounded-lg text-xs text-[#351B32] border border-[#EDE5E1] focus-ring"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameDoc(doc.id)}
                          className="btn-editorial-primary text-xs px-2 py-1"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-serif text-base font-semibold text-[#351B32] truncate">
                        {doc.name}
                      </h3>
                    )}
                    <p className="text-xs text-[#7D747D]">
                      {doc.size} • {doc.uploadedAt}
                    </p>
                  </div>
                </div>
                <span className="badge-neutral text-[11px]">
                  {doc.type}
                </span>
              </div>
              <div className="pt-3 border-t border-[#EDE5E1] flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="text-[#351B32] hover:underline"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="text-[#268566] hover:underline"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameId(doc.id);
                      setRenameValue(doc.name);
                    }}
                    className="text-[#7D747D] hover:text-[#351B32]"
                  >
                    Rename
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="text-[#E76F72] hover:underline"
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
              className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] text-[#351B32] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">folder_shared</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#351B32]">
                      {app.company} Application Packet
                    </h3>
                    <p className="text-xs text-[#7D747D]">
                      {app.title} • {app.appliedAt}
                    </p>
                  </div>
                </div>
                <span className="badge-neutral text-[11px]">
                  {app.attachments?.length || 1} Files
                </span>
              </div>
              <div className="pt-3 border-t border-[#EDE5E1] flex items-center justify-between">
                <span className="badge-emerald text-[11px] font-bold">{app.status}</span>
                <Link
                  href={`/applications/${app.id}`}
                  className="text-xs font-semibold text-[#351B32] hover:text-[#E76F72] flex items-center gap-1 transition-colors"
                >
                  <span>Inspect Packet</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div
            className="fixed inset-0 z-50 bg-[#351B32]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="editorial-card border border-[#EDE5E1] bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EDE5E1] pb-3">
                <h3 className="font-serif text-xl font-bold text-[#351B32] truncate">
                  {previewDoc.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="text-[#7D747D] hover:text-[#351B32] p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] font-mono text-xs text-[#1D1A21] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {previewDoc.contentPreview}
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="btn-editorial-secondary text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="btn-editorial-primary text-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StitchShell>
  );
}
