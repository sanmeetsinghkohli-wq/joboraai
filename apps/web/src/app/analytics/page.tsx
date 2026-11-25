'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/primitives';
import { useAppData, type LiveApplication } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { hasSkill } from '@/lib/match';
import { profileStrength } from '@/lib/profile';
import { APPLICATION_STATUSES, INTERVIEW_OR_BETTER, SENT_STATUSES, normalizeStatus } from '@/lib/status';

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

/** Monday of the week containing a date, as YYYY-MM-DD. */
function weekStart(d: Date): string {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

/** Best date we have for when an application was sent (or added). */
function sentDate(a: LiveApplication): Date | null {
  const raw = a.appliedOn || a.appliedAt;
  if (!raw) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function AnalyticsPage() {
  const { applications, profile, jobs, savedJobIds } = useAppData();

  const data = useMemo(() => {
    const stage = (a: LiveApplication) => normalizeStatus(a.status);
    const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, applications.filter((a) => stage(a) === s).length]));
    const sent = applications.filter((a) => SENT_STATUSES.includes(stage(a)));
    const assessedPlus = sent.filter((a) => ['Assessment', ...INTERVIEW_OR_BETTER].includes(stage(a))).length;
    const interviewed = sent.filter((a) => INTERVIEW_OR_BETTER.includes(stage(a))).length;
    const offers = sent.filter((a) => ['Offer', 'Accepted'].includes(stage(a))).length;

    // Last 8 weeks of sent applications.
    const weeks: Array<{ key: string; label: string; count: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const key = weekStart(d);
      weeks.push({ key, label: new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), count: 0 });
    }
    for (const a of sent) {
      const d = sentDate(a);
      if (!d) continue;
      const w = weeks.find((x) => x.key === weekStart(d));
      if (w) w.count++;
    }

    // Skills the roles you saved or tracked ask for that your profile lacks.
    const relevantIds = new Set([...savedJobIds, ...applications.map((a) => a.jobId)]);
    const relevantJobs = jobs.filter((j) => relevantIds.has(j.id));
    const missing = new Map<string, number>();
    for (const j of relevantJobs) {
      for (const s of j.skills || []) {
        if (!hasSkill(profile.skills, s)) missing.set(s, (missing.get(s) || 0) + 1);
      }
    }
    const topMissing = [...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    const byCompany = new Map<string, number>();
    const byLocation = new Map<string, number>();
    for (const a of applications) {
      byCompany.set(a.company, (byCompany.get(a.company) || 0) + 1);
      const loc = (a.location || 'Not set').split(',')[0].trim() || 'Not set';
      byLocation.set(loc, (byLocation.get(loc) || 0) + 1);
    }

    return {
      counts,
      sent: sent.length,
      responseRate: pct(assessedPlus, sent.length),
      interviewRate: pct(interviewed, sent.length),
      offerRate: pct(offers, interviewed),
      interviewed,
      offers,
      weeks,
      thisWeek: weeks[weeks.length - 1].count,
      topMissing,
      relevantJobs: relevantJobs.length,
      byLocation: [...byLocation.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      companies: byCompany.size,
    };
  }, [applications, profile.skills, jobs, savedJobIds]);

  const strength = profileStrength(profile);
  const weekMax = Math.max(1, ...data.weeks.map((w) => w.count));
  const stageMax = Math.max(1, ...Object.values(data.counts));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Career analytics"
        title="How your search is going"
        description="Every number here comes from your own tracker and profile. Nothing is estimated or compared with other people."
      />

      {applications.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="Nothing to measure yet"
            action={<ButtonLink href="/jobs">Find roles to apply for</ButtonLink>}
          >
            Track your applications and this page shows your response rate, interview rate, weekly activity and the
            skills your target roles keep asking for.
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-6">
          <section aria-label="Key rates" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Rate label="Applications sent" value={String(data.sent)} hint={`${data.thisWeek} this week`} />
            <Rate label="Response rate" value={data.responseRate === null ? '—' : `${data.responseRate}%`} hint="Reached assessment or further" />
            <Rate label="Interview rate" value={data.interviewRate === null ? '—' : `${data.interviewRate}%`} hint={`${data.interviewed} of ${data.sent} sent`} />
            <Rate label="Offer rate" value={data.offerRate === null ? '—' : `${data.offerRate}%`} hint={`${data.offers} from ${data.interviewed} interviews`} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card as="section">
              <CardTitle>Applications per week</CardTitle>
              <p className="mt-1 text-sm text-ink-muted">Last 8 weeks, by the date you applied.</p>
              <div className="mt-5 flex h-40 items-end gap-2" role="img" aria-label={`Applications per week: ${data.weeks.map((w) => `${w.label} ${w.count}`).join(', ')}`}>
                {data.weeks.map((w) => (
                  <div key={w.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-xs tabular-nums text-ink-muted">{w.count || ''}</span>
                    <div className="w-full rounded-t-md bg-plum transition-[height] duration-500" style={{ height: `${(w.count / weekMax) * 100}%`, minHeight: w.count ? 4 : 0 }} />
                    <span className="text-[10px] text-ink-subtle">{w.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card as="section">
              <CardTitle>Where your applications are</CardTitle>
              <ul className="mt-4 space-y-3">
                {APPLICATION_STATUSES.map((s) => (
                  <li key={s}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink-muted">{s}</span>
                      <span className="font-semibold tabular-nums text-ink">{data.counts[s]}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-sand">
                      <div
                        className={cn('h-full rounded-full', ['Offer', 'Accepted'].includes(s) ? 'bg-success' : ['Interview', 'Assessment'].includes(s) ? 'bg-coral' : s === 'Rejected' ? 'bg-line' : 'bg-plum')}
                        style={{ width: `${(data.counts[s] / stageMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card as="section" className="lg:col-span-2">
              <CardTitle>Skills your target roles keep asking for</CardTitle>
              <p className="mt-1 text-sm text-ink-muted">
                From the {data.relevantJobs} saved or tracked role{data.relevantJobs === 1 ? '' : 's'} still in the job feed, skills that are not on your profile.
              </p>
              {data.topMissing.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">No gaps found in the roles we can see. Save more roles to sharpen this.</p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {data.topMissing.map(([skill, n]) => (
                    <li key={skill} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm">
                      <span className="font-medium text-ink">{skill}</span>
                      <span className="ml-1.5 text-ink-subtle">× {n}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/career-growth" className="mt-4 inline-block text-sm font-semibold text-plum underline-offset-4 hover:underline">
                Build a roadmap to close these gaps
              </Link>
            </Card>

            <Card as="section">
              <CardTitle>Career readiness</CardTitle>
              <p className="mt-2 font-serif text-4xl tabular-nums text-plum">{strength.score}%</p>
              <p className="text-sm text-ink-muted">Profile strength</p>
              {strength.next && (
                <Link href={`/profile#${strength.next.anchor}`} className="mt-3 inline-block text-sm font-semibold text-plum underline-offset-4 hover:underline">
                  Next: add {strength.next.label.toLowerCase()}
                </Link>
              )}
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-sm font-medium text-ink">Applications by location</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.byLocation.map(([loc, n]) => (
                    <li key={loc} className="flex justify-between">
                      <span className="text-ink-muted">{loc}</span>
                      <span className="tabular-nums text-ink">{n}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-subtle">{data.companies} different companies</p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Rate({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-5 shadow-card">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums text-plum">{value}</p>
      <p className="mt-1 text-xs text-ink-subtle">{hint}</p>
    </div>
  );
}
