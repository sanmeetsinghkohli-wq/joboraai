import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PersistentMap, flushPersistence } from '@/lib/db/kv';
import type { User, EmailConnection } from '@jobora/types';

export const isProduction = process.env.NODE_ENV === 'production';
const DEV_ONLY_SECRET = 'jobora-local-development-only';

/**
 * Session signing key. Production refuses to run without a real secret:
 * falling back to a known default would let anyone forge a login.
 */
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('JWT_SECRET must be set in production.');
  }
  return secret || DEV_ONLY_SECRET;
})();

export interface StoredUser extends User {
  passwordHash: string;
  verificationToken?: string | null;
  resetToken?: string | null;
  resetTokenExpires?: number | null;
  /** Bumped on logout; tokens carrying an older version are rejected. */
  tokenVersion?: number;
}

export interface StoredProfileRecord {
  userId: string;
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
  updatedAt: string;
}

declare global {
  var __jobora_users: Map<string, StoredUser> | undefined;
  var __jobora_email_connections: Map<string, EmailConnection[]> | undefined;
  var __jobora_profiles: Map<string, StoredProfileRecord> | undefined;
  var __jobora_applications: Map<string, any[]> | undefined;
  var __jobora_resumes: Map<string, any> | undefined;
  var __jobora_saved_jobs: Map<string, any[]> | undefined;
}

// Each store is cached in memory and persisted to Supabase when it is configured
// (see lib/db/kv.ts). Handlers must `await store.load(...)` before reading and
// `await flushPersistence()` before responding after a write.
const persistent = <V,>(name: string, ns: string): PersistentMap<V> => {
  const g = global as unknown as Record<string, unknown>;
  // Each route bundle gets its own copy of the PersistentMap class, so `instanceof`
  // fails across routes; check the shape instead so all routes share one cache.
  const existing = g[name] as { load?: unknown } | undefined;
  if (typeof existing?.load !== 'function') g[name] = new PersistentMap<V>(ns);
  return g[name] as PersistentMap<V>;
};

export const usersStore = persistent<StoredUser>('__jobora_users', 'user');
export const emailConnectionsStore = persistent<EmailConnection[]>('__jobora_email_connections', 'email');
export const profilesStore = persistent<StoredProfileRecord>('__jobora_profiles', 'profile');
export const applicationsStore = persistent<any[]>('__jobora_applications', 'apps');
export const resumesStore = persistent<any>('__jobora_resumes', 'resume');
export const savedJobsStore = persistent<any[]>('__jobora_saved_jobs', 'saved');
export const userJobsStore = persistent<any[]>('__jobora_user_jobs', 'userjobs');
/** Encrypted Gmail refresh tokens. Never returned to the browser. */
export const gmailTokensStore = persistent<{ enc: string; email: string; connectedAt: string }>('__jobora_gmail_tokens', 'gmailtoken');
/** Emails waiting for the user's approval, and their send history. */
export const outboxStore = persistent<OutboxItem[]>('__jobora_outbox', 'outbox');

export interface OutboxItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  /** Optional link to a tracked application. */
  applicationId?: string;
  kind: 'application' | 'outreach' | 'followup' | 'other';
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  error?: string;
}
export { flushPersistence };

/** Load everything stored for one user in a handful of parallel queries. */
export async function loadUserData(userId: string): Promise<void> {
  await Promise.all([
    usersStore.load(userId),
    profilesStore.load(userId),
    emailConnectionsStore.load(userId),
    applicationsStore.load(userId),
    savedJobsStore.load(userId),
    userJobsStore.load(userId),
    gmailTokensStore.load(userId),
    outboxStore.load(userId),
    resumesStore.loadWhere('userId', userId),
  ]);
}

/**
 * Wraps a route handler so the signed-in user's data is loaded from Supabase
 * before it runs, and every write it made is saved before the response goes out.
 */
export function withUserData<A extends [Request, ...any[]]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    const userId = getAuthenticatedUserId(args[0]);
    if (userId) {
      try {
        await loadUserData(userId);
      } catch (e) {
        console.error('[persistence] load failed', e instanceof Error ? e.message : e);
      }
    }
    try {
      return await handler(...args);
    } finally {
      await flushPersistence();
    }
  };
}


export function generateToken(
  userId: string,
  firstName: string,
  email: string,
  emailVerified: boolean,
  expiresIn: string = '7d'
): string {
  // Login loads the user by email, other routes by id; either record carries the version.
  const ver = (usersStore.get(userId) ?? usersStore.get(email.toLowerCase()))?.tokenVersion ?? 0;
  return jwt.sign(
    { sub: userId, firstName, email, emailVerified, ver },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
}

/**
 * Verifies the signature and expiry, then rejects tokens issued before the
 * user's last logout (their tokenVersion moved on). The user record must be
 * loaded first; handlers wrapped in withUserData always have it.
 */
export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      firstName: string;
      email: string;
      emailVerified: boolean;
      ver?: number;
      iat: number;
      exp: number;
    };
    const user = usersStore.get(payload.sub);
    if (user && (user.tokenVersion ?? 0) !== (payload.ver ?? 0)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Ends every session for this user, on all devices, by moving their token version on. */
export function revokeSessions(userId: string): void {
  const user = usersStore.get(userId);
  if (!user) return;
  const updated = { ...user, tokenVersion: (user.tokenVersion ?? 0) + 1 };
  usersStore.set(user.id, updated);
  usersStore.set(user.email, updated);
}

export function getAuthenticatedUserId(req: Request): string | null {
  const token = getCookie(req, 'access_token') || getCookie(req, 'session');
  if (token) {
    const payload = verifyToken(token);
    if (payload?.sub) return payload.sub;
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.slice(7));
    if (payload?.sub) return payload.sub;
  }
  return null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setCookie(res: Response, name: string, value: string, options: { maxAge?: number; secure?: boolean } = {}) {
  const maxAge = options.maxAge ?? 604800;
  const isSecure = options.secure ?? isProduction;
  const secureFlag = isSecure ? '; Secure' : '';
  const cookieHeader = `jobora_${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secureFlag}`;
  res.headers.append('Set-Cookie', cookieHeader);
}

export function clearCookie(res: Response, name: string) {
  const secureFlag = isProduction ? '; Secure' : '';
  const cookieHeader = `jobora_${name}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureFlag}`;
  res.headers.append('Set-Cookie', cookieHeader);
}

export function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
    const [key, ...val] = cookie.trim().split('=');
    if (key) acc[key] = decodeURIComponent(val.join('='));
    return acc;
  }, {});
  return cookies[`jobora_${name}`] || null;
}
