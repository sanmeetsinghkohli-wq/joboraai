'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams?.get('token') || '';

  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [mode, setMode] = useState<'request' | 'reset'>(tokenFromUrl ? 'reset' : 'request');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Unable to process request.');
      } else {
        setStatusMsg(data.message || 'Password reset token generated.');
        if (data.devResetToken) {
          setToken(data.devResetToken);
          setMode('reset');
        }
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Reset failed.');
      } else {
        setStatusMsg('Password updated! Redirecting to login...');
        setTimeout(() => router.push('/auth?tab=login'), 1200);
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl shadow-lg p-8 flex flex-col gap-5">
        <div>
          <Link href="/auth?tab=login" className="font-label-sm text-label-sm text-secondary hover:underline">
            ← Back to Sign In
          </Link>
          <h1 className="font-headline-md text-headline-md text-primary mt-2">
            {mode === 'request' ? 'Forgot Your Password?' : 'Set a New Password'}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {mode === 'request'
              ? 'Enter your account email to request a password reset token.'
              : 'Enter your reset token and choose a new password (8+ characters).'}
          </p>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 font-body-sm text-body-sm">
            {statusMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 font-body-sm text-body-sm">
            {errorMsg}
          </div>
        )}

        {mode === 'request' ? (
          <form onSubmit={handleRequestLink} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Account Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="bg-surface-container-low px-4 py-2.5 rounded-xl font-body-md text-body-md text-on-surface"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold"
            >
              {loading ? 'Sending...' : 'Request Reset Token'}
            </button>
            <button
              type="button"
              onClick={() => setMode('reset')}
              className="font-label-sm text-label-sm text-primary hover:underline text-center"
            >
              Already have a reset token? Enter it here
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">Reset Token</label>
              <input
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                className="bg-surface-container-low px-4 py-2.5 rounded-xl font-mono text-xs text-on-surface"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary">New Password</label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="bg-surface-container-low px-4 py-2.5 rounded-xl font-body-md text-body-md text-on-surface"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
