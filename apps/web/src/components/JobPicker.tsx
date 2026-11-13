'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAppData } from '@/context/AppDataContext';
import { Field, Select } from '@/components/ui/primitives';

const OTHER_LIMIT = 40;

/**
 * Chooses which role a draft or practice session is for.
 * Saved and tracked roles come first so the list stays short and relevant.
 */
export function JobPicker({ id, label = 'Role', className }: { id: string; label?: string; className?: string }) {
  const { jobs, savedJobIds, applications, selectedJob, setSelectedJob } = useAppData();

  const { mine, others } = useMemo(() => {
    const trackedIds = new Set(applications.map((a) => a.jobId));
    const mineList = jobs.filter((j) => savedJobIds.includes(j.id) || trackedIds.has(j.id));
    const mineIds = new Set(mineList.map((j) => j.id));
    const rest = jobs.filter((j) => !mineIds.has(j.id));
    let otherList = rest.slice(0, OTHER_LIMIT);
    if (selectedJob && !mineIds.has(selectedJob.id) && !otherList.some((j) => j.id === selectedJob.id)) {
      otherList = [selectedJob, ...otherList];
    }
    return { mine: mineList, others: otherList };
  }, [jobs, savedJobIds, applications, selectedJob]);

  if (jobs.length === 0) {
    return (
      <p className={className}>
        <span className="text-sm text-ink-muted">
          No roles loaded yet.{' '}
          <Link href="/jobs" className="font-semibold text-plum underline underline-offset-4">
            Open job search
          </Link>
        </span>
      </p>
    );
  }

  const label_ = (j: { title: string; company: string }) => `${j.title} — ${j.company}`;

  return (
    <Field label={label} htmlFor={id} className={className}>
      <Select
        id={id}
        value={selectedJob?.id || ''}
        onChange={(e) => setSelectedJob(jobs.find((j) => j.id === e.target.value) || null)}
      >
        <option value="">No specific role</option>
        {mine.length > 0 && (
          <optgroup label="Saved and applied">
            {mine.map((j) => (
              <option key={j.id} value={j.id}>
                {label_(j)}
              </option>
            ))}
          </optgroup>
        )}
        {others.length > 0 && (
          <optgroup label={mine.length > 0 ? 'Other roles' : 'Roles'}>
            {others.map((j) => (
              <option key={j.id} value={j.id}>
                {label_(j)}
              </option>
            ))}
          </optgroup>
        )}
      </Select>
    </Field>
  );
}
