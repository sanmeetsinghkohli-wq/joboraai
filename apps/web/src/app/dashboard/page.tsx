'use client';

import { useT } from '@/lib/i18n';
import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlarmClock,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Inbox,
  MailCheck,
  Mic,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserRound,
  Wand2,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { JobAlertsBar } from '@/components/JobAlertsBar';
import { WeeklyGoals } from '@/components/WeeklyGoals';
import { ButtonLink } from '@/components/ui/button';
import { Notice, Skeleton } from '@/components/ui/primitives';
import { useAppData, type LiveApplication } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { profileStrength } from '@/lib/profile';
import { getReminders, type Reminder } from '@/lib/reminders';
import { APPLICATION_STATUSES, INTERVIEW_OR_BETTER, SENT_STATUSES, normalizeStatus } from '@/lib/status';

const STAGE_COLOR: Record<string, string> = {
  Interested: 'bg-plum-100',
  Preparing: 'bg-plum-200',
  Applied: 'bg-plum',
  Assessment: 'bg-coral/70',
  Interview: 'bg-coral',
  Offer: 'bg-success/80',
  Accepted: 'bg-success',
  Rejected: 'bg-line',
};

const TOOLS = [
  { href: '/career-ops', label: 'Fit report', icon: ClipboardCheck },
  { href: '/resume-studio', label: 'Tailor CV', icon: Wand2 },
  { href: '/interview', label: 'Practise', icon: Mic },
  { href: '/career-growth', label: 'Roadmap', icon: TrendingUp },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ai-copilot', label: 'Copilot', icon: Sparkles },
];

interface Task {
  key: string;
  title: string;
  detail: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  urgent?: boolean;
}

