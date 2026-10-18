import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User, EmailConnection } from '@jobora/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'jobora-dev-secret-change-in-production';

export interface StoredUser extends User {
  passwordHash: string;
  verificationToken?: string | null;
  resetToken?: string | null;
  resetTokenExpires?: number | null;
}

declare global {
  var __jobora_users: Map<string, StoredUser> | undefined;
  var __jobora_email_connections: Map<string, EmailConnection[]> | undefined;
}

export const usersStore: Map<string, StoredUser> = global.__jobora_users || (global.__jobora_users = new Map<string, StoredUser>());
export const emailConnectionsStore: Map<string, EmailConnection[]> = global.__jobora_email_connections || (global.__jobora_email_connections = new Map<string, EmailConnection[]>());

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

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setCookie(res: Response, name: string, value: string, options: { maxAge?: number } = {}) {
  const maxAge = options.maxAge ?? 604800;
  const cookieHeader = `jobora_${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
  res.headers.append('Set-Cookie', cookieHeader);
}

export function clearCookie(res: Response, name: string) {
  const cookieHeader = `jobora_${name}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
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
