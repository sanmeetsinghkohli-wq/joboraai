'use client';

import { Inbox } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { ButtonLink } from '@/components/ui/button';
import { Card, EmptyState, PageHeader } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { timeAgo } from '@/lib/format';

export default function ActivityPage() {
  const { activities } = useAppData();

  return (
    <AppShell>
      <PageHeader title="Activity" description="What you have done in Jobora recently, newest first. Kept in this browser." />
      <Card padded={false} className="max-w-3xl">
        {activities.length === 0 ? (
          <EmptyState icon={<Inbox className="h-6 w-6" />} title="Nothing yet" action={<ButtonLink href="/jobs">Browse jobs</ButtonLink>}>
            Saving roles, tracking applications and writing drafts will show up here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-4">
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
    </AppShell>
  );
}
