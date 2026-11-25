'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { useWorkspace } from '@/lib/workspace';

/** Saved interview scores (out of 5) with a simple trend, newest first. */
export function InterviewHistory() {
  const { data, loading, act } = useWorkspace();
  const items = useMemo(() => data.interviews ?? [], [data.interviews]);

  const stats = useMemo(() => {
    if (!items.length) return null;
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const recent = items.slice(0, 5).map((i) => i.score);
    const before = items.slice(5, 10).map((i) => i.score);
    return {
      avg: avg(items.map((i) => i.score)),
      recent: avg(recent),
      change: before.length ? avg(recent) - avg(before) : null,
    };
  }, [items]);

  if (loading) return null;

  return (
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl text-plum">Your practice history</h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear your saved practice scores?')) act({ action: 'interview.clear' }).catch(() => {});
            }}
            className="text-sm text-ink-muted underline-offset-4 hover:underline"
          >
            Clear history
          </button>
        )}
      </div>

      {!stats ? (
        <p className="text-sm text-ink-muted">Scored answers are saved here so you can see whether you are improving.</p>
      ) : (
        <>
          <dl className="mb-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-plum-50 p-3">
              <dt className="text-xs text-ink-muted">Answers scored</dt>
              <dd className="font-serif text-2xl text-plum">{items.length}</dd>
            </div>
            <div className="rounded-xl bg-plum-50 p-3">
              <dt className="text-xs text-ink-muted">Last 5 average</dt>
              <dd className="font-serif text-2xl text-plum">{stats.recent.toFixed(1)}</dd>
            </div>
            <div className="rounded-xl bg-plum-50 p-3">
              <dt className="text-xs text-ink-muted">Versus the 5 before</dt>
              <dd className={cn('font-serif text-2xl', stats.change === null ? 'text-ink-muted' : stats.change >= 0 ? 'text-success' : 'text-danger')}>
                {stats.change === null ? '—' : `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(1)}`}
              </dd>
            </div>
          </dl>

          <div className="mb-5 flex h-16 items-end gap-1" aria-label="Scores over time, oldest to newest" role="img">
            {items
              .slice(0, 20)
              .reverse()
              .map((i) => (
                <div
                  key={i.id}
                  title={`${i.score}/5 · ${new Date(i.at).toLocaleDateString()}`}
                  className={cn('flex-1 rounded-t', i.score >= 4 ? 'bg-success' : i.score >= 3 ? 'bg-coral' : 'bg-danger')}
                  style={{ height: `${Math.max(8, (i.score / 5) * 100)}%` }}
                />
              ))}
          </div>

          <ul className="divide-y divide-line">
            {items.slice(0, 10).map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-ink">{i.question}</p>
                  <p className="text-xs text-ink-muted">
                    {i.role || 'General'} · {new Date(i.at).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-plum">{i.score}/5</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
