'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  Mail,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  X as XIcon,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { CompanyInitial, JobRow } from '@/components/JobRow';
import { MatchMeter } from '@/components/MatchMeter';
import { useToast } from '@/components/providers';
import { Button, ButtonLink } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  Notice,
  PageHeader,
  Segmented,
  Skeleton,
  Textarea,
} from '@/components/ui/primitives';
import { TagInput } from '@/components/ui/tag-input';
import { useAppData, type LiveJob } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { isHttpUrl, timeAgo } from '@/lib/format';

const REGIONS = [
  { label: 'Anywhere', value: '' },
  { label: 'UAE', value: 'UAE' },
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Abu Dhabi', value: 'Abu Dhabi' },
  { label: 'Saudi Arabia', value: 'Saudi Arabia' },
  { label: 'Qatar', value: 'Qatar' },
  { label: 'All MENA', value: 'MENA' },
  { label: 'Egypt', value: 'Egypt' },
  { label: 'India', value: 'India' },
  { label: 'Bengaluru', value: 'Bengaluru' },
  { label: 'Delhi NCR', value: 'Delhi NCR' },
  { label: 'Mumbai', value: 'Mumbai' },
  { label: 'Hyderabad', value: 'Hyderabad' },
  { label: 'Remote', value: 'Remote' },
];

const JOB_TYPES = [
  { label: 'All types', value: '' },
  { label: 'Internship', value: 'Internship' },
  { label: 'Full-time', value: 'Full-Time' },
] as const;

const PAGE_SIZE = 30;

