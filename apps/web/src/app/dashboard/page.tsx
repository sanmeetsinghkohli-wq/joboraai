'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bookmark, Briefcase, Inbox, Mic, Search, Send } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { JobRow } from '@/components/JobRow';
import { ButtonLink } from '@/components/ui/button';
import { Badge, Card, CardTitle, EmptyState, Notice, Skeleton, Stat } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { timeAgo } from '@/lib/format';
import { APPLICATION_STATUSES, STATUS_TONE, normalizeStatus } from '@/lib/status';

interface NextStep {
  title: string;
  body: string;
  cta: string;
  href: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    jobs,
    loadingJobs,
    jobsError,
    savedJobIds,
    toggleSavedJob,
    setSelectedJob,
    applications,
    activities,
  } = useAppData();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const hasSkills = profile.skills.length > 0;

  const byStatus = APPLICATION_STATUSES.map((status) => ({
    status,
    count: applications.filter((a) => normalizeStatus(a.status) === status).length,
  }));
  const interviews = applications.filter((a) => normalizeStatus(a.status) === 'Interview');
  const savedNotApplied = savedJobIds.filter((id) => !applications.some((a) => a.jobId === id));

  // The one thing most worth doing next, decided from the user's real state.
  let nextStep: NextStep;
  if (!profile.targetRole || !hasSkills) {
    nextStep = {
      title: 'Add your target role and skills',
      body: 'Jobs are ordered by how many of their listed skills are on your profile. Without skills there is nothing to compare.',
      cta: 'Complete profile',
      href: '/settings',
    };
  } else if (interviews.length > 0) {
    nextStep = {
      title: `Prepare for your interview at ${interviews[0].company}`,
      body: `You marked ${interviews[0].title} as being at interview stage. Practise answers built around that role.`,
      cta: 'Open interview practice',
      href: '/interview',
    };
  } else if (savedNotApplied.length > 0) {
    nextStep = {
      title: `You have ${savedNotApplied.length} saved role${savedNotApplied.length === 1 ? '' : 's'} you have not applied to`,
      body: 'Review them, draft your documents and apply while the listings are still open.',
      cta: 'Review saved roles',
      href: '/jobs?view=saved',
    };
  } else if (applications.length === 0) {
    nextStep = {
      title: 'Find your first roles',
      body: 'Browse the live feed, save what looks right, and track each application as you send it.',
      cta: 'Browse jobs',
      href: '/jobs',
    };
  } else {
    nextStep = {
      title: 'Keep your pipeline moving',
      body: 'Update the stage of any application that has changed, then look for new roles.',
      cta: 'Open applications',
      href: '/applications',
    };
  }

  const topJobs = jobs.slice(0, 5);

  const openJob = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (job) setSelectedJob(job);
    router.push(`/jobs?selected=${encodeURIComponent(id)}`);
  };

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-plum sm:text-3xl">
          {greeting}
          {profile.firstName ? `, ${profile.firstName}` : ''}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {profile.targetRole
            ? `Looking for ${profile.targetRole}${profile.location ? ` · ${profile.location}` : ''}`
            : 'Tell us the role you are looking for to tailor this page.'}
        </p>
      </header>

      {/* Next step */}
      <Card as="section" className="mb-6 flex flex-col gap-4 border-plum-100 bg-plum text-paper sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-coral">Next step</p>
          <h2 className="mt-1 font-serif text-xl">{nextStep.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-plum-100">{nextStep.body}</p>
        </div>
        <ButtonLink href={nextStep.href} variant="accent" className="shrink-0 self-start sm:self-auto">
          {nextStep.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </Card>

      {/* Numbers */}
      <section aria-label="Summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Applications" value={applications.length} icon={<Send className="h-5 w-5" />} />
        <Stat label="At interview" value={interviews.length} icon={<Mic className="h-5 w-5" />} />
        <Stat label="Saved roles" value={savedJobIds.length} icon={<Bookmark className="h-5 w-5" />} />
        <Stat
          label="Live roles"
          value={loadingJobs && jobs.length === 0 ? '—' : jobs.length}
          hint={loadingJobs ? 'Refreshing…' : undefined}
          icon={<Briefcase className="h-5 w-5" />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Roles */}
        <section aria-labelledby="top-roles">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="top-roles" className="font-serif text-xl text-plum">
                {hasSkills ? 'Closest to your skills' : 'Latest roles'}
              </h2>
              <p className="text-sm text-ink-muted">
                {hasSkills
                  ? 'Ordered by how many of each role’s listed skills are on your profile.'
                  : 'Add skills to your profile to order these by fit.'}
              </p>
            </div>
            <Link href="/jobs" className="shrink-0 text-sm font-semibold text-plum underline-offset-4 hover:underline">
              View all
            </Link>
          </div>

          {jobsError ? (
            <Notice tone="error" title="Jobs could not be loaded">
              {jobsError}
            </Notice>
          ) : loadingJobs && jobs.length === 0 ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : topJobs.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="No live roles right now"
                action={<ButtonLink href="/jobs">Open job search</ButtonLink>}
              >
                The job feeds returned nothing. Try again shortly, or add a role you found elsewhere.
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

        <div className="space-y-6">
          {/* Pipeline */}
          <Card as="section" aria-labelledby="pipeline">
            <div className="flex items-center justify-between">
              <CardTitle>
                <span id="pipeline">Pipeline</span>
              </CardTitle>
              <Link href="/applications" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
                Manage
              </Link>
            </div>
            {applications.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                Nothing tracked yet. When you apply to a role, add it here to follow it through to an offer.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {byStatus.map(({ status, count }) => (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                    <span className="font-semibold tabular-nums text-ink">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Activity */}
          <Card as="section" aria-labelledby="recent">
            <div className="flex items-center justify-between">
              <CardTitle>
                <span id="recent">Recent activity</span>
              </CardTitle>
              {activities.length > 0 && (
                <Link href="/notifications" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
                  All
                </Link>
              )}
            </div>
            {activities.length === 0 ? (
              <div className="mt-3 flex items-center gap-3 text-sm text-ink-muted">
                <Inbox className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
                Your saves, applications and drafts will be listed here.
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {activities.slice(0, 5).map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium text-ink">{a.title}</p>
                    <p className="text-xs text-ink-subtle">
                      {[a.subtitle, timeAgo(a.timestamp)].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
