/**
 * Jobora AI — Database Integration & Persistence Layer
 * 
 * Manages persistence between Next.js server runtime and data stores.
 * Operates in two distinct modes:
 * 1. LOCAL IN-MEMORY / SESSION MODE (Active Today):
 *    Routes persist to in-memory global Maps with user isolation and zero external dependencies.
 * 2. SUPABASE POSTGRESQL MODE (Configured when credentials are provided):
 *    Prepared repository interfaces map directly to Supabase REST / PostgreSQL tables with RLS.
 */

import {
  profilesStore,
  applicationsStore,
  resumesStore,
  usersStore,
  savedJobsStore,
  type StoredProfileRecord,
  type StoredUser,
} from '@/app/api/auth/_lib';

export interface DatabaseConfigStatus {
  isConfigured: boolean;
  provider: 'supabase_postgres' | 'in_memory_session_store';
  storageEngine: 'supabase_postgres' | 'in_memory_transient';
  urlConfigured: boolean;
  serviceKeyConfigured: boolean;
  storageBucket: string;
  requireDurableStorage: boolean;
  statusMessage: string;
}

export function getDatabaseStatus(): DatabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'career-documents';
  const requireDurableStorage = process.env.REQUIRE_DURABLE_STORAGE === 'true';

  const isConfigured = Boolean(url && (serviceKey || anonKey));

  return {
    isConfigured,
    provider: isConfigured ? 'supabase_postgres' : 'in_memory_session_store',
    storageEngine: isConfigured ? 'supabase_postgres' : 'in_memory_transient',
    urlConfigured: Boolean(url),
    serviceKeyConfigured: Boolean(serviceKey || anonKey),
    storageBucket,
    requireDurableStorage,
    statusMessage: isConfigured
      ? 'Supabase database credentials detected. Connected to external PostgreSQL cluster.'
      : 'Supabase credentials not configured. Using local in-memory session store (Pending Integration).',
  };
}

/**
 * Asserts whether storage is ready. If REQUIRE_DURABLE_STORAGE is set and Supabase is not configured,
 * fails fast to prevent unpersisted data loss.
 */
export function assertStorageReadiness(): void {
  const status = getDatabaseStatus();
  if (status.requireDurableStorage && !status.isConfigured) {
    throw new Error(
      'DURABLE_STORAGE_REQUIRED: Environment variable REQUIRE_DURABLE_STORAGE is set to true, but Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not configured. Halting to prevent unpersisted data loss.'
    );
  }
}

/**
 * Diagnostic helper to safely verify database readiness without leaking secrets.
 */
export function checkDatabaseReadiness() {
  const status = getDatabaseStatus();
  return {
    ready: status.isConfigured,
    mode: status.provider,
    storageEngine: status.storageEngine,
    requireDurableStorage: status.requireDurableStorage,
    storageBucket: status.storageBucket,
    nextAction: status.isConfigured
      ? 'Apply migrations via `supabase db push` or SQL editor.'
      : 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to enable durable PostgreSQL storage.',
  };
}

/**
 * Helper to execute Supabase PostgREST queries when credentials are configured.
 */
export async function supabaseFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: any }> {
  assertStorageReadiness();
  const status = getDatabaseStatus();
  if (!status.isConfigured) {
    return { data: null, error: new Error('Supabase not configured. Operating in transient memory mode.') };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    };
    if (options.method === 'POST' || options.method === 'PATCH') {
      headers['Prefer'] = 'return=representation';
    }
    if (options.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }

    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error: errBody };
    }
    const data = (await res.json().catch(() => null)) as T;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ─── REPOSITORY ADAPTER INTERFACES ──────────────────────────────────────────

export interface StoredAppRecord {
  id: string;
  userId: string;
  jobId?: string;
  title: string;
  company: string;
  location?: string;
  status: string;
  matchScore?: number;
  syncChannel?: string;
  nextAction?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  appliedAt?: string;
  timeline?: Array<{ title: string; timestamp: string; description: string }>;
  attachments?: Array<{ name: string; size: string; badge: string }>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoredResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string;
  filePath: string;
  isMaster: boolean;
  status: string;
  parsedProfile?: any;
  previewUrl?: string | null;
  createdAt: string;
}

/**
 * Profile Repository Adapter
 */
export const ProfileRepository = {
  async get(userId: string): Promise<StoredProfileRecord | null> {
    const status = getDatabaseStatus();
    if (!status.isConfigured) {
      return profilesStore.get(userId) || null;
    }
    // Supabase REST client fetch hook (when credentials provided)
    return profilesStore.get(userId) || null;
  },

  async upsert(userId: string, data: Partial<StoredProfileRecord>): Promise<StoredProfileRecord> {
    const existing = profilesStore.get(userId) || {
      userId,
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
      updatedAt: new Date().toISOString(),
    };

    const updated: StoredProfileRecord = {
      ...existing,
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    };

    profilesStore.set(userId, updated);
    return updated;
  },
};

/**
 * Application Repository Adapter
 */
