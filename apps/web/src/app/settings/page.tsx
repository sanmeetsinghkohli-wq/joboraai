'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useToast } from '@/components/providers';
import { Button, ButtonLink } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Card, CardTitle, Notice, PageHeader } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { downloadFile } from '@/lib/format';


export default function SettingsPage() {
  const router = useRouter();
  const { profile, resetProfileData, signOut, applications, savedJobIds } = useAppData();
  const { addToast } = useToast();

  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    downloadFile(
      'jobora-data.json',
      JSON.stringify({ exportedAt: new Date().toISOString(), profile, savedJobIds, applications }, null, 2),
      'application/json'
    );
  };

  const logOut = async () => {
    await signOut();
    router.replace('/auth?tab=login');
  };

  const reset = async () => {
    setConfirmReset(false);
    await resetProfileData();
    addToast({ title: 'Your data was cleared' });
    router.push('/onboarding');
  };

  return (
    <AppShell>
      <PageHeader title="Account settings" description="Your sign-in, your data and your session." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card as="section">
            <CardTitle>Account</CardTitle>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-ink-muted">Name</dt>
              <dd className="font-medium text-ink">{profile.fullName || '—'}</dd>
              <dt className="text-ink-muted">Sign-in email</dt>
              <dd className="font-medium text-ink">{profile.email || '—'}</dd>
            </dl>
          </Card>
          <Card as="section">
            <CardTitle>Your career profile</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Your skills, education, experience, projects and goals now live on My profile, where you can also import them
              from your CV.
            </p>
            <ButtonLink href="/profile" className="mt-4">
              Open my profile
            </ButtonLink>
          </Card>
        </div>

        <div className="space-y-6">
          <Card as="section">
            <CardTitle>Your data</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">Download a copy of your profile, saved roles and applications.</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={exportData}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export as JSON
            </Button>
          </Card>

          <Card as="section">
            <CardTitle>Session</CardTitle>
            <Button variant="secondary" className="mt-4 w-full" onClick={logOut}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </Card>

          <Card as="section">
            <CardTitle>Start over</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">Clear your profile, saved roles, applications and drafts. Your account stays.</p>
            <Button variant="danger" className="mt-4 w-full" onClick={() => setConfirmReset(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear my data
            </Button>
          </Card>

          <Notice tone="info">
            Your account, profile and applications are stored securely on our database and stay in sync across your
            devices.
          </Notice>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        size="sm"
        title="Clear all your data?"
        description="Your profile, saved roles, applications and drafts will be deleted. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={reset}>
              Clear everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">Consider exporting a copy first.</p>
      </Modal>
    </AppShell>
  );
}
