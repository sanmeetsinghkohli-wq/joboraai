'use client';

import Link from 'next/link';
import { AlarmClock, CalendarClock, Inbox, MailCheck } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { formatDate, getReminders, type ReminderKind } from '@/lib/reminders';

const KIND_ICON: Record<ReminderKind, React.ComponentType<{ className?: string }>> = {
  interview: CalendarClock,
  deadline: AlarmClock,
  followup: MailCheck,
};

export default function NotificationsPage() {
  const { activities, applications } = useAppData();
  const reminders = getReminders(applications, 14);

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description="Interviews, deadlines and follow-ups from your tracker, then everything you have done recently."
      />

      <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_1fr]">
        <Card as="section" aria-labelledby="reminders">
          <CardTitle>
            <span id="reminders">Reminders</span>
          </CardTitle>
          {reminders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Nothing due in the next two weeks. Add interview dates, deadlines and follow-ups on an application and they
              will appear here and on your dashboard.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {reminders.map((r) => {
                const Icon = KIND_ICON[r.kind];
                return (
                  <li key={`${r.appId}-${r.kind}`}>
                    <Link href={`/applications/${r.appId}`} className="flex items-start gap-3 py-3 hover:text-plum">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          r.days < 0 ? 'bg-danger-100 text-danger' : r.days <= 1 ? 'bg-coral-100 text-coral-700' : 'bg-plum-50 text-plum'
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{r.title}</span>
                        <span className="block truncate text-sm text-ink-muted">{r.detail}</span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-subtle">{formatDate(r.date, r.kind === 'interview')}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card as="section" padded={false} aria-labelledby="activity">
          <h2 id="activity" className="px-5 pt-5 font-serif text-xl text-plum">
            Recent activity
          </h2>
          {activities.length === 0 ? (
            <EmptyState icon={<Inbox className="h-6 w-6" />} title="Nothing yet" action={<ButtonLink href="/jobs">Browse jobs</ButtonLink>}>
              Saving roles, tracking applications and writing drafts will show up here.
            </EmptyState>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {activities.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{a.title}</p>
                    {a.subtitle && <p className="truncate text-sm text-ink-muted">{a.subtitle}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-ink-subtle">{timeAgo(a.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
