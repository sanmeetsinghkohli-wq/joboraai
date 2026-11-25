'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import type { LiveApplication } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { SENT_STATUSES, normalizeStatus } from '@/lib/status';
import { DEFAULT_GOALS, inThisWeek, useWorkspace, weekStart } from '@/lib/workspace';

type Key = keyof typeof DEFAULT_GOALS;
const ROWS: Array<{ key: Key; label: string; hint: string }> = [
  { key: 'applications', label: 'Applications sent', hint: 'Roles marked Applied or later this week' },
  { key: 'outreach', label: 'Emails sent', hint: 'Approved from your Outbox this week' },
  { key: 'practice', label: 'Interview answers practised', hint: 'Scored answers this week' },
];

/** Weekly targets plus a short summary of what actually happened this week. */
export function WeeklyGoals({ applications }: { applications: LiveApplication[] }) {
  const { addToast } = useToast();
  const { data, loading, act } = useWorkspace();
  const [sentEmails, setSentEmails] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_GOALS);

  useEffect(() => {
    fetch('/api/outbox')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setSentEmails((d.items || []).filter((i: { status: string }) => i.status === 'sent').map((i: { sentAt?: string }) => i.sentAt || '')))
      .catch(() => {});
  }, []);

  // Targets carry over week to week until the user changes them.
  const targets = data.goals ? { applications: data.goals.applications, outreach: data.goals.outreach, practice: data.goals.practice } : DEFAULT_GOALS;

  const done = useMemo(() => {
    const interviews = (data.interviews ?? []).filter((i) => inThisWeek(i.at));
    return {
      applications: applications.filter(
        (a) => SENT_STATUSES.includes(normalizeStatus(a.status)) && inThisWeek(a.appliedOn || a.appliedAt)
      ).length,
      outreach: sentEmails.filter((d) => inThisWeek(d)).length,
      practice: interviews.length,
      avgScore: interviews.length ? interviews.reduce((s, i) => s + i.score, 0) / interviews.length : null,
      interviewsBooked: applications.filter((a) => inThisWeek(a.interviewAt)).length,
    };
  }, [applications, sentEmails, data.interviews]);

  const save = async () => {
    try {
      await act({ action: 'goals.set', weekOf: weekStart(), ...draft });
      setEditing(false);
    } catch (e) {
      addToast({ title: 'Could not save goals', description: (e as Error).message });
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="space-y-3">
          {ROWS.map((r) => (
            <label key={r.key} className="flex items-center justify-between gap-3 text-sm text-ink">
              {r.label}
              <input
                type="number"
                min={0}
                max={100}
                value={draft[r.key]}
                onChange={(e) => setDraft({ ...draft, [r.key]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                className="h-9 w-20 rounded-lg border border-line bg-paper px-2 text-right"
              />
            </label>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save goals</Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {ROWS.map((r) => {
            const target = targets[r.key];
            const value = done[r.key];
            const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
            return (
              <li key={r.key} title={r.hint}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink">{r.label}</span>
                  <span className={cn('font-semibold tabular-nums', value >= target && target > 0 ? 'text-success' : 'text-ink-muted')}>
                    {value} / {target}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-plum-50" role="progressbar" aria-label={r.label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-2 rounded-full bg-plum transition-all" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="border-t border-line pt-3 text-sm text-ink-muted">
        <span className="font-medium text-ink">This week so far:</span> {done.applications} applied, {done.outreach} emails sent,{' '}
        {done.interviewsBooked} interview{done.interviewsBooked === 1 ? '' : 's'} booked
        {done.avgScore !== null && <>, practice average {done.avgScore.toFixed(1)}/5</>}.
      </p>

      {!editing && (
        <button
          type="button"
          onClick={() => {
            setDraft(targets);
            setEditing(true);
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-plum hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Change goals
        </button>
      )}
    </div>
  );
}
