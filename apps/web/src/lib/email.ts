import { SITE } from './site';

/**
 * Transactional email through Resend's HTTP API. Without RESEND_API_KEY it
 * does nothing and reports `sent: false`, so features degrade quietly.
 * RESEND_FROM must be an address on a domain verified in Resend.
 */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);

export async function sendEmail(msg: { to: string; subject: string; html: string; text: string }): Promise<{ sent: boolean; error?: string }> {
  if (!emailEnabled()) return { sent: false, error: 'Email is not configured.' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [msg.to],
      subject: msg.subject.replace(/[\r\n]+/g, ' ').slice(0, 200),
      html: msg.html,
      text: msg.text,
      ...(SITE.contactEmail ? { reply_to: SITE.contactEmail } : {}),
    }),
  });
  return res.ok ? { sent: true } : { sent: false, error: `Resend ${res.status}` };
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
