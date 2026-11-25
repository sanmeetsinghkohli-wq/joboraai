'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarPlus, Mail, Mic, Send, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { CompanyInitial } from '@/components/JobRow';
import { useToast } from '@/components/providers';
import { Button, ButtonLink } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Badge, Card, CardTitle, EmptyState, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { APPLICATION_STATUSES, STATUS_TONE, normalizeStatus, type ApplicationStatus } from '@/lib/status';
import { downloadFile } from '@/lib/format';
import { formatDate } from '@/lib/reminders';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { applications, jobs, setSelectedJob, updateApplicationStatus, updateApplicationDetails, deleteApplication } =
    useAppData();
  const { addToast } = useToast();

  const id = params?.id ? String(params.id) : '';
  const app = applications.find((a) => a.id === id) || null;
  const job = app ? jobs.find((j) => j.id === app.jobId) || null : null;

  const [nextAction, setNextAction] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [appliedOn, setAppliedOn] = useState('');
  const [deadline, setDeadline] = useState('');
  const [interviewAt, setInterviewAt] = useState('');
  const [followUpAt, setFollowUpAt] = useState('');
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!app) return;
    setNextAction(app.nextAction || '');
    setContactName(app.recruiterName || '');
    setContactEmail(app.recruiterEmail || '');
    setAppliedOn(app.appliedOn || '');
    setDeadline(app.deadline || '');
    setInterviewAt((app.interviewAt || '').slice(0, 16));
    setFollowUpAt(app.followUpAt || '');
    setSalary(app.salary || '');
    setNotes(app.notes || '');
    // Reset the form only when a different application is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id]);

  if (!app) {
    return (
      <AppShell>
        <Card padded={false}>
          <EmptyState
            icon={<Send className="h-6 w-6" />}
            title="Application not found"
            action={<ButtonLink href="/applications">Back to applications</ButtonLink>}
          >
            It may have been removed, or the link is out of date.
          </EmptyState>
        </Card>
      </AppShell>
    );
  }

  const status = normalizeStatus(app.status);
  const dirty =
    nextAction !== (app.nextAction || '') ||
    contactName !== (app.recruiterName || '') ||
    contactEmail !== (app.recruiterEmail || '') ||
    appliedOn !== (app.appliedOn || '') ||
    deadline !== (app.deadline || '') ||
    interviewAt !== (app.interviewAt || '').slice(0, 16) ||
    followUpAt !== (app.followUpAt || '') ||
    salary !== (app.salary || '') ||
    notes !== (app.notes || '');

  const saveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateApplicationDetails(app.id, {
      nextAction: nextAction.trim(),
      recruiterName: contactName.trim(),
      recruiterEmail: contactEmail.trim(),
      appliedOn,
      deadline,
      interviewAt,
      followUpAt,
      salary: salary.trim(),
      notes,
    });
    setSaving(false);
    addToast({ title: 'Saved' });
  };

  const remove = async () => {
    setConfirmDelete(false);
    await deleteApplication(app.id);
    addToast({ title: 'Application removed', description: `${app.title} at ${app.company}` });
    router.push('/applications');
  };

  const addInterviewToCalendar = () => {
    if (!app.interviewAt) return;
    const start = new Date(app.interviewAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (t: string) => t.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jobora AI//Tracker//EN',
      'BEGIN:VEVENT',
      `UID:${app.id}-interview@jobora`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`Interview: ${app.title} at ${app.company}`)}`,
      `DESCRIPTION:${esc(app.nextAction || 'Prepare with Jobora interview practice.')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Interview in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    downloadFile(`interview-${app.company.replace(/\W+/g, '-').toLowerCase()}.ics`, ics, 'text/calendar;charset=utf-8');
  };

  const useJob = () => {
    if (job) setSelectedJob(job);
  };

  return (
    <AppShell>
      <Link
        href="/applications"
        className="mb-4 inline-flex h-9 items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-plum"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Applications
      </Link>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <CompanyInitial name={app.company} className="h-12 w-12 text-xl" />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl text-plum sm:text-3xl">{app.title}</h1>
            <p className="mt-0.5 text-ink-muted">
              {[app.company, app.location].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-subtle">
              <Badge tone={STATUS_TONE[status]}>{status}</Badge>
              {app.appliedAt && <span>Added {app.appliedAt}</span>}
            </div>
          </div>
        </div>
        <div className="w-full sm:w-44">
          <Field label="Stage" htmlFor="detail-stage">
            <Select
              id="detail-stage"
              value={status}
              onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card as="section">
            <CardTitle>Details</CardTitle>
            <form onSubmit={saveNotes} className="mt-4 flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Applied on" htmlFor="detail-applied" optional hint="Filled in when you move it to Applied.">
                  <Input id="detail-applied" type="date" value={appliedOn} onChange={(e) => setAppliedOn(e.target.value)} />
                </Field>
                <Field label="Application deadline" htmlFor="detail-deadline" optional>
                  <Input id="detail-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </Field>
                <Field label="Interview" htmlFor="detail-interview" optional>
                  <Input id="detail-interview" type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} />
                </Field>
                <Field label="Follow up on" htmlFor="detail-follow" optional hint="We suggest 7 business days after applying.">
                  <Input id="detail-follow" type="date" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
                </Field>
              </div>
              <Field label="Salary or offer details" htmlFor="detail-salary" optional hint="Private to you.">
                <Input id="detail-salary" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. AED 14,000 / month + housing" />
              </Field>
              <Field label="Next step" htmlFor="detail-next" optional hint="For example: follow up on Monday, or send portfolio.">
                <Textarea
                  id="detail-next"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  rows={3}
                  aria-describedby="detail-next-hint"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact name" htmlFor="detail-contact" optional>
                  <Input id="detail-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </Field>
                <Field label="Contact email" htmlFor="detail-email" optional>
                  <Input
                    id="detail-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Notes" htmlFor="detail-notes" optional>
                <Textarea id="detail-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              <div>
                <Button type="submit" loading={saving} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          <Card as="section">
            <CardTitle>History</CardTitle>
            {app.timeline.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No history recorded.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l border-line pl-5">
                {app.timeline.map((event, i) => (
                  <li key={i} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-coral"
                    />
                    <p className="text-sm font-medium text-ink">{event.title}</p>
                    <p className="text-xs text-ink-subtle">{event.timestamp}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card as="section">
            <CardTitle>Prepare</CardTitle>
            <div className="mt-4 flex flex-col gap-2">
              {job && (
                <ButtonLink href={`/jobs?selected=${encodeURIComponent(job.id)}`} variant="secondary">
                  View the listing
                </ButtonLink>
              )}
              <ButtonLink href="/email-composer" variant="secondary" onClick={useJob}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                Draft a follow-up email
              </ButtonLink>
              {app.interviewAt && (
                <Button variant="secondary" onClick={addInterviewToCalendar}>
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  Add interview to calendar ({formatDate(app.interviewAt, true)})
                </Button>
              )}
              <ButtonLink href="/interview" variant="secondary" onClick={useJob}>
                <Mic className="h-4 w-4" aria-hidden="true" />
                Practise for interview
              </ButtonLink>
            </div>
            {!job && (
              <p className="mt-3 text-xs text-ink-subtle">
                The original listing is not in the current job feed, so drafts will not be pre-filled for this role.
              </p>
            )}
          </Card>

          <Card as="section">
            <CardTitle>Remove</CardTitle>
            <p className="mt-2 text-sm text-ink-muted">Delete this application from your tracker.</p>
            <Button variant="danger" className="mt-4" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove application
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="Remove this application?"
        description="This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={remove}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          {app.title} at {app.company} will be deleted along with its notes and history.
        </p>
      </Modal>
    </AppShell>
  );
}
