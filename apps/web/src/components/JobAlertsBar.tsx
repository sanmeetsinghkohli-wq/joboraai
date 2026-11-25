'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, BellPlus, X } from 'lucide-react';
import { useToast } from '@/components/providers';
import { cn } from '@/lib/cn';
import { describeAlert, newMatches, alertMatches, type AlertFilters } from '@/lib/jobAlerts';
import { useWorkspace, type JobAlert } from '@/lib/workspace';
import type { LiveJob } from '@/context/AppDataContext';

/** The full shared job list (served from the snapshot, so it is cheap). */
function useAllJobs() {
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  useEffect(() => {
    let live = true;
    fetch('/api/jobs')
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d) => live && setJobs(d.jobs || []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return jobs;
}

/**
 * Saved searches with an "N new" count. On the Jobs page it can save the
 * current filters and apply an alert; on the dashboard it links to Jobs.
 */
export function JobAlertsBar({
  filters,
  onApply,
  compact = false,
  autoOpenId,
}: {
  filters?: AlertFilters;
  onApply?: (a: JobAlert) => void;
  compact?: boolean;
  /** Apply this alert once alerts and jobs have loaded (from a dashboard link). */
  autoOpenId?: string;
}) {
  const { addToast } = useToast();
  const { data, loading, act } = useWorkspace();
  const all = useAllJobs();
  const alerts = useMemo(() => data.alerts ?? [], [data.alerts]);
  const counts = useMemo(() => Object.fromEntries(alerts.map((a) => [a.id, newMatches(all, a).length])), [alerts, all]);

  const hasFilters = Boolean(filters && (filters.query || filters.region || filters.jobType || filters.techOnly));
  const duplicate =
    filters &&
    alerts.some(
      (a) => a.query === filters.query && a.region === filters.region && a.jobType === filters.jobType && a.techOnly === filters.techOnly
    );

  const save = async () => {
    if (!filters) return;
    try {
      await act({
        action: 'alert.add',
        name: describeAlert(filters).slice(0, 60),
        ...filters,
        seenIds: all.filter((j) => alertMatches(j, filters)).map((j) => j.id).slice(0, 1000),
      });
      addToast({ title: 'Alert saved', description: 'New matching roles will show a count here and on your dashboard.' });
    } catch (e) {
      addToast({ title: 'Could not save the alert', description: (e as Error).message });
    }
  };

  const open = (a: JobAlert) => {
    const ids = newMatches(all, a).map((j) => j.id);
    if (ids.length) act({ action: 'alert.seen', id: a.id, seenIds: ids.slice(0, 1000) }).catch(() => {});
    onApply?.(a);
  };

  const [autoDone, setAutoDone] = useState(false);
  useEffect(() => {
    if (autoDone || !autoOpenId || loading || all.length === 0) return;
    const a = alerts.find((x) => x.id === autoOpenId);
    setAutoDone(true);
    if (a) open(a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenId, loading, all.length, alerts, autoDone]);

  if (loading) return null;
  if (compact && alerts.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No alerts yet. On{' '}
        <Link href="/jobs" className="font-medium text-plum underline underline-offset-4">
          Jobs
        </Link>
        , set a search or filter and choose “Save as alert”.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && alerts.length > 0 && (
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
          <Bell className="h-4 w-4" aria-hidden="true" />
          Alerts
        </span>
      )}
      {alerts.map((a) => {
        const n = counts[a.id] ?? 0;
        const label = (
          <>
            <span className="max-w-[16rem] truncate">{a.name}</span>
            {n > 0 && (
              <span className="rounded-full bg-coral-700 px-1.5 text-xs font-semibold leading-5 text-paper">{n} new</span>
            )}
          </>
        );
        const chip = 'flex h-9 items-center gap-2 rounded-full border border-line bg-paper pl-3.5 text-sm text-ink hover:border-plum-200';
        return compact ? (
          <Link key={a.id} href={`/jobs?alert=${encodeURIComponent(a.id)}`} className={cn(chip, 'pr-3.5')}>
            {label}
          </Link>
        ) : (
          <span key={a.id} className={cn(chip, 'pr-1')}>
            <button type="button" onClick={() => open(a)} className="flex items-center gap-2">
              {label}
            </button>
            <button
              type="button"
              onClick={() => act({ action: 'alert.remove', id: a.id }).catch(() => {})}
              aria-label={`Delete alert ${a.name}`}
              className="grid h-7 w-7 place-items-center rounded-full text-ink-subtle hover:bg-plum-50 hover:text-plum"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        );
      })}
      {!compact && hasFilters && !duplicate && (
        <button
          type="button"
          onClick={save}
          className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-plum-200 px-3.5 text-sm font-medium text-plum hover:bg-plum-50"
        >
          <BellPlus className="h-4 w-4" aria-hidden="true" />
          Save as alert
        </button>
      )}
    </div>
  );
}