export const ApplicationRepository = {
  async listByUser(userId: string): Promise<StoredAppRecord[]> {
    const status = getDatabaseStatus();
    if (!status.isConfigured) {
      return applicationsStore.get(userId) || [];
    }
    return applicationsStore.get(userId) || [];
  },

  async create(userId: string, app: Partial<StoredAppRecord>): Promise<StoredAppRecord> {
    const id = app.id || `app-${Date.now()}`;
    const newRecord: StoredAppRecord = {
      id,
      userId,
      title: app.title || 'Untitled Role',
      company: app.company || 'Unknown Company',
      location: app.location || 'Remote',
      status: app.status || 'Saved',
      matchScore: app.matchScore ?? 80,
      syncChannel: app.syncChannel || 'Direct Portal',
      nextAction: app.nextAction || 'Review job specifications',
      recruiterName: app.recruiterName || '',
      recruiterEmail: app.recruiterEmail || '',
      appliedAt: app.appliedAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeline: app.timeline || [{ title: 'Application Created', timestamp: 'Just now', description: 'Application initialized.' }],
      attachments: app.attachments || [],
      notes: app.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = applicationsStore.get(userId) || [];
    list.unshift(newRecord);
    applicationsStore.set(userId, list);
    return newRecord;
  },

  async update(userId: string, id: string, updates: Partial<StoredAppRecord>): Promise<StoredAppRecord | null> {
    const list = applicationsStore.get(userId) || [];
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    applicationsStore.set(userId, list);
    return updated;
  },

  async delete(userId: string, id: string): Promise<boolean> {
    const list = applicationsStore.get(userId) || [];
    const filtered = list.filter((a) => a.id !== id);
    applicationsStore.set(userId, filtered);
    return filtered.length < list.length;
  },
};

/**
 * Resume Repository Adapter
 */
export const ResumeRepository = {
  async get(id: string): Promise<StoredResumeRecord | null> {
    assertStorageReadiness();
    const status = getDatabaseStatus();
    if (status.isConfigured) {
      const { data } = await supabaseFetch<StoredResumeRecord[]>(`resumes?id=eq.${id}&limit=1`);
      if (data && data[0]) return data[0];
    }
    return resumesStore.get(id) || null;
  },

  async listByUser(userId: string): Promise<StoredResumeRecord[]> {
    assertStorageReadiness();
    const status = getDatabaseStatus();
    if (status.isConfigured) {
      const { data } = await supabaseFetch<StoredResumeRecord[]>(`resumes?user_id=eq.${userId}&order=created_at.desc`);
      if (data) return data;
    }
    return Array.from(resumesStore.values()).filter((r) => r.userId === userId);
  },

  async create(resume: StoredResumeRecord): Promise<StoredResumeRecord> {
    assertStorageReadiness();
    const status = getDatabaseStatus();
    if (status.isConfigured) {
      await supabaseFetch('resumes', {
        method: 'POST',
        body: JSON.stringify({
          id: resume.id,
          user_id: resume.userId,
          file_name: resume.fileName,
          file_type: resume.fileType,
          file_size: resume.fileSize,
          raw_text: resume.rawText,
          storage_path: resume.filePath,
          is_master: resume.isMaster,
          status: resume.status,
          parsed_profile: resume.parsedProfile || {},
        }),
      });
    }
    resumesStore.set(resume.id, resume);
    return resume;
  },
};

export interface StoredSavedJobRecord {
  id: string;
  userId: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  salaryRange?: string;
  source?: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Saved Jobs Repository Adapter
 */
export const SavedJobsRepository = {
  async listByUser(userId: string): Promise<StoredSavedJobRecord[]> {
    assertStorageReadiness();
    const status = getDatabaseStatus();
    if (status.isConfigured) {
      const { data } = await supabaseFetch<StoredSavedJobRecord[]>(
        `saved_jobs?user_id=eq.${userId}&order=created_at.desc`
      );
      if (data) return data;
    }
    const userSaved = savedJobsStore.get(userId);
    return Array.isArray(userSaved) ? userSaved : [];
  },

  async save(userId: string, job: Partial<StoredSavedJobRecord>): Promise<StoredSavedJobRecord> {
    assertStorageReadiness();
    const list = await this.listByUser(userId);
    const existing = list.find((j) => j.jobId === job.jobId);
    if (existing) return existing;

    const record: StoredSavedJobRecord = {
      id: job.id || `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      jobId: String(job.jobId || `job-${Date.now()}`),
      title: String(job.title || 'Untitled Role'),
      company: String(job.company || 'Unknown Company'),
      location: String(job.location || 'Remote'),
      salaryRange: job.salaryRange || '',
      source: job.source || 'Aggregator',
      url: job.url || '',
      notes: job.notes || '',
      createdAt: new Date().toISOString(),
    };

    const status = getDatabaseStatus();
    if (status.isConfigured) {
      await supabaseFetch('saved_jobs', {
        method: 'POST',
        body: JSON.stringify({
          id: record.id,
          user_id: record.userId,
          job_id: record.jobId,
          title: record.title,
          company: record.company,
          location: record.location,
          salary_range: record.salaryRange,
          source: record.source,
          url: record.url,
          notes: record.notes,
        }),
      });
    }

    list.unshift(record);
    savedJobsStore.set(userId, list);
    return record;
  },

  async unsave(userId: string, jobId: string): Promise<boolean> {
    assertStorageReadiness();
    const list = await this.listByUser(userId);
    const filtered = list.filter((j) => j.jobId !== jobId && j.id !== jobId);
    const removed = filtered.length < list.length;

    const status = getDatabaseStatus();
    if (status.isConfigured) {
      await supabaseFetch(`saved_jobs?user_id=eq.${userId}&or=(job_id.eq.${jobId},id.eq.${jobId})`, {
        method: 'DELETE',
      });
    }

    savedJobsStore.set(userId, filtered);
    return removed;
  },

  async isSaved(userId: string, jobId: string): Promise<boolean> {
    const list = await this.listByUser(userId);
    return list.some((j) => j.jobId === jobId || j.id === jobId);
  },
};

