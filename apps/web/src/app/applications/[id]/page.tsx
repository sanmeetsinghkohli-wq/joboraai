'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Mic, Send, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { CompanyInitial } from '@/components/JobRow';
import { useToast } from '@/components/providers';
import { Button, ButtonLink } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Badge, Card, CardTitle, EmptyState, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { APPLICATION_STATUSES, STATUS_TONE, normalizeStatus, type ApplicationStatus } from '@/lib/status';

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
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!app) return;
    setNextAction(app.nextAction || '');
    setContactName(app.recruiterName || '');
    setContactEmail(app.recruiterEmail || '');
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
    contactEmail !== (app.recruiterEmail || '');

  const saveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateApplicationDetails(app.id, {
      nextAction: nextAction.trim(),
      recruiterName: contactName.trim(),
      recruiterEmail: contactEmail.trim(),
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
            <CardTitle>Notes and contact</CardTitle>
            <form onSubmit={saveNotes} className="mt-4 flex flex-col gap-4">
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