function sentDate(a: LiveApplication): Date | null {
  const raw = a.appliedOn || a.appliedAt;
  if (!raw) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

const REMINDER_ICON: Record<Reminder['kind'], Task['icon']> = {
  interview: CalendarClock,
  deadline: AlarmClock,
  followup: MailCheck,
};

export default function DashboardPage() {
  const router = useRouter();
  const { profile, jobs, loadingJobs, jobsError, savedJobIds, setSelectedJob, applications, activities } = useAppData();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const strength = profileStrength(profile);

  const stats = useMemo(() => {
    const stage = (a: LiveApplication) => normalizeStatus(a.status);
    const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, applications.filter((a) => stage(a) === s).length]));
    const sent = applications.filter((a) => SENT_STATUSES.includes(stage(a)));
    const interviews = sent.filter((a) => INTERVIEW_OR_BETTER.includes(stage(a))).length;
    // Applications sent per week, last 6 weeks (oldest first) for the trend line.
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const end = new Date();
      end.setDate(end.getDate() - (5 - i) * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return sent.filter((a) => {
        const d = sentDate(a);
        return d && d > start && d <= end;
      }).length;
    });
    return {
      counts,
      sent: sent.length,
      interviews,
      rate: sent.length ? Math.round((interviews / sent.length) * 100) : null,
      weeks,
    };
  }, [applications]);

  const reminders = useMemo(() => getReminders(applications), [applications]);

  const tasks: Task[] = useMemo(() => {
    const list: Task[] = reminders.slice(0, 4).map((r) => ({
      key: `${r.appId}-${r.kind}`,
      title: r.title,
      detail: r.detail,
      href: r.kind === 'interview' ? '/interview' : `/applications/${r.appId}`,
      icon: REMINDER_ICON[r.kind],
      urgent: r.days <= 1,
    }));
    if (strength.next) {
      list.push({
        key: 'profile',
        title: `Add your ${strength.next.label.toLowerCase()}`,
        detail: `Profile ${strength.score}% complete`,
        href: `/profile#${strength.next.anchor}`,
        icon: UserRound,
      });
    }
    const savedNotApplied = savedJobIds.filter((id) => !applications.some((a) => a.jobId === id)).length;
    if (savedNotApplied > 0) {
      list.push({
        key: 'saved',
        title: `Review ${savedNotApplied} saved role${savedNotApplied === 1 ? '' : 's'}`,
        detail: 'Check your fit and apply while they are open',
        href: '/jobs?view=saved',
        icon: Bookmark,
      });
    }
    if (stats.sent === 0 && applications.length === 0) {
      list.push({ key: 'first', title: 'Find your first roles', detail: 'Browse live jobs that match your skills', href: '/jobs', icon: Search });
    }
    return list.slice(0, 5);
  }, [reminders, strength, savedJobIds, applications, stats.sent]);

  const next = tasks[0];
  const topJobs = jobs.slice(0, 5);
  const totalTracked = applications.length;

  return (
    <AppShell>
      {/* Hero band: greeting, next step, profile ring */}
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#2A1728_0%,#3E1F38_55%,#4A2A46_100%)] p-6 text-[#F8F5F0] shadow-raised sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#E05347]/25 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-sm text-[#EDE2EB]">{today}</p>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl">
              {greeting}
              {profile.firstName ? `, ${profile.firstName}` : ''}
            </h1>
            <p className="mt-1 text-sm text-[#D9C4D5]">
              {profile.targetRole
                ? `Looking for ${profile.targetRole}${profile.location ? ` in ${profile.location}` : ''}`
                : 'Set your target role and Jobora tailors everything to it.'}
            </p>
            {next && (
              <Link
                href={next.href}
                className="group mt-5 inline-flex max-w-full items-center gap-3 rounded-xl bg-[#F8F5F0]/10 px-4 py-3 ring-1 ring-[#F8F5F0]/15 transition-colors hover:bg-[#F8F5F0]/15"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E05347] text-white">
                  <next.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F6C6C5]">Next step</span>
                  <span className="block truncate font-medium">{next.title}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}
          </div>
          <Link href="/profile" className="flex items-center gap-4 md:flex-col md:gap-2" aria-label={`Profile ${strength.score}% complete`}>
            <ProgressRing value={strength.score} />
            <span className="text-sm text-[#EDE2EB] md:text-center">
              Profile strength
              {strength.next && <span className="block text-xs text-[#D9C4D5]">Next: {strength.next.label.toLowerCase()}</span>}
            </span>
          </Link>
        </div>
      </section>

      {/* Key numbers */}
      <section aria-label="Your numbers" className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Applications sent" value={stats.sent} icon={Send}>
          <Sparkline values={stats.weeks} />
        </Kpi>
        <Kpi label="Interviews" value={stats.interviews} icon={Mic} hint={stats.interviews ? 'Including offers' : 'None yet'} />
        <Kpi label="Interview rate" value={stats.rate === null ? '—' : `${stats.rate}%`} icon={TrendingUp} hint={stats.rate === null ? 'Shows once you apply' : `${stats.interviews} of ${stats.sent} sent`} />
        <Kpi label="Saved roles" value={savedJobIds.length} icon={Bookmark} hint={`${jobs.length} live roles to explore`} href="/jobs?view=saved" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Today */}
          <Panel title="Today" action={reminders.length ? { href: '/notifications', label: 'All reminders' } : undefined}>
            {tasks.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" /> You are all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {tasks.map((t) => (
                  <li key={t.key}>
                    <Link href={t.href} className="group flex items-center gap-3 py-3">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          t.urgent ? 'bg-coral-100 text-coral-700' : 'bg-plum-50 text-plum'
                        )}
                      >
                        <t.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink group-hover:text-plum">{t.title}</span>
                        <span className="block truncate text-xs text-ink-subtle">{t.detail}</span>
                      </span>
                      {t.urgent && <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[11px] font-semibold text-coral-700">Due</span>}
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Pipeline */}
          <Panel title="Pipeline" action={{ href: '/applications', label: 'Open board' }}>
            {totalTracked === 0 ? (
              <p className="text-sm text-ink-muted">Nothing tracked yet. Save or apply to a role and your pipeline appears here.</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-sand" role="img" aria-label={APPLICATION_STATUSES.map((s) => `${s} ${stats.counts[s]}`).join(', ')}>
                  {APPLICATION_STATUSES.filter((s) => stats.counts[s]).map((s) => (
                    <div key={s} className={cn('h-full', STAGE_COLOR[s])} style={{ width: `${(stats.counts[s] / totalTracked) * 100}%` }} />
                  ))}
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                  {APPLICATION_STATUSES.map((s) => (
                    <li key={s} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-ink-muted">
                        <span className={cn('h-2.5 w-2.5 rounded-full', STAGE_COLOR[s])} aria-hidden="true" />
                        {s}
                      </span>
                      <span className="font-semibold tabular-nums text-ink">{stats.counts[s]}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          {/* Tools */}
          <section aria-label="Tools" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {TOOLS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-paper px-2 py-4 text-center text-xs font-medium text-ink-muted shadow-card transition-all hover:-translate-y-0.5 hover:text-plum hover:shadow-raised"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum-50 text-plum">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </Link>
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <Panel title="This week">
            <WeeklyGoals applications={applications} />
          </Panel>

          <Panel title="Job alerts" action={{ href: '/jobs', label: 'Manage' }}>
            <JobAlertsBar compact />
          </Panel>

          {/* Matched jobs */}
          <Panel title={profile.skills.length ? 'Matched for you' : 'Latest roles'} action={{ href: '/jobs', label: 'All jobs' }}>
            {jobsError ? (
              <Notice tone="error">{jobsError}</Notice>
            ) : loadingJobs && jobs.length === 0 ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : topJobs.length === 0 ? (
              <p className="text-sm text-ink-muted">No live roles right now. Try again shortly.</p>
            ) : (
              <ul className="-mx-2 divide-y divide-line">
                {topJobs.map((job) => (
                  <li key={job.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJob(job);
                        router.push(`/jobs?selected=${encodeURIComponent(job.id)}`);
                      }}
                      className="group flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-sand/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-plum-50 text-sm font-semibold text-plum">
                        {job.company.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink group-hover:text-plum">{job.title}</span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {job.company} · {job.location}
                        </span>
                      </span>
                      {job.matchedSkills?.length ? (
                        <span className="shrink-0 rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-semibold text-success-700">
                          {job.matchedSkills.length}/{job.skills.length} skills
                        </span>
                      ) : (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Activity */}
          <Panel title="Recent activity" action={activities.length ? { href: '/notifications', label: 'All' } : undefined}>
            {activities.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <Inbox className="h-4 w-4 text-ink-subtle" aria-hidden="true" /> Your saves, applications and drafts appear here.
              </p>
            ) : (
              <ol className="relative space-y-4 border-l border-line pl-4">
                {activities.slice(0, 5).map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
                    <p className="text-sm font-medium text-ink">{a.title}</p>
                    <p className="text-xs text-ink-subtle">{[a.subtitle, timeAgo(a.timestamp)].filter(Boolean).join(' · ')}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {!profile.resumeFileName && (
            <div className="rounded-2xl border border-dashed border-plum-200 p-5">
              <p className="flex items-center gap-2 font-medium text-plum">
                <FileText className="h-4 w-4" aria-hidden="true" /> Upload your CV
              </p>
              <p className="mt-1 text-sm text-ink-muted">Jobora reads it and fills in your profile in about 5 seconds.</p>
              <ButtonLink href="/profile" size="sm" className="mt-3">
                Upload CV
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Panel({ title, action, children }: { title: string; action?: { href: string; label: string }; children: React.ReactNode }) {
  const t = useT();
  return (
    <section className="rounded-2xl border border-line bg-paper p-5 shadow-card sm:p-6" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-plum">{t(title)}</h2>
        {action && (
          <Link href={action.href} className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
            {t(action.label)}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  href,
  children,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-50 text-plum">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-serif text-3xl tabular-nums text-plum">{value}</p>
        {children}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </>
  );
  const cls = 'block rounded-2xl border border-line bg-paper p-5 shadow-card';
  return href ? (
    <Link href={href} className={cn(cls, 'transition-shadow hover:shadow-raised')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Tiny weekly trend line; hidden when there is nothing to show. */
function Sparkline({ values }: { values: number[] }) {
  if (!values.some(Boolean)) return null;
  const max = Math.max(1, ...values);
  const w = 72;
  const h = 26;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`Last 6 weeks: ${values.join(', ')}`} role="img" className="shrink-0 text-coral">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(248,245,240,0.15)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#E05347"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute font-serif text-xl tabular-nums">{value}%</span>
    </span>
  );
}
