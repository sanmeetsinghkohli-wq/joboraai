'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Inbox, Loader2, Mail, Send, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useToast } from '@/components/providers';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge, Card, CardTitle, EmptyState, Field, Input, Notice, PageHeader, Textarea } from '@/components/ui/primitives';
import { timeAgo } from '@/lib/format';

interface OutboxItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  applicationId?: string;
  kind: 'application' | 'outreach' | 'followup' | 'other';
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

interface GmailStatus {
  available: boolean;
  connected: boolean;
  email: string;
}

const KIND_LABEL: Record<OutboxItem['kind'], string> = {
  application: 'Application',
  outreach: 'Outreach',
  followup: 'Follow-up',
  other: 'Email',
};

export default function OutboxPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState<OutboxItem[] | null>(null);
  const [gmail, setGmail] = useState<GmailStatus | null>(null);

  const load = useCallback(async () => {
    const [o, g] = await Promise.all([
      fetch('/api/outbox').then((r) => r.json()).catch(() => ({ items: [] })),
      fetch('/api/integrations/gmail/status').then((r) => r.json()).catch(() => null),
    ]);
    setItems(Array.isArray(o.items) ? o.items : []);
    setGmail(g);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = (items ?? []).filter((i) => i.status !== 'sent');
  const sent = (items ?? []).filter((i) => i.status === 'sent');

  const replace = (item: OutboxItem) => setItems((all) => (all ?? []).map((i) => (i.id === item.id ? item : i)));

  return (
    <AppShell>
      <PageHeader
        title="Outbox"
        description={
          gmail && !gmail.available
            ? 'Emails Jobora has prepared. Review each one, then copy it or open it in your own mail app to send.'
            : 'Emails Jobora has prepared. Nothing is sent until you press Approve & send on that email.'
        }
        actions={
          <ButtonLink href="/email-composer" variant="secondary">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Write an email
          </ButtonLink>
        }
      />

      {gmail && !gmail.connected && gmail.available && (
        <Notice tone="info" className="mb-6" title={gmail.available ? 'Connect Gmail to send from here' : 'Sending from Jobora is not switched on yet'}>
          {gmail.available ? (
            <>
              Emails go out from your own Gmail address after you approve each one. Jobora only gets permission to send,
              not to read your inbox.{' '}
              <a href="/api/integrations/gmail/connect" className="font-semibold text-plum underline underline-offset-4">
                Connect Gmail
              </a>
            </>
          ) : (
            'You can still copy each email or open it in your own mail app.'
          )}
        </Notice>
      )}
      {gmail?.connected && (
        <p className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" /> Sending as <strong className="text-ink">{gmail.email}</strong>
        </p>
      )}

      {items === null ? (
        <Card className="flex items-center gap-3 text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your outbox…
        </Card>
      ) : pending.length === 0 && sent.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="Your outbox is empty"
            action={<ButtonLink href="/email-composer">Write an email</ButtonLink>}
          >
            Draft an application or follow-up email and add it here to review before it goes out.
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section aria-labelledby="waiting">
              <h2 id="waiting" className="mb-3 font-serif text-xl text-plum">
                Waiting for your approval ({pending.length})
              </h2>
              <ul className="space-y-4">
                {pending.map((item) => (
                  <DraftCard
                    key={item.id}
                    item={item}
                    canSend={Boolean(gmail?.connected)}
                    gmailAvailable={Boolean(gmail?.available)}
                    onChange={replace}
                    onRemoved={(id) => setItems((all) => (all ?? []).filter((i) => i.id !== id))}
                    onSent={(it) => {
                      replace(it);
                      addToast({ type: 'success', title: 'Email sent', description: `To ${it.to}` });
                    }}
                    onError={(m) => addToast({ type: 'error', title: 'Not sent', description: m })}
                  />
                ))}
              </ul>
            </section>
          )}

          {sent.length > 0 && (
            <section aria-labelledby="sent">
              <h2 id="sent" className="mb-3 font-serif text-xl text-plum">
                Sent
              </h2>
              <Card padded={false}>
                <ul className="divide-y divide-line">
                  {sent.map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{i.subject}</p>
                        <p className="truncate text-sm text-ink-muted">To {i.to}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge tone="success">{KIND_LABEL[i.kind]}</Badge>
                        <p className="mt-1 text-xs text-ink-subtle">{i.sentAt ? timeAgo(i.sentAt) : ''}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}

function DraftCard({
  item,
  canSend,
  gmailAvailable,
  onChange,
  onRemoved,
  onSent,
  onError,
}: {
  item: OutboxItem;
  canSend: boolean;
  gmailAvailable: boolean;
  onChange: (item: OutboxItem) => void;
  onRemoved: (id: string) => void;
  onSent: (item: OutboxItem) => void;
  onError: (message: string) => void;
}) {
  const [to, setTo] = useState(item.to);
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.body);
  const [busy, setBusy] = useState<'save' | 'send' | null>(null);
  const dirty = to !== item.to || subject !== item.subject || body !== item.body;
  const placeholders = (body.match(/\[[^\]]+\]/g) || []).length;

  const save = async () => {
    const res = await fetch('/api/outbox', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, to: to.trim(), subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      onError(data?.error?.message || 'Could not save the draft.');
      return false;
    }
    onChange(data.item);
    return true;
  };

  const approveAndSend = async () => {
    setBusy('send');
    if (dirty && !(await save())) {
      setBusy(null);
      return;
    }
    const res = await fetch('/api/outbox/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok && data.item) onSent(data.item);
    else {
      if (data.item) onChange(data.item);
      onError(data?.error?.message || 'The email was not sent.');
    }
  };

  const discard = async () => {
    await fetch(`/api/outbox?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    onRemoved(item.id);
  };

  return (
    <li>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge tone="plum">{KIND_LABEL[item.kind]}</Badge>
            <span className="text-xs text-ink-subtle">Added {timeAgo(item.createdAt)}</span>
            {item.applicationId && (
              <Link href={`/applications/${item.applicationId}`} className="text-xs font-semibold text-plum underline-offset-4 hover:underline">
                View application
              </Link>
            )}
          </div>
        </div>
        {item.status === 'failed' && item.error && (
          <Notice tone="error" className="mb-4">
            {item.error}
          </Notice>
        )}
        <div className="grid gap-4">
          <Field label="To" htmlFor={`to-${item.id}`}>
            <Input id={`to-${item.id}`} type="email" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Subject" htmlFor={`sub-${item.id}`}>
            <Input id={`sub-${item.id}`} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Message" htmlFor={`body-${item.id}`}>
            <Textarea id={`body-${item.id}`} rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
        </div>
        {placeholders > 0 && (
          <Notice tone="warn" className="mt-4">
            Replace the {placeholders} [placeholder{placeholders === 1 ? '' : 's'}] before sending.
          </Notice>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {gmailAvailable && (
          <Button
            onClick={approveAndSend}
            loading={busy === 'send'}
            disabled={!canSend || placeholders > 0 || !to.trim() || !subject.trim() || !body.trim()}
            title={canSend ? undefined : 'Connect Gmail first'}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Approve &amp; send
          </Button>
          )}
          {dirty && (
            <Button
              variant="secondary"
              loading={busy === 'save'}
              onClick={async () => {
                setBusy('save');
                await save();
                setBusy(null);
              }}
            >
              Save changes
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Open in mail app
          </Button>
          <Button variant="ghost" onClick={discard}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Discard
          </Button>
        </div>
      </Card>
    </li>
  );
}
