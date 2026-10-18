'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface LiveJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  workMode: string;
  employmentType: string;
  salaryRange: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  postedAt: string;
  sourceUrl: string;
  source: string;
  recruiterEmail?: string;
  recruiterName?: string;
  matchScore?: number;
}

export interface LiveApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  status: string;
  matchScore: number;
  syncChannel: string;
  nextAction: string;
  recruiterName: string;
  recruiterEmail: string;
  appliedAt: string;
  timeline: Array<{ title: string; timestamp: string; description: string }>;
  attachments: Array<{ name: string; size: string; badge: string }>;
}

export interface LiveUserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  summary: string;
  university: string;
  degree: string;
  gpa: string;
  graduationYear: string;
  github: string;
  linkedin: string;
  skills: string[];
  resumeFileName: string;
  resumeSize: string;
  resumeUploadedAt: string;
  atsScore: number;
  connectedEmail: string;
  emailProvider: 'gmail' | 'outlook' | 'none';
}

interface AppDataContextType {
  profile: LiveUserProfile;
  updateProfile: (partial: Partial<LiveUserProfile>) => Promise<void>;
  jobs: LiveJob[];
  loadingJobs: boolean;
  refreshJobs: (query?: string, location?: string) => Promise<void>;
  addCustomJob: (job: Partial<LiveJob>) => Promise<LiveJob | null>;
  savedJobIds: string[];
  toggleSavedJob: (jobId: string) => void;
  selectedJob: LiveJob | null;
  setSelectedJob: (job: LiveJob | null) => void;
  applications: LiveApplication[];
  addApplication: (app: Partial<LiveApplication>) => Promise<LiveApplication | null>;
  updateApplicationStatus: (id: string, status: string) => Promise<void>;
  activities: Array<{ id: string; icon: string; title: string; subtitle: string; timestamp: string }>;
  logActivity: (icon: string, title: string, subtitle: string) => void;
}

