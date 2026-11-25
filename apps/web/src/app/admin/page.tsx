'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card, Notice, PageHeader, Skeleton } from '@/components/ui/primitives';
import { APPLICATION_STATUSES, normalizeStatus } from '@/lib/status';

interface Stats {
  generatedAt: string;
  accounts: number;
  signupsByWeek: Array<{ week: string; count: number }>;
  applications: number;
  activeTrackers: number;
  stages: Record<string, number>;
  emailsSent: number;
  emailsPending: number;
  gmailConnected: number;
  alerts: number;
  interviewAnswers: number;
}

/** Aggregate product numbers for allowlisted admins. Shows no personal data. */
export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.ok) setStats(d);
        else setError(r.status === 404 ? 'This page is only available to Jobora admins.' : d?.error?.message || 'Could not load the numbers.');
      })
      .catch(() => setError('Could not load the numbers.'));
  }, []);

  const stages: Record<string, number> = {};
  for (const [s, n] of Object.entries(stats?.stages ?? {})) {
    const k = normalizeStatus(s);
    stages[k] = (stages[k] || 0) + n;
  }
  const weekMax = Math.max(1, ...(stats?.signupsByWeek ?? []).map((w) => w.count));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Product numbers"
        description="Totals across all accounts, excluding test accounts. No names, emails or documents are shown here."
      />
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Totals">
            {[
              ['Accounts', stats.accounts],
              ['Applications tracked', stats.applications],
              ['People tracking roles', stats.activeTrackers],
              ['Emails sent via Gmail', stats.emailsSent],
              ['Emails awaiting approval', stats.emailsPending],
              ['Gmail connected', stats.gmailConnected],
              ['Job alerts', stats.alerts],
              ['Practice answers scored', stats.interviewAnswers],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <p className="text-sm text-ink-muted">{label}</p>
                <p className="font-serif text-3xl text-plum tabular-nums">{value}</p>
              </Card>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-serif text-xl text-plum">Sign-ups by week (last 12 weeks)</h2>
              {stats.signupsByWeek.length === 0 ? (
                <p className="text-sm text-ink-muted">No sign-ups in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.signupsByWeek.map((w) => (
                    <li key={w.week} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-ink-muted">{w.week}</span>
                      <span className="h-2 rounded-full bg-plum" style={{ width: `${(w.count / weekMax) * 70}%` }} />
                      <span className="tabular-nums text-ink">{w.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="mb-4 font-serif text-xl text-plum">Applications by stage</h2>
              <ul className="space-y-2 text-sm">
                {APPLICATION_STATUSES.map((s) => (
                  <li key={s} className="flex justify-between">
                    <span className="text-ink">{s}</span>
                    <span className="tabular-nums text-ink-muted">{stages[s] || 0}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <p className="text-xs text-ink-subtle">Updated {new Date(stats.generatedAt).toLocaleString()}.</p>
        </div>
      )}
    </AppShell>
  );
}
