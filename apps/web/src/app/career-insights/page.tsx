'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, Target } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useToast } from '@/components/providers';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardTitle, EmptyState, Notice, PageHeader, Segmented, Skeleton } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { hasSkill, skillDemand } from '@/lib/match';

import { SubNav, GROWTH_TABS } from '@/components/SubNav';
const TOP = 15;

export default function SkillGapsPage() {
  const { profile, jobs, loadingJobs, savedJobIds, applications, updateProfile } = useAppData();
  const { addToast } = useToast();

  const trackedIds = useMemo(() => new Set(applications.map((a) => a.jobId)), [applications]);
  const shortlist = useMemo(
    () => jobs.filter((j) => savedJobIds.includes(j.id) || trackedIds.has(j.id)),
    [jobs, savedJobIds, trackedIds]
  );

  const [scope, setScope] = useState<'shortlist' | 'all'>(shortlist.length > 0 ? 'shortlist' : 'all');
  const pool = scope === 'shortlist' ? shortlist : jobs;
  const demand = useMemo(() => skillDemand(pool).slice(0, TOP), [pool]);
  const maxCount = demand[0]?.count || 1;

  const have = demand.filter((d) => hasSkill(profile.skills, d.skill));
  const gaps = demand.filter((d) => !hasSkill(profile.skills, d.skill));

  const addSkill = async (skill: string) => {
    await updateProfile({ skills: [...profile.skills, skill] });
    addToast({ title: `Added ${skill} to your skills` });
  };

  return (
    <AppShell>
      <SubNav items={GROWTH_TABS} label="Career growth" />
      <PageHeader
        title="Skill gaps"
        description="Which skills come up most in the roles you care about, and which of them are already on your profile. Counted directly from the listings."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Roles to count"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'shortlist', label: 'Saved and applied', count: shortlist.length },
            { value: 'all', label: 'All live roles', count: jobs.length },
          ]}
        />
        {profile.skills.length === 0 && (
          <Link href="/settings" className="text-sm font-semibold text-plum underline underline-offset-4">
            Add your skills first
          </Link>
        )}
      </div>

      {loadingJobs && jobs.length === 0 ? (
        <Skeleton className="h-96" />
      ) : pool.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<Target className="h-6 w-6" />}
            title={scope === 'shortlist' ? 'No saved or applied roles yet' : 'No live roles loaded'}
            action={<ButtonLink href="/jobs">Browse jobs</ButtonLink>}
          >
            {scope === 'shortlist'
              ? 'Save a few roles you are interested in and this page will show what they have in common.'
              : 'The job feeds returned nothing. Try again shortly.'}
          </EmptyState>
        </Card>
      ) : demand.length === 0 ? (
        <Notice tone="info">These listings do not name specific skills, so there is nothing to count.</Notice>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card as="section">
            <CardTitle>Most requested skills</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Out of {pool.length} role{pool.length === 1 ? '' : 's'}. Bar length is how many listings mention the skill.
            </p>
            <ul className="mt-5 space-y-3">
              {demand.map((d) => {
                const owned = hasSkill(profile.skills, d.skill);
                return (
                  <li key={d.skill} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
                    <span className="flex min-w-0 items-center gap-1.5 text-sm">
                      {owned ? (
                        <Check className="h-4 w-4 shrink-0 text-success" aria-label="On your profile" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-line" aria-label="Not on your profile" />
                      )}
                      <span className={cn('truncate', owned ? 'text-ink' : 'text-ink-muted')}>{d.skill}</span>
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-sand" aria-hidden="true">
                      <span
                        className={cn('block h-full rounded-full', owned ? 'bg-success' : 'bg-coral')}
                        style={{ width: `${(d.count / maxCount) * 100}%` }}
                      />
                    </span>
                    <span className="w-14 text-right text-xs tabular-nums text-ink-subtle">
                      {d.count} role{d.count === 1 ? '' : 's'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="space-y-6">
            <Card as="section">
              <CardTitle>Not on your profile</CardTitle>
              {gaps.length === 0 ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-success-700">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  You have every skill in this list.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-ink-muted">
                    If you already have one of these, add it. If not, these are the ones most worth learning.
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {gaps.map((g) => (
                      <li key={g.skill}>
                        <button
                          type="button"
                          onClick={() => addSkill(g.skill)}
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-paper px-3 text-sm text-ink-muted transition-colors hover:border-plum hover:text-plum"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          {g.skill}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card as="section">
              <CardTitle>Already on your profile</CardTitle>
              {have.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">None of the most requested skills yet.</p>
              ) : (
                <p className="mt-3 text-sm text-ink">
                  {have.length} of the top {demand.length}: {have.map((h) => h.skill).join(', ')}.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
