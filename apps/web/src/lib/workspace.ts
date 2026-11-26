'use client';

import { useCallback, useEffect, useState } from 'react';

export interface JobAlert {
  id: string;
  name: string;
  query: string;
  region: string;
  jobType: string;
  techOnly: boolean;
  seenIds: string[];
  /** Email a daily digest of new matches. Off unless the user turns it on. */
  emailEnabled?: boolean;
  /** Job ids already emailed for this alert (newest 1000). */
  emailedIds?: string[];
  lastEmailedAt?: string;
  createdAt: string;
}
export interface InterviewRecord {
  id: string;
  at: string;
  role: string;
  question: string;
  score: number;
  source: 'practice' | 'career-ops';
}
export interface WeeklyGoals {
  weekOf: string;
  applications: number;
  outreach: number;
  practice: number;
}
export interface Workspace {
  alerts?: JobAlert[];
  goals?: WeeklyGoals;
  interviews?: InterviewRecord[];
  /** Server says email digests can be sent (Resend configured). */
  emailAlertsAvailable?: boolean;
}

export const DEFAULT_GOALS = { applications: 5, outreach: 3, practice: 2 };

/** Monday of the current week as YYYY-MM-DD (local time). */
export function weekStart(d = new Date()): string {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`;
}

export function inThisWeek(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const t = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).getTime();
  const start = new Date(`${weekStart(now)}T00:00:00`).getTime();
  return t >= start && t < start + 7 * 86400000;
}

export async function workspaceAction(body: Record<string, unknown>): Promise<Workspace> {
  const res = await fetch('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || 'Could not save.');
  return data;
}

/** Fire-and-forget: record one scored interview answer. */
export function recordInterview(entry: { role?: string; question: string; score: number; source?: 'practice' | 'career-ops' }) {
  workspaceAction({ action: 'interview.add', ...entry }).catch(() => {});
}

export function useWorkspace() {
  const [data, setData] = useState<Workspace>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetch('/api/workspace')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => live && setData(d))
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);
  const act = useCallback(async (body: Record<string, unknown>) => {
    const next = await workspaceAction(body);
    setData(next);
    return next;
  }, []);
  return { data, loading, act };
}

/** Read the "Score: N/5" line from AI interview feedback. */
export function scoreFromFeedback(text: string | null | undefined): number | null {
  const m = /score[^0-9]{0,6}([0-5](?:\.\d)?)\s*\/\s*5/i.exec(text || '');
  return m ? Number(m[1]) : null;
}
