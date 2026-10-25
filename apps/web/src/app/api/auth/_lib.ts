import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User, EmailConnection } from '@jobora/types';

export const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_SECRET = 'jobora-dev-secret-change-in-production';
export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

if (isProduction && JWT_SECRET === DEFAULT_SECRET) {
  console.warn('[SECURITY WARNING] Jobora AI is running in production with the default development JWT_SECRET. Set JWT_SECRET in environment variables to secure user sessions.');
}

export interface StoredUser extends User {
  passwordHash: string;
  verificationToken?: string | null;
  resetToken?: string | null;
  resetTokenExpires?: number | null;
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

export const usersStore: Map<string, StoredUser> =
  global.__jobora_users || (global.__jobora_users = new Map<string, StoredUser>());
export const emailConnectionsStore: Map<string, EmailConnection[]> =
  global.__jobora_email_connections ||
  (global.__jobora_email_connections = new Map<string, EmailConnection[]>());
export const profilesStore: Map<string, StoredProfileRecord> =
  global.__jobora_profiles || (global.__jobora_profiles = new Map<string, StoredProfileRecord>());
export const applicationsStore: Map<string, any[]> =
  global.__jobora_applications || (global.__jobora_applications = new Map<string, any[]>());
export const resumesStore: Map<string, any> =
  global.__jobora_resumes || (global.__jobora_resumes = new Map<string, any>());
export const savedJobsStore: Map<string, any[]> =
  global.__jobora_saved_jobs || (global.__jobora_saved_jobs = new Map<string, any[]>());

export function generateToken(
  userId: string,
  firstName: string,
  email: string,
  emailVerified: boolean,
  expiresIn: string = '7d'
): string {
  return jwt.sign(
    { sub: userId, firstName, email, emailVerified },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      sub: string;
      firstName: string;
      email: string;
      emailVerified: boolean;
      iat: number;
      exp: number;
    };
  } catch {
    return null;
  }
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
