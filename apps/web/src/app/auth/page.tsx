'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Search, Send, Target } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Field, Input, Notice, Segmented } from '@/components/ui/primitives';
import { Tilt } from '@/components/ui/tilt';

type Tab = 'login' | 'signup';

/** Only same-site paths are accepted as a post-login destination. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

function errorMessage(data: any, fallback: string): string {
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.error?.message === 'string') return data.error.message;
  return fallback;
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        required
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded text-ink-subtle hover:text-plum"
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { authStatus, refreshSession } = useAppData();

  const [tab, setTab] = useState<Tab>(params?.get('tab') === 'login' ? 'login' : 'signup');
  const next = safeNext(params?.get('next') ?? null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Someone who is already signed in has no reason to be here.
  useEffect(() => {
    if (authStatus === 'authenticated' && !submitting) router.replace(next);
  }, [authStatus, submitting, next, router]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'signup' && password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const parts = name.trim().split(/\s+/);
      const body =
        tab === 'signup'
          ? { firstName: parts[0] || '', lastName: parts.slice(1).join(' '), email: email.trim(), password }
          : { email: email.trim(), password };

      const res = await fetch(`/api/auth/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          errorMessage(
            data,
            tab === 'login' ? 'That email and password do not match an account.' : 'We could not create your account.'
          )
        );
        setSubmitting(false);
        return;
      }

      const status = await refreshSession();
      if (status !== 'authenticated') {
        setError('You were signed in, but the session could not be confirmed. Please try again.');
        setSubmitting(false);
        return;
      }
      router.replace(tab === 'signup' ? '/onboarding' : next);
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* Form */}
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" aria-label="Jobora home" className="self-start">
          <Logo />
        </Link>

        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-serif text-3xl text-plum">
            {tab === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {tab === 'signup'
              ? 'Set up your workspace in a couple of minutes.'
              : 'Log in to pick up your search where you left it.'}
          </p>

          <Segmented
            label="Account"
            value={tab}
            onChange={switchTab}
            options={[
              { value: 'signup', label: 'Sign up' },
              { value: 'login', label: 'Log in' },
            ]}
            className="mt-6 self-start"
          />

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate={false}>
            {error && <Notice tone="error">{error}</Notice>}

            {tab === 'signup' && (
              <Field label="Full name" htmlFor="auth-name">
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </Field>
            )}

            <Field label="Email" htmlFor="auth-email">
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>

            <Field
              label="Password"
              htmlFor="auth-password"
              hint={tab === 'signup' ? 'At least 8 characters.' : undefined}
            >
              <PasswordInput
                id="auth-password"
                value={password}
                onChange={setPassword}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                describedBy={tab === 'signup' ? 'auth-password-hint' : undefined}
              />
            </Field>

            <Button type="submit" size="lg" loading={submitting} className="mt-2">
              {tab === 'signup' ? 'Create account' : 'Log in'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-muted">
            {tab === 'signup' ? 'Already have an account? ' : 'New to Jobora? '}
            <button
              type="button"
              onClick={() => switchTab(tab === 'signup' ? 'login' : 'signup')}
              className="font-semibold text-plum underline decoration-coral decoration-2 underline-offset-4 hover:text-coral-700"
            >
              {tab === 'signup' ? 'Log in' : 'Create one'}
            </button>
          </p>
          {tab === 'login' && (
            <p className="mt-2 text-sm text-ink-muted">
              <Link href="/reset-password" className="underline underline-offset-4 hover:text-plum">
                Forgot your password?
              </Link>
            </p>
          )}
        </main>
      </div>

      {/* Brand panel */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-plum lg:flex lg:items-center lg:justify-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(50rem_30rem_at_70%_20%,rgba(231,111,114,0.35),transparent_60%)]" />
        <div className="relative w-full max-w-md px-10">
          <p className="font-serif text-3xl leading-tight text-paper">
            Know what to apply for next, and where every application stands.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            {[
              { Icon: Search, text: 'Live roles from public job boards' },
              { Icon: Target, text: 'Which listed skills you have, and which you do not' },
              { Icon: Send, text: 'One tracker from Saved to Offer' },
            ].map(({ Icon, text }, i) => (
              <Tilt key={text} max={6} lift={10}>
                <div
                  className="flex items-center gap-4 rounded-lg border border-paper/15 bg-paper/10 p-4 text-paper backdrop-blur"
                  style={{ marginLeft: `${i * 1.25}rem` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-coral text-plum-900">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              </Tilt>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <AuthContent />
    </Suspense>
  );
}
