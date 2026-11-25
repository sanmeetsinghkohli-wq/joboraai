/**
 * Gmail integration: Google OAuth (send-only scope), encrypted refresh-token
 * storage and sending a plain-text email from the user's own address.
 *
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and TOKEN_ENCRYPTION_KEY
 * (64 hex characters). Nothing here runs in the browser.
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/app/api/auth/_lib';

export const GMAIL_SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/gmail.send'];

export function gmailConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && encryptionKey());
}

function encryptionKey(): Buffer | null {
  const hex = process.env.TOKEN_ENCRYPTION_KEY || '';
  return /^[0-9a-f]{64}$/i.test(hex) ? Buffer.from(hex, 'hex') : null;
}

/** AES-256-GCM; output is iv.tag.ciphertext in base64url. */
export function encryptSecret(plain: string): string {
  const key = encryptionKey();
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is not set');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}

export function decryptSecret(token: string): string {
  const key = encryptionKey();
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is not set');
  const [iv, tag, enc] = token.split('.').map((p) => Buffer.from(p, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

const stateSecret = () => `${JWT_SECRET}:gmail-oauth`;

export function signState(userId: string): string {
  return jwt.sign({ sub: userId, n: crypto.randomBytes(8).toString('hex') }, stateSecret(), { expiresIn: '10m' });
}

export function verifyState(state: string): string | null {
  try {
    return (jwt.verify(state, stateSecret()) as { sub: string }).sub;
  } catch {
    return null;
  }
}

/** Where Google sends the user back. APP_URL pins it in production. */
export function gmailRedirectUri(requestOrigin: string): string {
  const base = (process.env.APP_URL || requestOrigin).replace(/\/$/, '');
  return `${base}/api/integrations/gmail/callback`;
}

export function authUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      ...body,
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`Google token error (${res.status}): ${data.error || 'unknown'}`);
  return data;
}

export async function exchangeCode(code: string, redirectUri: string) {
  const t = await tokenRequest({ code, redirect_uri: redirectUri, grant_type: 'authorization_code' });
  // The id_token came straight from Google's token endpoint over TLS, so its
  // payload can be read without re-verifying the signature.
  const claims = t.id_token ? JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString('utf8')) : {};
  return {
    refreshToken: t.refresh_token || '',
    accessToken: t.access_token,
    email: String(claims.email || ''),
    canSend: String(t.scope || '').includes('gmail.send'),
  };
}

export async function accessTokenFor(refreshToken: string): Promise<string> {
  return (await tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' })).access_token;
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
  }).catch(() => {});
}

/** Header values may never contain line breaks (header injection). */
const header = (v: string) => v.replace(/[\r\n]+/g, ' ').trim();
const encodeWord = (v: string) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v, 'utf8').toString('base64')}?=`);

export const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;

export function buildMessage(opts: { from: string; to: string; subject: string; body: string; fromName?: string }): string {
  const to = header(opts.to);
  if (!EMAIL_RE.test(to)) throw new Error('Invalid recipient address');
  const from = opts.fromName ? `${encodeWord(header(opts.fromName))} <${header(opts.from)}>` : header(opts.from);
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeWord(header(opts.subject))}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(opts.body.replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n'),
  ];
  return Buffer.from(lines.join('\r\n'), 'utf8').toString('base64url');
}

export async function sendGmail(accessToken: string, raw: string): Promise<string> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gmail send failed (${res.status}): ${data?.error?.message || 'unknown'}`);
  return String(data.id || '');
}
