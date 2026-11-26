import { extrasStore, usersStore, type JobAlert, type UserExtras } from '../../auth/_lib';
import { kvGetShared, kvList } from '@/lib/db/kv';
import { emailEnabled, escapeHtml, sendEmail } from '@/lib/email';
import { newMatches } from '@/lib/jobAlerts';

type Job = { id: string; title: string; company: string; location: string; description: string; skills: string[]; employmentType?: string; sourceUrl?: string; applicationUrl?: string };

const APP_URL = (process.env.APP_URL || 'https://jobora.vercel.app').replace(/\/$/, '');
const MAX_USERS_PER_RUN = 200;

/** Sends one digest per user with new matches for alerts that have email turned on. */
export async function sendAlertDigests(): Promise<{ users: number; sent: number; skipped: string | null }> {
  if (!emailEnabled()) return { users: 0, sent: 0, skipped: 'RESEND_API_KEY or RESEND_FROM not set' };
  const snap = await kvGetShared<{ jobs: Job[] }>('shared:jobs-snapshot');
  const jobs = snap?.value.jobs ?? [];
  if (!jobs.length) return { users: 0, sent: 0, skipped: 'no job snapshot' };

  const rows = await kvList<{ value: UserExtras }>('extras:', 'value');
  const targets = rows.filter((r) => r.value?.alerts?.some((a) => a.emailEnabled)).slice(0, MAX_USERS_PER_RUN);
  let sent = 0;

  for (const row of targets) {
    const userId = row.key.slice('extras:'.length);
    await usersStore.load(userId);
    const user = usersStore.get(userId) as { email?: string; deleted?: boolean } | undefined;
    if (!user?.email || user.deleted || user.email.endsWith('@example.test')) continue;

    const extras = row.value;
    const sections: Array<{ alert: JobAlert; matches: Job[] }> = [];
    for (const alert of extras.alerts ?? []) {
      if (!alert.emailEnabled) continue;
      const matches = newMatches(jobs, { ...alert, seenIds: [...(alert.emailedIds ?? []), ...alert.seenIds] }).slice(0, 10);
      if (matches.length) sections.push({ alert, matches });
    }
    if (!sections.length) continue;

    const total = sections.reduce((s, x) => s + x.matches.length, 0);
    const link = (j: Job) => j.applicationUrl || j.sourceUrl || `${APP_URL}/jobs?selected=${encodeURIComponent(j.id)}`;
    const html = `<div style="font-family:Arial,sans-serif;color:#2b1d2f;max-width:560px">
<h2 style="color:#4a2350">${total} new role${total === 1 ? '' : 's'} for your Jobora alerts</h2>
${sections
  .map(
    (s) => `<h3 style="margin-bottom:4px">${escapeHtml(s.alert.name)}</h3><ul>${s.matches
      .map((j) => `<li><a href="${escapeHtml(link(j))}">${escapeHtml(j.title)}</a> at ${escapeHtml(j.company)}, ${escapeHtml(j.location)}</li>`)
      .join('')}</ul>`
  )
  .join('')}
<p><a href="${APP_URL}/jobs">Open Jobora</a> to see every match.</p>
<p style="font-size:12px;color:#777">You get this because you turned on email for these alerts. To stop, open Jobs and switch off email on the alert.</p></div>`;
    const text = `${total} new roles for your Jobora alerts\n\n${sections
      .map((s) => `${s.alert.name}\n${s.matches.map((j) => `- ${j.title} at ${j.company}, ${j.location}: ${link(j)}`).join('\n')}`)
      .join('\n\n')}\n\nTo stop these emails, open ${APP_URL}/jobs and switch off email on the alert.`;

    const result = await sendEmail({ to: user.email, subject: `${total} new role${total === 1 ? '' : 's'} for your Jobora alerts`, html, text });
    if (!result.sent) continue;
    sent++;
    const now = new Date().toISOString();
    for (const s of sections) {
      s.alert.emailedIds = [...s.matches.map((j) => j.id), ...(s.alert.emailedIds ?? [])].slice(0, 1000);
      s.alert.lastEmailedAt = now;
    }
    extrasStore.set(userId, extras);
  }
  return { users: targets.length, sent, skipped: null };
}
