'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { matchSkills } from '@/lib/match';

export interface LiveJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  regionTag?: string;
  workMode: string;
  employmentType: string;
  salaryRange: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  postedAt: string;
  postedTimestamp?: number;
  sourceUrl: string;
  applicationUrl?: string;
  source: string;
  recruiterEmail?: string;
  recruiterName?: string;
  /** Share of the job's listed skills found in the profile. Undefined when it cannot be computed. */
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

export interface ProviderHealthSummary {
  id: string;
  name: string;
  status: 'ok' | 'degraded' | 'rate_limited' | 'unconfigured' | 'partner_required';
  latencyMs: number | null;
  jobsReturned: number;
  lastSyncedAt: string | null;
  requiresCredentials: boolean;
  configured: boolean;
  gccCoverage: string;
  note?: string;
}

export interface LiveApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  status: string;
  matchScore?: number | null;
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
  /** Free-text work history, written by the user. One role per paragraph. */
  experience: string;
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
  cvDecisions?: Record<string, 'pending' | 'accepted' | 'rejected'>;
  projects: ProfileProject[];
  certifications: ProfileCertification[];
  /** Awards, hackathons, competitions, scholarships, publications. */
  achievements: string[];
  languages: string[];
  industries: string[];
  preferredLocations: string;
  workModes: string[];
  salaryExpectation: string;
  careerGoals: string;
}

export interface ProfileProject {
  name: string;
  description: string;
  tech: string[];
  link: string;
}

export interface ProfileCertification {
  name: string;
  issuer: string;
  year: string;
}

export interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AppDataContextType {
  authStatus: AuthStatus;
  refreshSession: () => Promise<AuthStatus>;
  signOut: () => Promise<void>;
  profile: LiveUserProfile;
  updateProfile: (partial: Partial<LiveUserProfile>) => Promise<void>;
  resetProfileData: () => Promise<void>;
  jobs: LiveJob[];
  loadingJobs: boolean;
  jobsError: string | null;
  jobsSyncedAt: string | null;
  providerStatus: Record<string, 'ok' | 'degraded'>;
  providerDetails: ProviderHealthSummary[];
  restrictedPlatforms: ProviderHealthSummary[];
  refreshJobs: (query?: string, location?: string) => Promise<void>;
  addCustomJob: (job: Partial<LiveJob>) => Promise<LiveJob | null>;
  savedJobIds: string[];
  toggleSavedJob: (jobId: string) => void;
  selectedJob: LiveJob | null;
  setSelectedJob: (job: LiveJob | null) => void;
  applications: LiveApplication[];
  addApplication: (app: Partial<LiveApplication>) => Promise<LiveApplication | null>;
  updateApplicationStatus: (id: string, status: string) => Promise<void>;
  updateApplicationDetails: (id: string, partial: Partial<LiveApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<boolean>;
  activities: ActivityItem[];
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
  experience: '',
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
  cvDecisions: {},
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
  industries: [],
  preferredLocations: '',
  workModes: [],
  salaryExpectation: '',
  careerGoals: '',
};

const KEYS = {
  owner: 'jobora_owner',
  profile: 'jobora_live_profile',
  saved: 'jobora_saved_jobs',
  activities: 'jobora_live_activities',
  applications: 'jobora_live_applications',
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); state still lives in memory */
  }
}

