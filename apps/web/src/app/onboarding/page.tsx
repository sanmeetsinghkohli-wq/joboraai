'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Card, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives';
import { TagInput } from '@/components/ui/tag-input';
import { cn } from '@/lib/cn';

const STEPS = ['About you', 'Your search', 'Your pitch'];

export default function OnboardingPage() {
  const router = useRouter();
  const { authStatus, profile, updateProfile, logActivity } = useAppData();

  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  useEffect(() => {
    if (authStatus === 'anonymous') router.replace('/auth?tab=login&next=/onboarding');
  }, [authStatus, router]);

  // Fill the form once from whatever is already saved.
  useEffect(() => {
    if (authStatus !== 'authenticated' || loaded) return;
    setFullName(profile.fullName);
    setLocation(profile.location);
    setPhone(profile.phone);
    setTargetRole(profile.targetRole);
    setSkills(profile.skills);
    setSummary(profile.summary);
    setLinkedin(profile.linkedin);
    setGithub(profile.github);
    setLoaded(true);
  }, [authStatus, loaded, profile]);

  const save = () =>
    updateProfile({
      fullName: fullName.trim(),
      location: location.trim(),
      phone: phone.trim(),
      targetRole: targetRole.trim(),
      skills,
      summary: summary.trim(),
      linkedin: linkedin.trim(),
      github: github.trim(),
    });

  const next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 0 && !fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (step === 1 && !targetRole.trim()) {
      setError('Add the role you are looking for so we can order jobs for you.');
      return;
    }
    setSaving(true);
    await save();
    setSaving(false);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      logActivity('check', 'Profile set up', targetRole.trim());
      router.push('/dashboard');
    }
  };

  const skip = async () => {
    setSaving(true);
    await save();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-ivory">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Jobora home">
          <Logo />
        </Link>
        <Button variant="ghost" size="sm" onClick={skip} disabled={saving || !loaded}>
          Skip for now
        </Button>
      </header>

      <main id="main" className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
        {/* Progress */}
        <ol className="mb-8 flex items-center gap-2" aria-label="Setup progress">
          {STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'current' : 'todo';
            return (
              <li key={label} className="flex flex-1 items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    state === 'done' && 'bg-success text-paper',
                    state === 'current' && 'bg-plum text-paper',
                    state === 'todo' && 'border border-line bg-paper text-ink-subtle'
                  )}
                >
                  {state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </span>
                <span className={cn('hidden text-sm sm:block', state === 'todo' ? 'text-ink-subtle' : 'font-medium text-plum')}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        {!loaded ? (
          <Skeleton className="h-80" />
        ) : (
          <Card as="section" className="animate-fade-up">
            <form onSubmit={next} className="flex flex-col gap-5">
              {step === 0 && (
                <>
                  <div>
                    <h1 className="font-serif text-2xl text-plum">About you</h1>
                    <p className="mt-1 text-sm text-ink-muted">These details head your CV and cover letters.</p>
                  </div>
                  <Field label="Full name" htmlFor="ob-name" error={error}>
                    <Input id="ob-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                  </Field>
                  <Field label="City and country" htmlFor="ob-location" optional hint="Used to show how close each role is to you.">
                    <Input
                      id="ob-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      autoComplete="address-level2"
                      aria-describedby="ob-location-hint"
                    />
                  </Field>
                  <Field label="Phone" htmlFor="ob-phone" optional>
                    <Input id="ob-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <h1 className="font-serif text-2xl text-plum">Your search</h1>
                    <p className="mt-1 text-sm text-ink-muted">
                      Jobs are ordered by how many of their listed skills appear here, so be specific.
                    </p>
                  </div>
                  <Field label="Role you are looking for" htmlFor="ob-role" error={error}>
                    <Input id="ob-role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
                  </Field>
                  <Field
                    label="Your skills"
                    htmlFor="ob-skills"
                    hint="Type a skill and press Enter. Only list skills you can back up."
                  >
                    <TagInput id="ob-skills" value={skills} onChange={setSkills} describedBy="ob-skills-hint" />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <h1 className="font-serif text-2xl text-plum">Your pitch</h1>
                    <p className="mt-1 text-sm text-ink-muted">
                      Optional, and editable any time. This becomes the opening of your CV and the middle of your cover
                      letters.
                    </p>
                  </div>
                  <Field label="Short summary" htmlFor="ob-summary" optional hint="Two or three sentences on what you do and what you are good at.">
                    <Textarea
                      id="ob-summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={5}
                      aria-describedby="ob-summary-hint"
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="LinkedIn" htmlFor="ob-linkedin" optional>
                      <Input id="ob-linkedin" type="url" inputMode="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                    </Field>
                    <Field label="Portfolio or GitHub" htmlFor="ob-github" optional>
                      <Input id="ob-github" type="url" inputMode="url" value={github} onChange={(e) => setGithub(e.target.value)} />
                    </Field>
                  </div>
                </>
              )}

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-5">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setError(null);
                    setStep(Math.max(0, step - 1));
                  }}
                  disabled={step === 0 || saving}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
                <Button type="submit" loading={saving}>
                  {step === STEPS.length - 1 ? 'Finish' : 'Continue'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
