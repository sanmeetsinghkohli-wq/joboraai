'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function SettingsPage() {
  const { profile, updateProfile, logActivity } = useAppData();

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
  const [savedNotice, setSavedNotice] = useState(false);

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
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <StitchShell activeNav="settings">
      <div className="flex flex-col w-full py-6 gap-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
              Identity &amp; Preferences
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
              Copilot Profile Settings
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Changes here sync in real time across your CV Studio, Email Composer, and Match Scoring engine.
            </p>
          </div>
          <Link
            href="/settings/integrations"
            className="px-4 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <span>Mailbox Integrations</span>
          </Link>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-5"
        >
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

          <div className="flex items-center justify-between pt-3">
            {savedNotice ? (
              <span className="font-label-md text-label-md text-on-tertiary-fixed-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Profile saved and synced across all pages!
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
      </div>
    </StitchShell>
  );
}
