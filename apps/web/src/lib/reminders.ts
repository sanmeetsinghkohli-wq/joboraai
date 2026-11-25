import type { LiveApplication } from '@/context/AppDataContext';
import { normalizeStatus } from './status';

export type ReminderKind = 'interview' | 'deadline' | 'followup';

export interface Reminder {
  appId: string;
  kind: ReminderKind;
  /** ISO date or date-time. */
  date: string;
  title: string;
  detail: string;
  /** Whole days from today; negative means overdue. */
  days: number;
}

const DAY = 86_400_000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole days between today and a date (date-only strings are read as local dates). */
export function daysFromToday(iso: string): number {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return Number.NaN;
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return Math.round((day.getTime() - startOfToday()) / DAY);
}

export function relativeDay(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days overdue`;
}

export function formatDate(iso?: string, withTime = false): string {
  if (!iso) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(withTime && iso.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Everything that needs attention in the next week, plus anything overdue. */
export function getReminders(apps: LiveApplication[], horizonDays = 7): Reminder[] {
  const out: Reminder[] = [];
  for (const a of apps) {
    const stage = normalizeStatus(a.status);
    const role = `${a.title} at ${a.company}`;

    if (a.interviewAt && ['Assessment', 'Interview'].includes(stage)) {
      const days = daysFromToday(a.interviewAt);
      if (days >= 0 && days <= horizonDays) {
        out.push({ appId: a.id, kind: 'interview', date: a.interviewAt, days, title: `Interview ${relativeDay(days)}`, detail: role });
      }
    }

    if (a.deadline && ['Interested', 'Preparing'].includes(stage)) {
      const days = daysFromToday(a.deadline);
      if (days <= horizonDays && days >= -1) {
        out.push({
          appId: a.id,
          kind: 'deadline',
          date: a.deadline,
          days,
          title: days < 0 ? 'Deadline passed' : `Applications close ${relativeDay(days)}`,
          detail: role,
        });
      }
    }

    if (a.followUpAt && ['Applied', 'Assessment'].includes(stage)) {
      const days = daysFromToday(a.followUpAt);
      if (days <= 2) {
        out.push({
          appId: a.id,
          kind: 'followup',
          date: a.followUpAt,
          days,
          title:
            days < 0
              ? `Follow-up overdue by ${-days} day${days === -1 ? '' : 's'}`
              : days === 0
                ? 'Follow up today'
                : `Follow up ${relativeDay(days)}`,
          detail: role,
        });
      }
    }
  }
  return out.filter((r) => !Number.isNaN(r.days)).sort((a, b) => a.days - b.days);
}
