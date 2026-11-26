import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, usersStore, withUserData } from '../../auth/_lib';
import { kvEnabled, kvList } from '@/lib/db/kv';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const weekKey = (iso: string) => {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

/**
 * Aggregate counts only. No names, emails or documents leave this route, and
 * only JSON fields needed for counting are read from the database.
 */
async function GET_handler(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  const me = userId ? usersStore.get(userId) : null;
  if (!me || !isAdminEmail(me.email)) return NextResponse.json({ error: { message: 'Not found.' } }, { status: 404 });
  if (!kvEnabled) return NextResponse.json({ error: { message: 'Database is not configured.' } }, { status: 503 });

  const [users, apps, outbox, extras, gmail, events, profiles] = await Promise.all([
    kvList<{ id?: string; createdAt?: string; deleted?: string; email?: string }>('user:', 'id:value->>id,createdAt:value->>createdAt,deleted:value->>deleted,email:value->>email'),
    kvList<{ value: Array<{ status?: string }> }>('apps:', 'value'),
    kvList<{ value: Array<{ status?: string; sentAt?: string }> }>('outbox:', 'value'),
    kvList<{ alerts?: unknown[]; interviews?: unknown[] }>('extras:', 'alerts:value->alerts,interviews:value->interviews'),
    kvList('gmailtoken:', 'connectedAt:value->>connectedAt'),
    kvList<{ at?: string; tag?: string }>('event:', 'at:value->>at,tag:value->>tag', 50000),
    kvList<{ skills?: unknown[]; targetRole?: string }>('profile:', 'skills:value->skills,targetRole:value->>targetRole'),
  ]);

  // Users are stored under both id and email; count each account once, skip deleted
  // markers and test accounts.
  const accounts = new Map<string, string>();
  for (const u of users) {
    if (!u.id || u.deleted === 'true' || (u.email || '').endsWith('@example.test')) continue;
    accounts.set(u.id, u.createdAt || '');
  }

  const signupsByWeek: Record<string, number> = {};
  const now = Date.now();
  for (const created of accounts.values()) {
    if (!created || now - new Date(created).getTime() > 12 * 7 * 86400000) continue;
    const k = weekKey(created);
    signupsByWeek[k] = (signupsByWeek[k] || 0) + 1;
  }

  const stages: Record<string, number> = {};
  let applications = 0;
  let activeTrackers = 0;
  for (const row of apps) {
    const list = Array.isArray(row.value) ? row.value : [];
    if (list.length) activeTrackers++;
    applications += list.length;
    for (const a of list) stages[a.status || 'Unknown'] = (stages[a.status || 'Unknown'] || 0) + 1;
  }

  let emailsSent = 0;
  let emailsPending = 0;
  for (const row of outbox) {
    for (const i of Array.isArray(row.value) ? row.value : []) {
      if (i.status === 'sent') emailsSent++;
      else if (i.status === 'pending') emailsPending++;
    }
  }

  // Funnel events for the last 30 days, counted by name, and CV-check sign-ups by source.
  const since = now - 30 * 86400000;
  const last30: Record<string, number> = {};
  const signupSources: Record<string, number> = {};
  const daily: Record<string, Record<string, number>> = {};
  for (const e of events) {
    const name = e.key.split(':')[1] || 'unknown';
    const t = e.at ? new Date(e.at).getTime() : 0;
    if (t < since) continue;
    last30[name] = (last30[name] || 0) + 1;
    if (name === 'signup') signupSources[e.tag || 'direct'] = (signupSources[e.tag || 'direct'] || 0) + 1;
    const day = (e.at || '').slice(0, 10);
    daily[day] = daily[day] || {};
    daily[day][name] = (daily[day][name] || 0) + 1;
  }
  const profilesReady = profiles.filter((p) => Array.isArray(p.skills) && p.skills.length >= 3 && (p.targetRole || '').trim()).length;

  return NextResponse.json({
    funnel: {
      accounts: accounts.size,
      profilesReady,
      trackingApplications: activeTrackers,
    },
    last30,
    signupSources,
    daily: Object.entries(daily).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14).map(([day, counts]) => ({ day, ...counts })),
    generatedAt: new Date().toISOString(),
    accounts: accounts.size,
    signupsByWeek: Object.entries(signupsByWeek).sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count })),
    applications,
    activeTrackers,
    stages,
    emailsSent,
    emailsPending,
    gmailConnected: gmail.length,
    alerts: extras.reduce((s, e) => s + (Array.isArray(e.alerts) ? e.alerts.length : 0), 0),
    interviewAnswers: extras.reduce((s, e) => s + (Array.isArray(e.interviews) ? e.interviews.length : 0), 0),
  });
}

export const GET = withUserData(GET_handler);
