'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail } from 'lucide-react';
import { useToast } from '@/components/providers';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardTitle, Notice } from '@/components/ui/primitives';

const RESULT: Record<string, { type: 'success' | 'error'; title: string; description?: string }> = {
  connected: { type: 'success', title: 'Gmail connected', description: 'You can now send approved emails from your outbox.' },
  declined: { type: 'error', title: 'Gmail was not connected', description: 'You cancelled on the Google screen.' },
  invalid: { type: 'error', title: 'That link expired', description: 'Start the connection again from this page.' },
  no_send_permission: { type: 'error', title: 'Send permission not granted', description: 'Tick the Gmail send box on the Google screen.' },
  no_refresh_token: { type: 'error', title: 'Google did not grant lasting access', description: 'Disconnect Jobora in your Google account and try again.' },
  failed: { type: 'error', title: 'Gmail could not be connected', description: 'Please try again in a moment.' },
  not_configured: { type: 'error', title: 'Gmail sending is not set up yet', description: 'It needs to be switched on for this site first.' },
};

/** Connect or disconnect the Gmail account approved emails are sent from. */
export function GmailConnectionCard() {
  const params = useSearchParams();
  const { addToast } = useToast();
  const [status, setStatus] = useState<{ available: boolean; connected: boolean; email: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/integrations/gmail/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    const result = params?.get('gmail');
    if (result && RESULT[result]) addToast(RESULT[result]);
    // Show once per redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const disconnect = async () => {
    setBusy(true);
    await fetch('/api/integrations/gmail/disconnect', { method: 'POST' });
    setStatus((s) => (s ? { ...s, connected: false, email: '' } : s));
    setBusy(false);
    addToast({ title: 'Gmail disconnected', description: 'Jobora can no longer send email for you.' });
  };

  // Hidden entirely until Gmail sending is configured for the site.
  if (status && !status.available) return null;

  return (
    <Card as="section">
      <CardTitle>Send from Gmail</CardTitle>
      {status?.connected ? (
        <>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" /> Connected as <strong>{status.email}</strong>
          </p>
          <p className="mt-1 text-sm text-ink-muted">Emails only go out after you press Approve &amp; send in your outbox.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/outbox" variant="secondary">
              Open outbox
            </ButtonLink>
            <Button variant="ghost" loading={busy} onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-muted">
            Connect Gmail to send approved applications and follow-ups from your own address. Jobora asks only for
            permission to send, never to read your inbox, and you approve every email.
          </p>
          {status && !status.available ? (
            <Notice tone="info" className="mt-4">
              Gmail sending is not switched on for this site yet.
            </Notice>
          ) : (
            <a
              href="/api/integrations/gmail/connect"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-plum px-5 text-sm font-semibold text-paper hover:bg-plum-600"
            >
              <Mail className="h-4 w-4" aria-hidden="true" /> Connect Gmail
            </a>
          )}
        </>
      )}
    </Card>
  );
}
