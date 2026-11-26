'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Download, Mail, RotateCcw, Send } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { JobPicker } from '@/components/JobPicker';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, Field, Input, Notice, PageHeader, Segmented, Textarea } from '@/components/ui/primitives';
import { useAppData, type LiveJob, type LiveUserProfile } from '@/context/AppDataContext';
import { downloadFile, slug } from '@/lib/format';

type Kind = 'application' | 'followup';

function buildBody(kind: Kind, profile: LiveUserProfile, job: LiveJob | null, contact: string): string {
  const greeting = contact.trim() ? `Dear ${contact.trim().split(/\s+/)[0]},` : 'Hello,';
  const role = job?.title || profile.targetRole || '[role]';
  const company = job?.company || '[company]';
  const sign = ['Best regards,', profile.fullName || '[Your name]', [profile.phone, profile.linkedin].filter(Boolean).join(' · ')]
    .filter(Boolean)
    .join('\n');

  if (kind === 'followup') {
    return [
      greeting,
      '',
      `I recently applied for the ${role} position at ${company} and wanted to follow up on my application.`,
      '',
      `I remain very interested in the role and would be glad to share anything else that would help.`,
      '',
      'Thank you for your time.',
      '',
      sign,
    ].join('\n');
  }

  const matched = (job?.matchedSkills || []).slice(0, 3);
  return [
    greeting,
    '',
    `I am writing to apply for the ${role} position at ${company}.${
      matched.length ? ` The role calls for ${matched.join(', ')}, which I work with.` : ''
    }`,
    '',
    profile.summary || '[Add a sentence or two about your most relevant experience.]',
    '',
    'I have attached my CV and would welcome the chance to talk further.',
    '',
    sign,
  ].join('\n');
}

export default function EmailPage() {
  const { profile, selectedJob, logActivity, applications } = useAppData();
  const router = useRouter();
  const [queueing, setQueueing] = useState(false);
  const { addToast } = useToast();

  const [kind, setKind] = useState<Kind>('application');
  const [to, setTo] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState(false);

  // Contact details come only from the listing; nothing is guessed.
  useEffect(() => {
    setTo(selectedJob?.recruiterEmail || '');
    setContact(selectedJob?.recruiterName || '');
  }, [selectedJob?.id, selectedJob?.recruiterEmail, selectedJob?.recruiterName]);

  const generated = useMemo(() => buildBody(kind, profile, selectedJob, contact), [kind, profile, selectedJob, contact]);
  const generatedSubject = useMemo(() => {
    const role = selectedJob?.title || profile.targetRole || 'your open role';
    const prefix = kind === 'followup' ? 'Following up: ' : 'Application: ';
    return `${prefix}${role}${profile.fullName ? ` — ${profile.fullName}` : ''}`;
  }, [kind, selectedJob, profile.targetRole, profile.fullName]);

  useEffect(() => {
    if (!touched) {
      setBody(generated);
      setSubject(generatedSubject);
    }
  }, [generated, generatedSubject, touched]);

  const validTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());
  const placeholders = (body.match(/\[[^\]]+\]/g) || []).length;

  const openMail = () => {
    const href = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    logActivity('mail', 'Opened an email draft', selectedJob ? selectedJob.company : subject);
  };

  const addToOutbox = async () => {
    setQueueing(true);
    const linked = selectedJob ? applications.find((a) => a.jobId === selectedJob.id) : undefined;
    const res = await fetch('/api/outbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: to.trim(), subject, body, kind, applicationId: linked?.id }),
    });
    const data = await res.json().catch(() => ({}));
    setQueueing(false);
    if (!res.ok) {
      addToast({ type: 'error', title: 'Could not add to outbox', description: data?.error?.message });
      return;
    }
    logActivity('mail', 'Added an email to your outbox', selectedJob ? selectedJob.company : subject);
    addToast({ type: 'success', title: 'Added to your outbox', description: 'Review it there before you send it.' });
    router.push('/outbox');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      addToast({ title: 'Copied to clipboard' });
    } catch {
      addToast({ type: 'error', title: 'Could not copy', description: 'Select the text and copy it manually.' });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Email"
        description="Draft an application or follow-up email. Add it to your outbox to review it, or open it in your own mail app."
      />

      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <JobPicker id="email-job" label="About" className="flex-1" />
            <Segmented
              label="Email type"
              value={kind}
              onChange={(k) => {
                setKind(k);
                setTouched(false);
              }}
              options={[
                { value: 'application', label: 'Application' },
                { value: 'followup', label: 'Follow-up' },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="To"
              htmlFor="email-to"
              error={to && !validTo ? 'Enter a valid email address.' : null}
              hint={!to ? 'This listing has no contact email. Add one if you have it.' : undefined}
            >
              <Input id="email-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Contact name" htmlFor="email-contact" optional>
              <Input id="email-contact" value={contact} onChange={(e) => setContact(e.target.value)} />
            </Field>
          </div>
          <Field label="Subject" htmlFor="email-subject">
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setTouched(true);
              }}
            />
          </Field>
          <Field label="Message" htmlFor="email-body">
            <Textarea
              id="email-body"
              rows={14}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setTouched(true);
              }}
            />
          </Field>
        </Card>

        {placeholders > 0 && (
          <Notice tone="warn">
            {placeholders} placeholder{placeholders === 1 ? '' : 's'} in [square brackets] still to replace.
            {!profile.summary && (
              <>
                {' '}
                <Link href="/profile#summary" className="font-semibold text-plum underline underline-offset-4">
                  Add a summary
                </Link>{' '}
                to your profile to fill the middle paragraph.
              </>
            )}
          </Notice>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={addToOutbox} loading={queueing} disabled={!validTo || !body.trim()}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Add to outbox
          </Button>
          <Button variant="secondary" onClick={openMail} disabled={!validTo || !body.trim()}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Open in mail app
          </Button>
          <Button variant="secondary" onClick={copy}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(
                `${slug(subject)}.eml`,
                `To: ${to}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`,
                'message/rfc822'
              )
            }
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download .eml
          </Button>
          <Button variant="ghost" onClick={() => setTouched(false)} disabled={!touched}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset draft
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
