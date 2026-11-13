'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Card, CardTitle, Field, Input, Notice, PageHeader, Textarea } from '@/components/ui/primitives';
import { TagInput } from '@/components/ui/tag-input';
import { useAppData } from '@/context/AppDataContext';
import { downloadFile } from '@/lib/format';

interface Form {
  fullName: string;
  phone: string;
  location: string;
  targetRole: string;
  skills: string[];
  summary: string;
  linkedin: string;
  github: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile, updateProfile, resetProfileData, signOut, applications, savedJobIds } = useAppData();
  const { addToast } = useToast();

  const fromProfile = (): Form => ({
    fullName: profile.fullName,
    phone: profile.phone,
    location: profile.location,
    targetRole: profile.targetRole,
    skills: profile.skills,
    summary: profile.summary,
    linkedin: profile.linkedin,
    github: profile.github,
  });

  const [form, setForm] = useState<Form>(fromProfile);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setForm(fromProfile());
    // Reload the form when the stored profile changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(fromProfile()), [form, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({
      ...form,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      targetRole: form.targetRole.trim(),
      summary: form.summary.trim(),
      linkedin: form.linkedin.trim(),
      github: form.github.trim(),
    });
    setSaving(false);
    addToast({ title: 'Profile saved' });
  };

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
      <PageHeader title="Profile and settings" description="Everything Jobora uses to compare roles and draft your documents." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={save} className="space-y-6">
          <Card as="section">
            <CardTitle>About you</CardTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="set-name">
                <Input id="set-name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Email" htmlFor="set-email" hint="Your sign-in address.">
                <Input id="set-email" value={profile.email} readOnly disabled aria-describedby="set-email-hint" />
              </Field>
              <Field label="Phone" htmlFor="set-phone" optional>
                <Input id="set-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
              </Field>
              <Field label="City and country" htmlFor="set-location" optional>
                <Input id="set-location" value={form.location} onChange={(e) => set('location', e.target.value)} />
              </Field>
              <Field label="LinkedIn" htmlFor="set-linkedin" optional>
                <Input id="set-linkedin" value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
              </Field>
              <Field label="Portfolio or GitHub" htmlFor="set-github" optional>
                <Input id="set-github" value={form.github} onChange={(e) => set('github', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card as="section">
            <CardTitle>Your search</CardTitle>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Role you are looking for" htmlFor="set-role">
                <Input id="set-role" value={form.targetRole} onChange={(e) => set('targetRole', e.target.value)} />
              </Field>
              <Field label="Skills" htmlFor="set-skills" hint="Jobs are compared against this list. Press Enter after each skill.">
                <TagInput id="set-skills" value={form.skills} onChange={(v) => set('skills', v)} describedBy="set-skills-hint" />
              </Field>
              <Field label="Summary" htmlFor="set-summary" optional hint="Used at the top of your CV and in cover letters.">
                <Textarea id="set-summary" rows={4} value={form.summary} onChange={(e) => set('summary', e.target.value)} aria-describedby="set-summary-hint" />
              </Field>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save changes
            </Button>
            {dirty && <span className="text-sm text-ink-subtle">You have unsaved changes.</span>}
          </div>
        </form>

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
            Your data is currently kept on this server and in this browser. Durable storage is not set up yet, so a server
            restart can clear it — export a copy if it matters to you.
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
