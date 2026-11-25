'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlarmClock, CalendarClock, Download, Plus, Search, Send, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useToast } from '@/components/providers';
import { Button, ButtonLink, IconButton } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Segmented,
  Select,
} from '@/components/ui/primitives';
import { useAppData, type LiveApplication } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { csvCell, downloadFile } from '@/lib/format';
import { APPLICATION_STATUSES, STATUS_HINT, STATUS_TONE, normalizeStatus, type ApplicationStatus } from '@/lib/status';
import { daysFromToday, formatDate, getReminders, relativeDay } from '@/lib/reminders';

function StatusSelect({
  app,
  onChange,
  className,
}: {
  app: LiveApplication;
  onChange: (status: ApplicationStatus) => void;
  className?: string;
}) {
  return (
    <>
      <label htmlFor={`status-${app.id}`} className="sr-only">
        Stage for {app.title} at {app.company}
      </label>
      <Select
        id={`status-${app.id}`}
        value={normalizeStatus(app.status)}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        className={cn('h-9 py-0 text-sm', className)}
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </>
  );
}

export default function ApplicationsPage() {
  const { applications, addApplication, updateApplicationStatus, deleteApplication } = useAppData();
  const { addToast } = useToast();

  const [view, setView] = useState<'board' | 'list'>('board');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<LiveApplication | null>(null);
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) => `${a.title} ${a.company} ${a.location}`.toLowerCase().includes(q));
  }, [applications, query]);

  const reminders = useMemo(() => getReminders(applications), [applications]);

  const columns = APPLICATION_STATUSES.map((s) => ({
    status: s,
    items: filtered.filter((a) => normalizeStatus(a.status) === s),
  }));

  const move = async (app: LiveApplication, next: ApplicationStatus) => {
    if (normalizeStatus(app.status) === next) return;
    await updateApplicationStatus(app.id, next);
    addToast({ title: `Moved to ${next}`, description: `${app.title} at ${app.company}` });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !company.trim()) {
      setFormError('Enter both a job title and a company.');
      return;
    }
    setSaving(true);
    const created = await addApplication({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      status,
      deadline,
    });
    setSaving(false);
    if (!created) {
      setFormError('The application could not be saved. Please try again.');
      return;
    }
    setAddOpen(false);
    setTitle('');
    setCompany('');
    setLocation('');
    setStatus('Applied');
    setDeadline('');
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const removed = toDelete;
    setToDelete(null);
    await deleteApplication(removed.id);
    addToast({ title: 'Application removed', description: `${removed.title} at ${removed.company}` });
  };

  const exportCsv = () => {
    const header = ['Title', 'Company', 'Location', 'Stage', 'Added', 'Applied on', 'Deadline', 'Interview', 'Follow up', 'Salary', 'Contact', 'Next step', 'Notes'];
    const rows = applications.map((a) =>
      [
        a.title, a.company, a.location, normalizeStatus(a.status), a.appliedAt, a.appliedOn || '', a.deadline || '',
        a.interviewAt || '', a.followUpAt || '', a.salary || '', a.recruiterEmail, a.nextAction, a.notes || '',
      ]
        .map(csvCell)
        .join(',')
    );
    downloadFile('jobora-applications.csv', [header.map(csvCell).join(','), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
  };

  return (
    <AppShell wide>
      <PageHeader
        title="Applications"
        description="Every role you have saved or applied to, by stage. Drag a card or use its stage menu when something changes."
        actions={
          <>
            {applications.length > 0 && (
              <Button variant="secondary" onClick={exportCsv}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </Button>
            )}
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add application
            </Button>
          </>
        }
      />

      {applications.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<Send className="h-6 w-6" />}
            title="No applications yet"
            action={
              <>
                <ButtonLink href="/jobs">Browse jobs</ButtonLink>
                <Button variant="secondary" onClick={() => setAddOpen(true)}>
                  Add one manually
                </Button>
              </>
            }
          >
            When you apply to a role, track it here to follow it from Applied through to Offer.
          </EmptyState>
        </Card>
      ) : (
        <>
          {reminders.length > 0 && (
            <section aria-label="Needs attention" className="mb-4 rounded-lg border border-coral-200 bg-coral-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-coral-700">
                <AlarmClock className="h-4 w-4" aria-hidden="true" /> Needs attention
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {reminders.slice(0, 6).map((r) => (
                  <li key={`${r.appId}-${r.kind}`}>
                    <Link
                      href={`/applications/${r.appId}`}
                      className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-paper px-3 py-1.5 text-sm hover:border-coral"
                    >
                      <span className={cn('font-semibold', r.days < 0 ? 'text-danger' : 'text-coral-700')}>{r.title}</span>
                      <span className="text-ink-muted">{r.detail}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-72">
              <label htmlFor="app-search" className="sr-only">
                Filter applications
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              />
              <Input
                id="app-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by title or company"
                className="pl-10"
              />
            </div>
            <Segmented
              label="Layout"
              value={view}
              onChange={setView}
              options={[
                { value: 'board', label: 'Board' },
                { value: 'list', label: 'List' },
              ]}
            />
          </div>

          {filtered.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="Nothing matches that filter"
                action={
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    Clear filter
                  </Button>
                }
              />
            </Card>
          ) : view === 'board' ? (
            <div className="scrollbar-none -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              <div className="flex gap-3">
                {columns.map(({ status: col, items }) => (
                  <section
                    key={col}
                    aria-label={`${col}, ${items.length}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(col);
                    }}
                    onDragLeave={() => setDragOver((d) => (d === col ? null : d))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(null);
                      const app = applications.find((a) => a.id === e.dataTransfer.getData('text/plain'));
                      if (app) move(app, col);
                    }}
                    className={cn(
                      'flex min-h-[14rem] w-64 shrink-0 flex-col rounded-lg border p-2.5 transition-colors',
                      dragOver === col ? 'border-coral bg-coral-50' : 'border-line bg-sand/60'
                    )}
                  >
                    <header className="px-1.5 pb-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Badge tone={STATUS_TONE[col]}>{col}</Badge>
                        <span className="text-sm tabular-nums text-ink-subtle">{items.length}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-subtle">{STATUS_HINT[col]}</p>
                    </header>
                    <ul className="flex flex-1 flex-col gap-2">
                      {items.map((app) => (
                        <li
                          key={app.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', app.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="cursor-grab rounded border border-line bg-paper p-3 shadow-card active:cursor-grabbing"
                        >
                          <Link
                            href={`/applications/${app.id}`}
                            className="block text-sm font-semibold leading-snug text-ink hover:text-plum hover:underline"
                          >
                            {app.title}
                          </Link>
                          <p className="mt-0.5 truncate text-sm text-ink-muted">{app.company}</p>
                          <p className="mt-1 text-xs text-ink-subtle">
                            {[app.location, app.appliedAt].filter(Boolean).join(' · ')}
                          </p>
                          <DateChips app={app} />
                          <StatusSelect app={app} onChange={(s) => move(app, s)} className="mt-2.5" />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <Card padded={false} className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="border-b border-line bg-ivory text-xs uppercase tracking-[0.06em] text-ink-subtle">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Role
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Location
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Added
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Dates
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Stage
                      </th>
                      <th scope="col" className="px-3 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map((app) => (
                      <tr key={app.id} className="hover:bg-ivory/60">
                        <td className="px-5 py-3">
                          <Link href={`/applications/${app.id}`} className="font-semibold text-ink hover:text-plum hover:underline">
                            {app.title}
                          </Link>
                          <p className="text-ink-muted">{app.company}</p>
                        </td>
                        <td className="px-3 py-3 text-ink-muted">{app.location || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-ink-muted">{app.appliedAt || '—'}</td>
                        <td className="px-3 py-3">
                          <DateChips app={app} />
                        </td>
                        <td className="px-3 py-3">
                          <StatusSelect app={app} onChange={(s) => move(app, s)} className="w-36" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <IconButton label={`Remove ${app.title} at ${app.company}`} onClick={() => setToDelete(app)}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add an application"
        description="Track a role you applied to outside Jobora."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-app-form" loading={saving}>
              Add
            </Button>
          </>
        }
      >
        <form id="add-app-form" onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Job title" htmlFor="app-title" error={formError}>
            <Input id="app-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Company" htmlFor="app-company">
            <Input id="app-company" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </Field>
          <Field label="Location" htmlFor="app-location" optional>
            <Input id="app-location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Application deadline" htmlFor="app-deadline" optional>
            <Input id="app-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Stage" htmlFor="app-stage">
            <Select id="app-stage" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Remove this application?"
        description={toDelete ? `${toDelete.title} at ${toDelete.company} will be removed from your tracker. This cannot be undone.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">The role itself stays in the job list if it is still live.</p>
      </Modal>
    </AppShell>
  );
}

/** Small date chips for a card: interview, deadline and follow-up. */
function DateChips({ app }: { app: LiveApplication }) {
  const chips: Array<{ key: string; label: string; urgent: boolean }> = [];
  if (app.interviewAt) {
    const d = daysFromToday(app.interviewAt);
    if (d >= 0) chips.push({ key: 'i', label: `Interview ${formatDate(app.interviewAt, true)}`, urgent: d <= 2 });
  }
  if (app.deadline && ['Interested', 'Preparing'].includes(normalizeStatus(app.status))) {
    const d = daysFromToday(app.deadline);
    chips.push({ key: 'd', label: d < 0 ? 'Deadline passed' : `Closes ${relativeDay(d)}`, urgent: d <= 3 });
  }
  if (app.followUpAt && ['Applied', 'Assessment'].includes(normalizeStatus(app.status))) {
    const d = daysFromToday(app.followUpAt);
    chips.push({ key: 'f', label: d <= 0 ? 'Follow up now' : `Follow up ${formatDate(app.followUpAt)}`, urgent: d <= 0 });
  }
  if (chips.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span
          key={c.key}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            c.urgent ? 'bg-coral-100 text-coral-700' : 'bg-plum-50 text-plum'
          )}
        >
          <CalendarClock className="h-3 w-3" aria-hidden="true" />
          {c.label}
        </span>
      ))}
    </div>
  );
}