/** Removes every Jobora key so one person's data never shows for the next. */
function clearLocal() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('jobora_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<LiveUserProfile>(DEFAULT_EMPTY_PROFILE);
  const [rawJobs, setRawJobs] = useState<LiveJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobsSyncedAt, setJobsSyncedAt] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<string, 'ok' | 'degraded'>>({});
  const [providerDetails, setProviderDetails] = useState<ProviderHealthSummary[]>([]);
  const [restrictedPlatforms, setRestrictedPlatforms] = useState<ProviderHealthSummary[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<LiveApplication[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const jobsRequested = useRef(false);

  const resetState = useCallback(() => {
    setProfile(DEFAULT_EMPTY_PROFILE);
    setApplications([]);
    setSavedJobIds([]);
    setActivities([]);
    setSelectedJobId(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthStatus> => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = res.ok ? await res.json() : null;

      if (!data?.user) {
        clearLocal();
        resetState();
        setAuthStatus('anonymous');
        return 'anonymous';
      }

      const email: string = data.user.email || '';
      // Cached data belongs to whoever signed in last on this browser.
      if (readLocal<string>(KEYS.owner, '') !== email) {
        clearLocal();
        writeLocal(KEYS.owner, email);
      }

      const cached = readLocal<Partial<LiveUserProfile>>(KEYS.profile, {});
      const server: Partial<LiveUserProfile> & { savedJobIds?: string[] } = data.profile || {};
      const firstName = data.user.firstName || server.firstName || cached.firstName || '';
      const lastName = data.user.lastName || server.lastName || cached.lastName || '';
      const merged: LiveUserProfile = {
        ...DEFAULT_EMPTY_PROFILE,
        ...cached,
        ...server,
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(' '),
        email,
        skills: Array.isArray(server.skills) ? server.skills : Array.isArray(cached.skills) ? cached.skills : [],
      };
      setProfile(merged);
      writeLocal(KEYS.profile, merged);

      const saved = Array.isArray(server.savedJobIds) ? server.savedJobIds : readLocal<string[]>(KEYS.saved, []);
      setSavedJobIds(saved);
      setActivities(readLocal<ActivityItem[]>(KEYS.activities, []));

      try {
        const appsRes = await fetch('/api/applications', { cache: 'no-store' });
        const appsData = appsRes.ok ? await appsRes.json() : null;
        const list: LiveApplication[] =
          Array.isArray(appsData?.applications) && appsData.applications.length > 0
            ? appsData.applications
            : readLocal<LiveApplication[]>(KEYS.applications, []);
        setApplications(list);
        writeLocal(KEYS.applications, list);
      } catch {
        setApplications(readLocal<LiveApplication[]>(KEYS.applications, []));
      }

      setAuthStatus('authenticated');
      return 'authenticated';
    } catch {
      setAuthStatus('anonymous');
      return 'anonymous';
    }
  }, [resetState]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearLocal();
    resetState();
    setRawJobs([]);
    jobsRequested.current = false;
    setAuthStatus('anonymous');
  }, [resetState]);

  const logActivity = useCallback((icon: string, title: string, subtitle: string) => {
    setActivities((prev) => {
      const next = [
        { id: `act-${Date.now()}`, icon, title, subtitle, timestamp: new Date().toISOString() },
        ...prev.slice(0, 49),
      ];
      writeLocal(KEYS.activities, next);
      return next;
    });
  }, []);

  const updateProfile = useCallback(async (partial: Partial<LiveUserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      if (partial.fullName && !partial.firstName) {
        const parts = partial.fullName.trim().split(/\s+/);
        next.firstName = parts[0] || '';
        next.lastName = parts.slice(1).join(' ');
      } else if ((partial.firstName !== undefined || partial.lastName !== undefined) && !partial.fullName) {
        next.fullName = [next.firstName, next.lastName].filter(Boolean).join(' ');
      }
      writeLocal(KEYS.profile, next);
      return next;
    });
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }).catch(() => {});
  }, []);

  const resetProfileData = useCallback(async () => {
    const keepEmail = profile.email;
    const keepName = { firstName: profile.firstName, lastName: profile.lastName, fullName: profile.fullName };
    clearLocal();
    writeLocal(KEYS.owner, keepEmail);
    resetState();
    const blank = { ...DEFAULT_EMPTY_PROFILE, ...keepName, email: keepEmail };
    setProfile(blank);
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...blank, savedJobIds: [] }),
    }).catch(() => {});
  }, [profile.email, profile.firstName, profile.lastName, profile.fullName, resetState]);

  const refreshJobs = useCallback(async (query = '', location = '') => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (location) params.set('location', location);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error(`Job feed returned ${res.status}`);
      const data = await res.json();
      if (data?.syncedAt) setJobsSyncedAt(data.syncedAt);
      if (data?.providerStatus) setProviderStatus(data.providerStatus);
      if (Array.isArray(data?.providerDetails)) setProviderDetails(data.providerDetails);
      if (Array.isArray(data?.restrictedPlatforms)) setRestrictedPlatforms(data.restrictedPlatforms);
      setRawJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch {
      setJobsError('We could not reach the job feeds. Check your connection and try again.');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // Only signed-in pages need the feed; the landing and auth pages never load it.
  useEffect(() => {
    if (authStatus === 'authenticated' && !jobsRequested.current) {
      jobsRequested.current = true;
      refreshJobs();
    }
  }, [authStatus, refreshJobs]);

  // Scores are derived, so they update the moment the profile's skills change.
  const jobs = useMemo<LiveJob[]>(() => {
    const scored = rawJobs.map((job) => {
      const m = matchSkills(job.skills, profile.skills);
      return { ...job, matchScore: m.score, matchedSkills: m.matched, missingSkills: m.missing };
    });
    if (profile.skills.length === 0) return scored;
    return scored
      .map((job, index) => ({ job, index }))
      .sort((a, b) => (b.job.matchScore ?? -1) - (a.job.matchScore ?? -1) || a.index - b.index)
      .map(({ job }) => job);
  }, [rawJobs, profile.skills]);

  const selectedJob = useMemo(
    () => (selectedJobId ? jobs.find((j) => j.id === selectedJobId) || null : null),
    [jobs, selectedJobId]
  );

  const setSelectedJob = useCallback((job: LiveJob | null) => {
    setSelectedJobId(job ? job.id : null);
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
        if (res.ok && data?.job) {
          setRawJobs((prev) => [data.job, ...prev]);
          setSelectedJobId(data.job.id);
          logActivity('work', `Added role: ${data.job.title}`, data.job.company);
          return data.job;
        }
      } catch {
        /* handled by caller via null */
      }
      return null;
    },
    [logActivity]
  );

  const toggleSavedJob = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const next = prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      writeLocal(KEYS.saved, next);
      fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedJobIds: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const storeApplications = useCallback((update: (prev: LiveApplication[]) => LiveApplication[]) => {
    setApplications((prev) => {
      const next = update(prev);
      writeLocal(KEYS.applications, next);
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
        if (res.ok && data?.application) {
          const created: LiveApplication = data.application;
          storeApplications((prev) => (prev.some((a) => a.id === created.id) ? prev : [created, ...prev]));
          if (!data.duplicate) {
            logActivity('send', `Tracked application at ${created.company}`, created.title);
          }
          return created;
        }
      } catch {
        /* handled by caller via null */
      }
      return null;
    },
    [logActivity, storeApplications]
  );

  const patchApplication = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      try {
        const res = await fetch('/api/applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...body }),
        });
        const data = await res.json();
        if (res.ok && data?.application) {
          storeApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
          return;
        }
      } catch {
        /* fall through to local update */
      }
      // The server copy can be missing (it is not durable yet); keep the change locally.
      storeApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...(body as Partial<LiveApplication>) } : a)));
    },
    [storeApplications]
  );

  const updateApplicationStatus = useCallback(
    (id: string, status: string) => patchApplication(id, { status }),
    [patchApplication]
  );

  const updateApplicationDetails = useCallback(
    (id: string, partial: Partial<LiveApplication>) => patchApplication(id, partial),
    [patchApplication]
  );

  const deleteApplication = useCallback(
    async (id: string): Promise<boolean> => {
      await fetch(`/api/applications?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
      storeApplications((prev) => prev.filter((a) => a.id !== id));
      return true;
    },
    [storeApplications]
  );

  const value: AppDataContextType = {
    authStatus,
    refreshSession,
    signOut,
    profile,
    updateProfile,
    resetProfileData,
    jobs,
    loadingJobs,
    jobsError,
    jobsSyncedAt,
    providerStatus,
    providerDetails,
    restrictedPlatforms,
    refreshJobs,
    addCustomJob,
    savedJobIds,
    toggleSavedJob,
    selectedJob,
    setSelectedJob,
    applications,
    addApplication,
    updateApplicationStatus,
    updateApplicationDetails,
    deleteApplication,
    activities,
    logActivity,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
}
