'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, updateProfile, resetProfileData, applications, savedJobIds, logActivity } = useAppData();

  const [fullName, setFullName] = useState(profile.fullName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [location, setLocation] = useState(profile.location || '');
  const [targetRole, setTargetRole] = useState(profile.targetRole || '');
  const [university, setUniversity] = useState(profile.university || '');
  const [degree, setDegree] = useState(profile.degree || '');
  const [github, setGithub] = useState(profile.github || '');
  const [linkedin, setLinkedin] = useState(profile.linkedin || '');
  const [skillsText, setSkillsText] = useState(profile.skills.join(', '));
  const [notifyJobMatches, setNotifyJobMatches] = useState(true);
  const [notifyFollowUps, setNotifyFollowUps] = useState(true);
  const [requireExplicitApproval, setRequireExplicitApproval] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName || '');
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
    setLocation(profile.location || '');
    setTargetRole(profile.targetRole || '');
    setUniversity(profile.university || '');
    setDegree(profile.degree || '');
    setGithub(profile.github || '');
    setLinkedin(profile.linkedin || '');
    setSkillsText(profile.skills.join(', '));
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await updateProfile({
      firstName,
      lastName,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      targetRole: targetRole.trim(),
      university: university.trim(),
      degree: degree.trim(),
      github: github.trim(),
      linkedin: linkedin.trim(),
      skills,
    });
    logActivity('settings', 'Updated Copilot Profile Settings', `${fullName.trim()} • ${targetRole.trim()}`);
    setSavedNotice('Profile and preferences saved and synced across all pages.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleExportAllData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      savedJobIds,
      applications,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Jobora_Candidate_Data_Export.json';
    a.click();
    URL.revokeObjectURL(url);
    setSavedNotice('Exported complete candidate data archive (.json).');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/auth?tab=login');
  };

  const handleDeleteAccountData = async () => {
    await resetProfileData();
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setConfirmDeleteAccount(false);
    setSavedNotice('All local and session profile data has been wiped.');
  };

  return (
    <StitchShell activeNav="settings">
      <div className="flex flex-col w-full py-6 gap-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
              Identity, AI Governance &amp; Privacy
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
              Copilot Profile &amp; Privacy Settings
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Changes here sync in real time across your CV Studio, Email Composer, AI Copilot, and Match Scoring engine.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/settings/integrations"
              className="px-4 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Mailbox Integrations</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-5"
        >
          <h2 className="font-headline-sm text-headline-sm text-primary">Candidate Profile &amp; Career Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Account Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                type="email"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 000 0000"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Current Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Dubai, United Arab Emirates"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Target Role</label>
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="AI Engineering Intern / ML Engineer"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Degree / Education</label>
              <input
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.S. Computer Science & AI"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">GitHub Profile</label>
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="github.com/username"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">LinkedIn Profile</label>
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/username"
                className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-primary">
              Skills &amp; Technologies (Comma Separated)
            </label>
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="PyTorch, RAG, FastAPI, Docker, AWS, TypeScript"
              className="bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>

          {/* Notification & Automation Permissions */}
          <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
            <h3 className="font-headline-sm text-headline-sm text-primary">
              AI Automation Permissions &amp; Notification Preferences
            </h3>
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
              <div>
                <div className="font-label-md text-label-md text-primary font-bold">
                  Require Explicit Approval Before External Actions
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Never submit external applications or send emails without manual confirmation.
                </div>
              </div>
              <input
                type="checkbox"
                checked={requireExplicitApproval}
                onChange={(e) => setRequireExplicitApproval(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
              <div>
                <div className="font-label-md text-label-md text-primary font-bold">
                  High-Match Role Alerts
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Surface notifications when live Remotive or Arbeitnow roles match your profile.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyJobMatches}
                onChange={(e) => setNotifyJobMatches(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
              <div>
                <div className="font-label-md text-label-md text-primary font-bold">
                  Application Follow-up Reminders
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Remind me to follow up 5 days after logging an application.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyFollowUps}
                onChange={(e) => setNotifyFollowUps(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>

          <div className="flex items-center justify-between pt-3">
            {savedNotice ? (
              <span className="font-label-md text-label-md text-on-tertiary-fixed-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {savedNotice}
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-95 transition-all"
            >
              Save Profile Changes
            </button>
          </div>
        </form>

        {/* Privacy Controls, Data Export & Account Deletion */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            Privacy Controls, Data Export &amp; Account Deletion
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Download a portable JSON archive of your profile, saved jobs, and tracked applications, or permanently wipe your workspace data.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportAllData}
              className="px-4 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export My Data (.JSON)</span>
            </button>

            {confirmDeleteAccount ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 border border-rose-200">
                <span className="font-label-sm text-label-sm text-rose-900">
                  Permanently wipe all profile &amp; application data?
                </span>
                <button
                  type="button"
                  onClick={handleDeleteAccountData}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-label-sm text-label-sm font-bold"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAccount(false)}
                  className="px-3 py-1.5 rounded-lg bg-white text-on-surface font-label-sm text-label-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteAccount(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-label-md text-label-md transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>Delete Account &amp; Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </StitchShell>
  );
}
