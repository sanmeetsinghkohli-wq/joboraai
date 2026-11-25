'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Briefcase,
  ClipboardCheck,
  FileText,
  Inbox,
  Mic,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { JobRow } from '@/components/JobRow';
import { ButtonLink } from '@/components/ui/button';
import { Card, EmptyState, Notice, Skeleton } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { APPLICATION_STATUSES, normalizeStatus } from '@/lib/status';

interface NextStep {
  title: string;
  body: string;
  cta: string;
  href: string;
}

const FUNNEL_TONE: Record<string, string> = {
  Saved: 'bg-plum-200',
  Applied: 'bg-plum',
  Interview: 'bg-coral',
  Offer: 'bg-success',
  Rejected: 'bg-line',
};

const TOOLS = [
  { href: '/career-ops', label: 'Fit report', body: 'Score a job against your CV', icon: ClipboardCheck },
  { href: '/cv-studio', label: 'CV & documents', body: 'Build, tailor and export', icon: FileText },
  { href: '/interview', label: 'Interview practice', body: 'Questions for your target role', icon: Mic },
  { href: '/career-growth', label: 'Learning roadmap', body: 'Close your skill gaps', icon: TrendingUp },
];

export default function DashboardPage() {
  const router = useRouter();
  const { profile, jobs, loadingJobs, jobsError, savedJobIds, toggleSavedJob, setSelectedJob, applications, activities } =
    useAppData();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const hasSkills = profile.skills.length > 0;

  // Every number below comes from the user's own tracker and profile.
  const counts = Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s, applications.filter((a) => normalizeStatus(a.status) === s).length])
  ) as Record<string, number>;
  const sent = (counts.Applied ?? 0) + (counts.Interview ?? 0) + (counts.Offer ?? 0) + (counts.Rejected ?? 0);
  const interviewsOrBetter = (counts.Interview ?? 0) + (counts.Offer ?? 0);
  const interviewRate = sent > 0 ? Math.round((interviewsOrBetter / sent) * 100) : null;
  const funnelMax = Math.max(1, ...APPLICATION_STATUSES.map((s) => counts[s] ?? 0));

  const profileChecks = [
    Boolean(profile.targetRole),
    hasSkills,
    Boolean(profile.location),
    Boolean(profile.summary),
    Boolean(profile.experience),
    Boolean(profile.degree || profile.university),
  ];
  const profileStrength = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);

  const interviews = applications.filter((a) => normalizeStatus(a.status) === 'Interview');
  const savedNotApplied = savedJobIds.filter((id) => !applications.some((a) => a.jobId === id));

  let nextStep: NextStep;
  if (!profile.targetRole || !hasSkills) {
    nextStep = {
      title: 'Add your target role and skills',
      body: 'Every match, score and draft in Jobora is built from your profile. It takes about two minutes.',
      cta: 'Complete profile',
      href: '/settings',
    };
  } else if (interviews.length > 0) {
    nextStep = {
      title: `Prepare for ${interviews[0].company}`,
      body: `${interviews[0].title} is at interview stage. Practise questions built around that role.`,
      cta: 'Practise now',
      href: '/interview',
    };
  } else if (savedNotApplied.length > 0) {
    nextStep = {
      title: `${savedNotApplied.length} saved role${savedNotApplied.length === 1 ? '' : 's'} waiting`,
      body: 'Check your fit, tailor your CV and apply while the listings are still open.',
      cta: 'Review saved roles',
      href: '/jobs?view=saved',
    };
  } else if (applications.length === 0) {
    nextStep = {
      title: 'Find your first roles',
      body: 'Browse live roles that match your skills, save the good ones and track each application.',
      cta: 'Browse jobs',
      href: '/jobs',
    };
  } else {
    nextStep = {
      title: 'Keep your pipeline moving',
      body: 'Update anything that changed, follow up on older applications, then look for new roles.',
      cta: 'Open applications',
      href: '/applications',
    };
  }

  const topJobs = jobs.slice(0, 4);
  const openJob = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (job) setSelectedJob(job);
    router.push(`/jobs?selected=${encodeURIComponent(id)}`);
  };

  return (
    <AppShell>
      {/* Greeting + next step */}
      <section className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="font-serif text-3xl text-plum">
            {greeting}
            {profile.firstName ? `, ${profile.firstName}` : ''}
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {profile.targetRole
              ? `Looking for ${profile.targetRole}${profile.location ? ` · ${profile.location}` : ''}`
              : 'Tell us the role you want and this page tailors itself.'}
          </p>
        </div>
      </section>

      <Card
        as="section"
        className="mb-8 flex flex-col gap-4 overflow-hidden border-0 bg-plum text-paper sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-coral">Your next step</p>
          <h2 className="mt-1.5 font-serif text-2xl">{nextStep.title}</h2>
          <p className="mt-1 max-w-xl text-sm text-plum-100">{nextStep.body}</p>
        </div>
        <ButtonLink href={nextStep.href} variant="accent" className="shrink-0 self-start sm:self-auto">
          {nextStep.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </Card>

      {/* Key numbers */}
      <section aria-label="Your numbers" className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Applications sent" value={sent} icon={Send} />
        <Metric label="Interviews" value={interviewsOrBetter} icon={Mic} />
        <Metric
          label="Interview rate"
          value={interviewRate === null ? '—' : `${interviewRate}%`}
          hint={interviewRate === null ? 'Shows once you apply' : `${interviewsOrBetter} of ${sent} sent`}
          icon={TrendingUp}
        />
        <Metric
          label="Profile strength"
          value={`${profileStrength}%`}
          hint={profileStrength < 100 ? 'Complete it for better matches' : 'All set'}
          icon={UserRound}
          href={profileStrength < 100 ? '/settings' : undefined}
        />
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Funnel */}
        <Card as="section" aria-labelledby="funnel">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="funnel" className="font-serif text-xl text-plum">
              Application funnel
            </h2>
            <Link href="/applications" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
              Manage
            </Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nothing tracked yet. Save or apply to a role and your funnel appears here.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {APPLICATION_STATUSES.map((status) => {
                const n = counts[status] ?? 0;
                return (
                  <li key={status}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink-muted">{status}</span>
                      <span className="font-semibold tabular-nums text-ink">{n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-sand">
                      <div
                        className={cn('h-full rounded-full transition-[width] duration-500', FUNNEL_TONE[status] ?? 'bg-plum')}
                        style={{ width: `${(n / funnelMax) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Roles */}
        <section aria-labelledby="top-roles">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="top-roles" className="font-serif text-xl text-plum">
              {hasSkills ? 'Closest to your skills' : 'Latest roles'}
            </h2>
            <Link href="/jobs" className="shrink-0 text-sm font-semibold text-plum underline-offset-4 hover:underline">
              All jobs
            </Link>
          </div>
          {jobsError ? (
            <Notice tone="error" title="Jobs could not be loaded">
              {jobsError}
            </Notice>
          ) : loadingJobs && jobs.length === 0 ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : topJobs.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="No live roles right now"
                action={<ButtonLink href="/jobs">Open job search</ButtonLink>}
              >
                The job feeds returned nothing. Try again shortly.
              </EmptyState>
            </Card>
          ) : (
            <ul className="space-y-3">
              {topJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  saved={savedJobIds.includes(job.id)}
                  hasProfileSkills={hasSkills}
                  onSelect={() => openJob(job.id)}
                  onToggleSave={() => toggleSavedJob(job.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Quick tools */}
        <section aria-labelledby="tools">
          <h2 id="tools" className="mb-3 font-serif text-xl text-plum">
            Tools
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ href, label, body, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full items-center gap-4 rounded-lg border border-line bg-paper p-4 shadow-card transition-shadow hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-plum-50 text-plum">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-plum">{label}</span>
                    <span className="block text-sm text-ink-muted">{body}</span>
                  </span>
                  <ArrowRight
                    className="ml-auto h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/ai-copilot"
            className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-plum-200 px-4 py-3 text-sm text-plum hover:bg-plum-50"
          >
            <Sparkles className="h-4 w-4 text-coral" aria-hidden="true" />
            Not sure what to do next? Ask Copilot about your search.
          </Link>
        </section>

        {/* Activity */}
        <Card as="section" aria-labelledby="recent">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent" className="font-serif text-xl text-plum">
              Recent activity
            </h2>
            {activities.length > 0 && (
              <Link href="/notifications" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
                All
              </Link>
            )}
          </div>
          {activities.length === 0 ? (
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <Inbox className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
              Your saves, applications and drafts will appear here.
            </div>
          ) : (
            <ul className="space-y-3.5">
              {activities.slice(0, 5).map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{a.title}</span>
                    <span className="block text-xs text-ink-subtle">
                      {[a.subtitle, timeAgo(a.timestamp)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <Icon className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
      </div>
      <p className="mt-2 font-serif text-3xl tabular-nums text-plum">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </>
  );
  const cls = 'block rounded-lg border border-line bg-paper p-5 shadow-card';
  return href ? (
    <Link href={href} className={cn(cls, 'transition-shadow hover:shadow-raised')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