function JobDetail({ job, onBack }: { job: LiveJob; onBack: () => void }) {
  const { profile, savedJobIds, toggleSavedJob, applications, addApplication } = useAppData();
  const { addToast } = useToast();
  const [tracking, setTracking] = useState(false);

  const saved = savedJobIds.includes(job.id);
  const tracked = applications.find((a) => a.jobId === job.id);
  const applyUrl = isHttpUrl(job.applicationUrl) ? job.applicationUrl : isHttpUrl(job.sourceUrl) ? job.sourceUrl : null;
  const matched = job.matchedSkills || [];
  const missing = job.missingSkills || [];
  const hasProfileSkills = profile.skills.length > 0;

  const track = async () => {
    setTracking(true);
    const created = await addApplication({
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      status: 'Applied',
      matchScore: job.matchScore ?? null,
      syncChannel: job.source,
      recruiterName: job.recruiterName || '',
      recruiterEmail: job.recruiterEmail || '',
    });
    setTracking(false);
    addToast(
      created
        ? { title: 'Added to your applications', description: `${job.title} at ${job.company}` }
        : { type: 'error', title: 'Could not add this application', description: 'Please try again.' }
    );
  };

  return (
    <article aria-labelledby="job-title" className="rounded-lg border border-line bg-paper shadow-card">
      <div className="border-b border-line p-5 sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex h-9 items-center gap-1.5 rounded text-sm font-medium text-ink-muted hover:text-plum xl:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to results
        </button>

        <div className="flex gap-4">
          <CompanyInitial name={job.company} className="h-12 w-12 text-xl" />
          <div className="min-w-0">
            <h2 id="job-title" className="font-serif text-2xl text-plum">
              {job.title}
            </h2>
            <p className="mt-0.5 text-ink-muted">{job.company}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.location && <Chip>{job.location}</Chip>}
          {job.workMode && <Chip>{job.workMode}</Chip>}
          {job.employmentType && <Chip>{job.employmentType}</Chip>}
          {job.salaryRange && !/not disclosed/i.test(job.salaryRange) && <Chip>{job.salaryRange}</Chip>}
          {job.postedAt && <Chip>Posted {job.postedAt}</Chip>}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {applyUrl && (
            <ButtonLink href={applyUrl} external>
              Apply on employer site
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          )}
          {tracked ? (
            <ButtonLink href={`/applications/${tracked.id}`} variant="secondary">
              <Check className="h-4 w-4 text-success" aria-hidden="true" />
              In your applications
            </ButtonLink>
          ) : (
            <Button variant="secondary" onClick={track} loading={tracking}>
              I applied — track it
            </Button>
          )}
          <Button variant="ghost" onClick={() => toggleSavedJob(job.id)} aria-pressed={saved}>
            {saved ? (
              <BookmarkCheck className="h-4 w-4 text-coral-700" aria-hidden="true" />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden="true" />
            )}
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
        {applyUrl && !tracked && (
          <p className="mt-2 text-xs text-ink-subtle">
            Applying happens on the employer’s site. Come back and track it once you have submitted.
          </p>
        )}
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Skill comparison */}
        <section aria-labelledby="skills-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="skills-heading" className="font-semibold text-ink">
              Skills this role lists
            </h3>
            <MatchMeter matched={matched.length} total={job.skills.length} hasProfileSkills={hasProfileSkills} size="lg" />
          </div>

          {job.skills.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              This listing does not name specific skills, so there is nothing to compare. Read the description below.
            </p>
          ) : !hasProfileSkills ? (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                <Link href="/settings" className="font-semibold text-plum underline underline-offset-4">
                  Add your skills
                </Link>{' '}
                to see which of these you already have.
              </p>
            </>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-success-700">
                  On your profile ({matched.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matched.length > 0 ? (
                    matched.map((s) => (
                      <Badge key={s} tone="success">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-ink-subtle">None yet</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                  Not on your profile ({missing.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.length > 0 ? (
                    missing.map((s) => (
                      <Badge key={s} tone="muted">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-ink-subtle">Nothing missing</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Prepare */}
        <section aria-labelledby="prepare-heading" className="rounded border border-line bg-ivory p-4">
          <h3 id="prepare-heading" className="font-semibold text-ink">
            Prepare your application
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href="/cover-letters" variant="secondary" size="sm">
              <PenLine className="h-4 w-4" aria-hidden="true" />
              Draft cover letter
            </ButtonLink>
            <ButtonLink href="/email-composer" variant="secondary" size="sm">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Draft email
            </ButtonLink>
            <ButtonLink href="/interview" variant="secondary" size="sm">
              Practise interview
            </ButtonLink>
          </div>
        </section>

        {/* Description */}
        {job.description && (
          <section aria-labelledby="about-heading">
            <h3 id="about-heading" className="font-semibold text-ink">
              About the role
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{job.description}</p>
          </section>
        )}

        {job.responsibilities.length > 0 && (
          <section aria-labelledby="resp-heading">
            <h3 id="resp-heading" className="font-semibold text-ink">
              Responsibilities
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
              {job.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="border-t border-line pt-4 text-xs text-ink-subtle">Source: {job.source}</p>
      </div>
    </article>
  );
}

function AddRoleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCustomJob } = useAppData();
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !company.trim()) {
      setError('Enter both a job title and a company.');
      return;
    }
    if (url.trim() && !isHttpUrl(url.trim())) {
      setError('The link should start with http:// or https://');
      return;
    }
    setSaving(true);
    const job = await addCustomJob({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      sourceUrl: url.trim(),
      skills,
      description: description.trim(),
    });
    setSaving(false);
    if (!job) {
      setError('The role could not be saved. Please try again.');
      return;
    }
    addToast({ title: 'Role added', description: `${job.title} at ${job.company}` });
    setTitle('');
    setCompany('');
    setLocation('');
    setUrl('');
    setSkills([]);
    setDescription('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Add a role"
      description="Found a job somewhere else? Add it here to compare skills and track it. Only you can see it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-role-form" loading={saving}>
            Add role
          </Button>
        </>
      }
    >
      <form id="add-role-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {error && (
          <Notice tone="error" className="sm:col-span-2">
            {error}
          </Notice>
        )}
        <Field label="Job title" htmlFor="role-title">
          <Input id="role-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Company" htmlFor="role-company">
          <Input id="role-company" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </Field>
        <Field label="Location" htmlFor="role-location" optional>
          <Input id="role-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Link to the listing" htmlFor="role-url" optional>
          <Input id="role-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        <Field
          label="Skills the listing asks for"
          htmlFor="role-skills"
          optional
          hint="Press Enter after each one."
          className="sm:col-span-2"
        >
          <TagInput id="role-skills" value={skills} onChange={setSkills} describedBy="role-skills-hint" />
        </Field>
        <Field label="Description" htmlFor="role-description" optional className="sm:col-span-2">
          <Textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </Field>
      </form>
    </Modal>
  );
}

function JobsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    profile,
    jobs,
    loadingJobs,
    jobsError,
    jobsSyncedAt,
    providerDetails,
    refreshJobs,
    savedJobIds,
    toggleSavedJob,
    selectedJob,
    setSelectedJob,
  } = useAppData();

  const initialQuery = params?.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState('');
  const [jobType, setJobType] = useState<string>('');
  const [view, setView] = useState<'all' | 'saved'>(params?.get('view') === 'saved' ? 'saved' : 'all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showDetailOnSmall, setShowDetailOnSmall] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const hasProfileSkills = profile.skills.length > 0;

  // A search arriving from the top bar or a link.
  const urlQuery = params?.get('q') || '';
  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery);
      refreshJobs(urlQuery, region);
    }
    // Only re-run when the URL's query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  // A specific job requested by link.
  const urlSelected = params?.get('selected') || '';
  useEffect(() => {
    if (!urlSelected || jobs.length === 0) return;
    const found = jobs.find((j) => j.id === urlSelected);
    if (found) {
      setSelectedJob(found);
      setShowDetailOnSmall(true);
    }
  }, [urlSelected, jobs, setSelectedJob]);

  const list = useMemo(
    () =>
      (view === 'saved' ? jobs.filter((j) => savedJobIds.includes(j.id)) : jobs).filter(
        (j) => !jobType || j.employmentType === jobType
      ),
    [view, jobs, savedJobIds, jobType]
  );
  const shown = list.slice(0, visible);
  const current = selectedJob && list.some((j) => j.id === selectedJob.id) ? selectedJob : null;
  // On wide screens the first result is shown by default so the right pane is never empty.
  const paneJob = current || list[0] || null;

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setVisible(PAGE_SIZE);
    refreshJobs(query.trim(), region);
    if (urlQuery || urlSelected) router.replace('/jobs');
  };

  const pickRegion = (value: string) => {
    setRegion(value);
    setVisible(PAGE_SIZE);
    refreshJobs(query.trim(), value);
  };

  const select = (job: LiveJob) => {
    setSelectedJob(job);
    setShowDetailOnSmall(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) window.scrollTo({ top: 0 });
  };

  const liveSources = providerDetails.filter((p) => p.status === 'ok' && p.jobsReturned > 0);

  return (
    <AppShell wide>
      <div className={cn(showDetailOnSmall && 'hidden xl:block')}>
        <PageHeader
          title="Jobs"
          description={
            jobsSyncedAt && !loadingJobs ? (
              <>
                {jobs.length} roles · updated {timeAgo(jobsSyncedAt)} ·{' '}
                <button
                  type="button"
                  onClick={() => setSourcesOpen(true)}
                  className="font-medium text-plum underline underline-offset-4"
                >
                  {liveSources.length} source{liveSources.length === 1 ? '' : 's'}
                </button>
              </>
            ) : (
              'Live roles from public job boards and employer career pages.'
            )
          }
          actions={
            <Button variant="secondary" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a role
            </Button>
          }
        />

        {/* Search and filters */}
        <Card className="mb-5 space-y-4">
          <form onSubmit={search} role="search" className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="job-query" className="sr-only">
                Search by title, company or skill
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              />
              <Input
                id="job-query"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, company or skill"
                className="pl-10"
              />
            </div>
            <Button type="submit" loading={loadingJobs}>
              Search
            </Button>
          </form>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label="Region" className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
              {REGIONS.map((r) => {
                const active = region === r.value;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => pickRegion(r.value)}
                    aria-pressed={active}
                    className={cn(
                      'h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-plum bg-plum text-paper'
                        : 'border-line bg-paper text-ink-muted hover:border-plum-200 hover:text-plum'
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            <div role="group" aria-label="Job type" className="flex shrink-0 gap-1.5">
              {JOB_TYPES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setJobType(t.value);
                    setVisible(PAGE_SIZE);
                  }}
                  aria-pressed={jobType === t.value}
                  className={cn(
                    'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors',
                    jobType === t.value
                      ? 'border-coral-700 bg-coral-50 text-coral-700'
                      : 'border-line bg-paper text-ink-muted hover:border-plum-200 hover:text-plum'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Segmented
              label="Show"
              value={view}
              onChange={(v) => {
                setView(v);
                setVisible(PAGE_SIZE);
              }}
              options={[
                { value: 'all', label: 'All roles', count: jobs.length },
                { value: 'saved', label: 'Saved', count: savedJobIds.length },
              ]}
            />
          </div>
        </Card>
      </div>

      {jobsError && (
        <Notice tone="error" title="Jobs could not be loaded" className="mb-5">
          {jobsError}{' '}
          <button
            type="button"
            onClick={() => refreshJobs(query.trim(), region)}
            className="font-semibold text-plum underline underline-offset-4"
          >
            Try again
          </button>
        </Notice>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Results */}
        <section aria-label="Results" className={cn(showDetailOnSmall && 'hidden xl:block')}>
          {loadingJobs && jobs.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <Card padded={false}>
              {view === 'saved' ? (
                <EmptyState
                  icon={<Bookmark className="h-6 w-6" />}
                  title="No saved roles"
                  action={
                    <Button variant="secondary" onClick={() => setView('all')}>
                      Browse all roles
                    </Button>
                  }
                >
                  Use the bookmark on any role to keep it here for later.
                </EmptyState>
              ) : (
                <EmptyState
                  icon={<Search className="h-6 w-6" />}
                  title="No roles match"
                  action={
                    <>
                      {(query || region) && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setQuery('');
                            setRegion('');
                            refreshJobs('', '');
                          }}
                        >
                          <XIcon className="h-4 w-4" aria-hidden="true" />
                          Clear filters
                        </Button>
                      )}
                      <Button variant="secondary" onClick={() => refreshJobs(query.trim(), region)}>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Refresh
                      </Button>
                    </>
                  }
                >
                  Try a broader search or a different region. You can also add a role you found elsewhere.
                </EmptyState>
              )}
            </Card>
          ) : (
            <>
              <ul className="space-y-3">
                {shown.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    selected={paneJob?.id === job.id}
                    saved={savedJobIds.includes(job.id)}
                    hasProfileSkills={hasProfileSkills}
                    onSelect={() => select(job)}
                    onToggleSave={() => toggleSavedJob(job.id)}
                  />
                ))}
              </ul>
              {list.length > visible && (
                <div className="mt-4 flex justify-center">
                  <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show more ({list.length - visible} left)
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Detail */}
        <div className={cn('xl:sticky xl:top-24', !showDetailOnSmall && 'hidden xl:block')}>
          {paneJob ? (
            <JobDetail key={paneJob.id} job={paneJob} onBack={() => setShowDetailOnSmall(false)} />
          ) : (
            !loadingJobs && (
              <Card padded={false} className="hidden xl:block">
                <EmptyState icon={<Search className="h-6 w-6" />} title="Select a role">
                  Choose a role from the list to see its details and how your skills compare.
                </EmptyState>
              </Card>
            )
          )}
        </div>
      </div>

      <AddRoleModal open={addOpen} onClose={() => setAddOpen(false)} />

      <Modal
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        title="Where these roles come from"
        description="Each source is checked every time the list refreshes."
      >
        <ul className="divide-y divide-line">
          {providerDetails.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-ink">{p.name}</p>
                {p.status !== 'ok' && p.note && <p className="text-xs text-ink-subtle">{p.note}</p>}
              </div>
              {p.status === 'ok' ? (
                <Badge tone="success">{p.jobsReturned} roles</Badge>
              ) : p.status === 'unconfigured' ? (
                <Badge tone="muted">Not set up</Badge>
              ) : (
                <Badge tone="warn">Unavailable</Badge>
              )}
            </li>
          ))}
          {providerDetails.length === 0 && <li className="py-3 text-sm text-ink-muted">No source information yet.</li>}
        </ul>
      </Modal>
    </AppShell>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsContent />
    </Suspense>
  );
}