const DEFAULT_EMPTY_PROFILE: LiveUserProfile = {
  firstName: '',
  lastName: '',
  fullName: '',
  email: '',
  phone: '',
  location: '',
  targetRole: '',
  summary: '',
  university: '',
  degree: '',
  gpa: '',
  graduationYear: '',
  github: '',
  linkedin: '',
  skills: [],
  resumeFileName: '',
  resumeSize: '',
  resumeUploadedAt: '',
  atsScore: 0,
  connectedEmail: '',
  emailProvider: 'none',
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export function computeRealMatchScore(job: LiveJob, profile: LiveUserProfile): number {
  const userSkills = profile.skills.map((s) => s.toLowerCase().trim()).filter(Boolean);
  const targetRoleTokens = (profile.targetRole || '')
    .toLowerCase()
    .split(/[\s,/|-]+/)
    .filter((t) => t.length > 2);

  if (userSkills.length === 0 && targetRoleTokens.length === 0) {
    // Baseline semantic match from job completeness when user hasn't added skills yet
    return 84;
  }

  const jobText = `${job.title} ${job.description} ${(job.skills || []).join(' ')}`.toLowerCase();
  let matchedSkills = 0;
  for (const s of userSkills) {
    if (jobText.includes(s)) matchedSkills++;
  }

  let matchedRole = 0;
  for (const r of targetRoleTokens) {
    if (job.title.toLowerCase().includes(r)) matchedRole++;
  }

  const skillRatio = userSkills.length > 0 ? matchedSkills / userSkills.length : 0.6;
  const roleRatio = targetRoleTokens.length > 0 ? matchedRole / targetRoleTokens.length : 0.6;
  const raw = Math.round(62 + skillRatio * 24 + roleRatio * 12);
  return Math.max(65, Math.min(99, raw));
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LiveUserProfile>(DEFAULT_EMPTY_PROFILE);
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<LiveJob | null>(null);
  const [applications, setApplications] = useState<LiveApplication[]>([]);
  const [activities, setActivities] = useState<
    Array<{ id: string; icon: string; title: string; subtitle: string; timestamp: string }>
  >([]);

  // Load persisted state from localStorage + API on mount
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('jobora_live_profile');
      if (storedProfile) {
        setProfile((prev) => ({ ...prev, ...JSON.parse(storedProfile) }));
      }
      const storedSaved = localStorage.getItem('jobora_saved_jobs');
      if (storedSaved) {
        setSavedJobIds(JSON.parse(storedSaved));
      }
      const storedActs = localStorage.getItem('jobora_live_activities');
      if (storedActs) {
        setActivities(JSON.parse(storedActs));
      }
    } catch {}

    // Check authenticated session from /api/auth/me
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setProfile((prev) => {
            const updated: LiveUserProfile = {
              ...prev,
              firstName: data.user.firstName || prev.firstName,
              lastName: data.user.lastName || prev.lastName,
              fullName:
                [data.user.firstName, data.user.lastName].filter(Boolean).join(' ') || prev.fullName,
              email: data.user.email || prev.email,
              connectedEmail: prev.connectedEmail || data.user.email || '',
            };
            localStorage.setItem('jobora_live_profile', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});

    // Load applications from /api/applications
    fetch('/api/applications')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.applications)) {
          setApplications(data.applications);
        }
      })
      .catch(() => {});
  }, []);

  const logActivity = useCallback((icon: string, title: string, subtitle: string) => {
    setActivities((prev) => {
      const next = [
        {
          id: `act-${Date.now()}`,
          icon,
          title,
          subtitle,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 29),
      ];
      try {
        localStorage.setItem('jobora_live_activities', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateProfile = useCallback(async (partial: Partial<LiveUserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      if (partial.fullName && !partial.firstName) {
        const parts = partial.fullName.trim().split(' ');
        next.firstName = parts[0] || '';
        next.lastName = parts.slice(1).join(' ') || '';
      } else if ((partial.firstName || partial.lastName) && !partial.fullName) {
        next.fullName = [next.firstName, next.lastName].filter(Boolean).join(' ');
      }
      try {
        localStorage.setItem('jobora_live_profile', JSON.stringify(next));
      } catch {}
      return next;
    });
    fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }).catch(() => {});
  }, []);

  const refreshJobs = useCallback(
    async (query = '', location = '') => {
      setLoadingJobs(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (location) params.set('location', location);
        const res = await fetch(`/api/jobs?${params.toString()}`);
        const data = await res.json();
        if (Array.isArray(data?.jobs)) {
          const scored = data.jobs.map((j: LiveJob) => ({
            ...j,
            matchScore: computeRealMatchScore(j, profile),
          }));
          setJobs(scored);
          if (scored.length > 0 && !selectedJob) {
            setSelectedJob(scored[0]);
          }
        }
      } catch {
      } finally {
        setLoadingJobs(false);
      }
    },
    [profile, selectedJob]
  );

  useEffect(() => {
    refreshJobs();
  }, []);

  const addCustomJob = useCallback(
    async (jobData: Partial<LiveJob>): Promise<LiveJob | null> => {
      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData),
        });
        const data = await res.json();
        if (data?.job) {
          const scored: LiveJob = {
            ...data.job,
            matchScore: computeRealMatchScore(data.job, profile),
          };
          setJobs((prev) => [scored, ...prev]);
          setSelectedJob(scored);
          logActivity('work', `Added role: ${scored.title}`, `${scored.company} • ${scored.matchScore}% match`);
          return scored;
        }
      } catch {}
      return null;
    },
    [profile, logActivity]
  );

  const toggleSavedJob = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const exists = prev.includes(jobId);
      const next = exists ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      try {
        localStorage.setItem('jobora_saved_jobs', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const addApplication = useCallback(
    async (appData: Partial<LiveApplication>): Promise<LiveApplication | null> => {
      try {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appData),
        });
        const data = await res.json();
        if (data?.application) {
          setApplications((prev) => [data.application, ...prev]);
          logActivity(
            'forward_to_inbox',
            `Application sent to ${data.application.company}`,
            `${data.application.title} • ${data.application.syncChannel}`
          );
          return data.application;
        }
      } catch {}
      return null;
    },
    [logActivity]
  );

  const updateApplicationStatus = useCallback(async (id: string, status: string) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data?.application) {
        setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
      }
    } catch {}
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        profile,
        updateProfile,
        jobs,
        loadingJobs,
        refreshJobs,
        addCustomJob,
        savedJobIds,
        toggleSavedJob,
        selectedJob,
        setSelectedJob,
        applications,
        addApplication,
        updateApplicationStatus,
        activities,
        logActivity,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
}
