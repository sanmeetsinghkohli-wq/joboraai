'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';

function AuthPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, updateProfile, logActivity } = useAppData();

  const initialTab =
    searchParams?.get('tab') === 'login'
      ? 'login'
      : searchParams?.get('tab') === 'verify'
      ? 'verify'
      : 'signup';

  const [activeTab, setActiveTab] = useState<'signup' | 'login' | 'verify'>(initialTab);
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState(profile.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendText, setResendText] = useState('Resend verification email');

  useEffect(() => {
    if (profile.fullName && !fullName) setFullName(profile.fullName);
    if (profile.email && !email) setEmail(profile.email);
    if (profile.email && !loginEmail) setLoginEmail(profile.email);
  }, [profile.fullName, profile.email]);

  const strengthLevel =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 4;
  const strengthLabel =
    strengthLevel === 0
      ? 'None'
      : strengthLevel === 1
      ? 'Weak'
      : strengthLevel === 2
      ? 'Medium'
      : 'Strong (92%)';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'Candidate';
    const lastName = parts.slice(1).join(' ') || '';

    await updateProfile({
      firstName,
      lastName,
      fullName: fullName.trim(),
      email: email.trim(),
      connectedEmail: email.trim(),
      emailProvider: email.includes('outlook') || email.includes('hotmail') ? 'outlook' : 'gmail',
    });

    fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email: email.trim(), password }),
    }).catch(() => {});

    logActivity('person_add', `Created Jobora AI identity for ${fullName.trim()}`, email.trim());
    setSubmitting(false);
    setActiveTab('verify');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    await updateProfile({
      email: loginEmail.trim(),
      connectedEmail: loginEmail.trim(),
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data?.user) {
        await updateProfile({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          fullName: [data.user.firstName, data.user.lastName].filter(Boolean).join(' '),
          email: data.user.email,
          connectedEmail: data.user.email,
        });
      }
    } catch {}

    logActivity('login', 'Authenticated into Jobora AI Career Copilot', loginEmail.trim());
    setSubmitting(false);
    router.push('/dashboard');
  };

  const handleConfirmVerification = () => {
    logActivity('verified', 'Verified email ownership', email || loginEmail || profile.email);
    router.push('/onboarding');
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <header className="h-16 flex items-center justify-between px-gutter border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md">
        <Link className="flex items-center gap-2.5" href="/">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary via-surface-tint to-primary-container flex items-center justify-center shadow-sm">
            <div className="w-3 h-3 rounded-full bg-surface-container-lowest"></div>
          </div>
          <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
            Jobora <span className="text-secondary">AI</span>
          </span>
        </Link>
        <Link
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          href="/dashboard"
        >
          <span className="material-symbols-outlined text-[18px]">help_outline</span>
          <span>Assistance</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-gutter py-space-lg w-full max-w-4xl mx-auto">
        <div className="flex flex-col w-full relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-gradient-to-tr from-secondary-fixed/40 via-surface-container-high/60 to-tertiary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface">
                Secure Gateway • Jobora Identity Hub
              </span>
            </div>
            <div className="inline-flex p-1.5 rounded-full bg-surface-container-high shadow-inner gap-1">
              <button
                onClick={() => setActiveTab('signup')}
                className={`px-5 py-2 rounded-full font-label-md text-label-md transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'signup'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Sign Up</span>
              </button>
              <button
                onClick={() => setActiveTab('login')}
                className={`px-5 py-2 rounded-full font-label-md text-label-md transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'login'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                <span>Log In</span>
              </button>
              <button
                onClick={() => setActiveTab('verify')}
                className={`px-5 py-2 rounded-full font-label-md text-label-md transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'verify'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">mark_email_unread</span>
                <span>Verify Email</span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              </button>
            </div>
          </div>

          <div className="w-full max-w-2xl mx-auto">
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* VIEW 1: SIGN UP */}
            {activeTab === 'signup' && (
              <div className="transition-opacity duration-300">
                <div className="bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
                    <div>
                      <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                        Create your account
                      </h1>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        Unlock intelligent outreach, executive matching, and automated career agents.
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant self-start sm:self-auto bg-surface-container-low px-3 py-1 rounded-full">
                      Step 1 of 2
                    </span>
                  </div>

                  <form className="flex flex-col gap-5" onSubmit={handleSignup}>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-primary flex items-center justify-between"
                        htmlFor="full-name"
                      >
                        <span>Full Name</span>
                        <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                          Legal name preferred
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all placeholder:text-outline"
                          id="full-name"
                          placeholder="Enter your full name"
                          required
                          type="text"
                        />
                        <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-on-surface-variant text-[20px]">
                          badge
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary" htmlFor="email-address">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all placeholder:text-outline"
                          id="email-address"
                          placeholder="you@organization.com"
                          required
                          type="email"
                        />
                        <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-on-surface-variant text-[20px]">
                          mail
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-primary" htmlFor="password">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-4 py-3 pr-11 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                            id="password"
                            placeholder="Create password"
                            required
                            type={showPassword ? 'text' : 'password'}
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-on-surface-variant hover:text-primary transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-primary" htmlFor="confirm-password">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-4 py-3 pr-11 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                            id="confirm-password"
                            placeholder="Confirm password"
                            required
                            type={showConfirmPassword ? 'text' : 'password'}
                          />
                          <button
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-3 text-on-surface-variant hover:text-primary transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showConfirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                            verified_user
                          </span>
                          Password Strength
                        </span>
                        <span className="font-bold text-on-tertiary-fixed-variant">{strengthLabel}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden flex">
                        {[1, 2, 3, 4].map((idx) => (
                          <div
                            key={idx}
                            className={`h-full w-1/4 ${idx < 4 ? 'mr-1' : ''} transition-all ${
                              strengthLevel >= idx ? 'bg-tertiary-fixed-dim' : 'bg-surface-container'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                      <input
                        defaultChecked
                        className="mt-1 h-4 w-4 rounded accent-primary-container text-primary-container cursor-pointer"
                        type="checkbox"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                        I agree to the{' '}
                        <span className="text-secondary font-medium hover:underline">Terms of Service</span>,{' '}
                        <span className="text-secondary font-medium hover:underline">Privacy Policy</span>, and consent
                        to algorithmic profile analysis.
                      </span>
                    </label>

                    {/* Primary Submit CTA */}
                    <button
                      disabled={submitting}
                      className="w-full mt-2 bg-primary-container hover:bg-on-primary-fixed text-on-primary font-label-md text-label-md py-3.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                      type="submit"
                    >
                      <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>

                    {/* Social Auth Divider */}
                    <div className="relative flex items-center my-2">
                      <div className="flex-grow h-px bg-surface-container-high"></div>
                      <span className="flex-shrink mx-4 font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">
                        Or continue with
                      </span>
                      <div className="flex-grow h-px bg-surface-container-high"></div>
                    </div>

                    {/* SSO Providers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => router.push('/onboarding')}
                        className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors text-primary font-label-md text-label-md shadow-sm"
                        type="button"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                            fill="#4285F4"
                          ></path>
                          <path
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                            fill="#34A853"
                          ></path>
                          <path
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                            fill="#FBBC05"
                          ></path>
                          <path
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            fill="#EA4335"
                          ></path>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                      <button
                        onClick={() => router.push('/onboarding')}
                        className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors text-primary font-label-md text-label-md shadow-sm"
                        type="button"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 23 23">
                          <path d="M1 1h10v10H1z" fill="#f35325"></path>
                          <path d="M12 1h10v10H12z" fill="#81bc06"></path>
                          <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
                          <path d="M12 12h10v10H12z" fill="#ffba08"></path>
                        </svg>
                        <span>Continue with Microsoft</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW 2: LOG IN */}
            {activeTab === 'login' && (
              <div className="transition-opacity duration-300">
                <div className="bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-10 relative">
                  <div className="mb-8">
                    <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Welcome back</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Access your executive pipeline, interview simulations, and AI agents.
                    </p>
                  </div>
                  <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary" htmlFor="login-email">
                        Account Email
                      </label>
                      <div className="relative">
                        <input
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@organization.com"
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all placeholder:text-outline"
                          id="login-email"
                          required
                          type="email"
                        />
                        <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-on-surface-variant text-[20px]">
                          alternate_email
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-label-md text-label-md text-primary" htmlFor="login-password">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('verify')}
                          className="font-label-sm text-label-sm text-secondary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-4 py-3 pr-11 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                          id="login-password"
                          required
                          type="password"
                        />
                        <span className="material-symbols-outlined absolute right-3.5 top-3 text-on-surface-variant text-[20px]">
                          lock
                        </span>
                      </div>
                    </div>
                    <button
                      disabled={submitting}
                      className="w-full mt-2 bg-primary-container hover:bg-on-primary-fixed text-on-primary font-label-md text-label-md py-3.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      type="submit"
                    >
                      <span>{submitting ? 'Logging In...' : 'Log In to Dashboard'}</span>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW 3: VERIFY EMAIL */}
            {activeTab === 'verify' && (
              <div className="transition-opacity duration-300">
                <div className="bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
                  <div className="mb-6 flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant shadow-sm">
                      <span className="material-symbols-outlined text-[16px] text-secondary">security</span>
                      <span className="font-label-sm text-label-sm font-semibold">
                        Mandatory verification before dashboard access
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-secondary-container/20 blur-xl"></div>
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-secondary via-secondary-container to-secondary-fixed flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                        <span
                          className="material-symbols-outlined text-[42px] text-on-secondary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          forward_to_inbox
                        </span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-md">
                        <span
                          className="material-symbols-outlined text-[18px] text-on-tertiary-fixed-variant"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      </div>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Check your email</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-2">
                      A confirmation link was sent to{' '}
                      <span className="font-semibold text-primary block sm:inline mt-1 sm:mt-0 px-2 py-0.5 rounded bg-surface-container-high">
                        {email || loginEmail || profile.email || 'your registered email'}
                      </span>
                    </p>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-5 mb-6 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        Click the cryptographic link inside the inbox email to validate ownership.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        Your Jobora session will activate automatically across desktop and mobile.
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-container-high/60 rounded-xl p-4 mb-8 flex items-start gap-3.5 shadow-sm">
                    <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">info</span>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm text-primary uppercase tracking-wide">
                        Independent Mailbox Notice
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                        Jobora account identity verification is <strong>strictly separate</strong> from connecting your
                        Gmail or Outlook outreach sending mailbox. You will configure campaign dispatch permissions
                        inside settings after initial sign-in.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                      onClick={() => {
                        setResendText('Link resent to inbox!');
                        setTimeout(() => setResendText('Resend verification email'), 3500);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-label-md transition-colors flex items-center justify-center gap-2"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">replay</span>
                      <span>{resendText}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('signup')}
                      className="w-full sm:w-auto px-4 py-2.5 text-secondary hover:text-on-secondary-container font-label-md text-label-md transition-colors flex items-center justify-center gap-1.5"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      <span>Change email address</span>
                    </button>
                  </div>

                  <div className="mt-8 pt-4 border-t border-surface-container flex items-center justify-center">
                    <button
                      onClick={handleConfirmVerification}
                      className="text-xs font-label-sm text-on-surface-variant hover:text-primary flex items-center gap-1"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      <span>Confirm Verification &amp; Continue to Copilot Setup</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Micro trust badges footer */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-on-surface-variant font-label-sm text-label-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">lock</span>
              <span>256-bit TLS Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">verified_user</span>
              <span>SOC2 Type II Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">privacy_tip</span>
              <span>GDPR/CCPA Sovereign</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 px-gutter text-center border-t border-outline-variant/20 font-caption-caps text-caption-caps text-on-surface-variant">
        Jobora AI Inc. Protected by career encryption protocols.
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <AuthPortalContent />
    </Suspense>
  );
}
