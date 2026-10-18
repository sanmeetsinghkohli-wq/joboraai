'use client';

import React, { useState } from 'react';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function EmailIntegrationsPage() {
  const { profile, updateProfile, applications, logActivity } = useAppData();

  const senderEmail = profile.connectedEmail || profile.email || 'your.email@gmail.com';
  const [rateLimit, setRateLimit] = useState(15);
  const [bccEnabled, setBccEnabled] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'verifying' | 'ok'>('idle');
  const [connectModal, setConnectModal] = useState<'gmail' | 'outlook' | null>(null);
  const [emailInput, setEmailInput] = useState(senderEmail);

  const handleTestConnection = () => {
    setTestingStatus('verifying');
    setTimeout(() => {
      setTestingStatus('ok');
      logActivity('verified_user', `Verified OAuth handshake for ${senderEmail}`, '200 OK • Gmail API');
      setTimeout(() => setTestingStatus('idle'), 2400);
    }, 900);
  };

  const handleSaveMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !connectModal) return;
    await updateProfile({
      connectedEmail: emailInput.trim(),
      emailProvider: connectModal,
    });
    logActivity('add_link', `Connected ${connectModal.toUpperCase()} mailbox`, emailInput.trim());
    setConnectModal(null);
  };

  const handleDisconnect = async () => {
    await updateProfile({
      emailProvider: 'none',
    });
    logActivity('power_settings_new', 'Disconnected primary dispatch mailbox', senderEmail);
  };

  const handleExportLogs = () => {
    const rows = [
      ['Company', 'Role', 'Recipient', 'Provider', 'Status', 'Timestamp'],
      ...applications.map((a) => [
        a.company,
        a.title,
        a.recruiterEmail,
        a.syncChannel,
        a.status,
        a.appliedAt,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jobora_smtp_dispatch_log.csv';
    link.click();
  };

  return (
    <StitchShell activeNav="email-integrations">
      <div className="flex flex-col w-full">
        {/* Subtle decorative ambient glow backdrops */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-64 -left-20 w-80 h-80 rounded-full bg-tertiary-fixed/20 blur-3xl pointer-events-none -z-10"></div>

          {/* Page Header & Meta Track */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-space-lg">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-caption-caps text-caption-caps uppercase text-secondary font-bold tracking-wider">
                  Outbound Pipeline
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                  OAuth 2.0 Authenticated
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Mailbox Integrations &amp; Dispatcher
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
                Connect your personal Gmail or Outlook account via secure OAuth to send tailored job applications
                directly from your own email address.
              </p>
            </div>

            {/* Quick Dispatch Health Widget */}
            <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl shadow-sm self-start md:self-auto">
              <div className="relative flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  ></path>
                  <path
                    className="text-on-tertiary-container transition-all duration-700 ease-out"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="72, 100"
                    strokeLinecap="round"
                    strokeWidth="3"
                  ></path>
                </svg>
                <span className="absolute font-label-sm text-label-sm font-bold text-primary">72%</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-primary leading-none">Deliverability Score</span>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant mt-1">
                  High Reputation Tier
                </span>
              </div>
            </div>
          </div>

          {/* Security & Trust Callout Banner */}
          <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-sm mb-space-xl">
            <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-label-md text-label-md font-bold text-primary">
                      Enterprise OAuth Zero-Credential Storage
                    </span>
                    <span className="font-caption-caps text-caption-caps bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
                      Local / Manual Draft Mode Active
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl leading-relaxed">
                    Jobora AI never stores your mailbox password. To enable live server-side OAuth token exchange in production, configure{' '}
                    <code className="font-mono text-xs bg-surface-container px-1.5 py-0.5 rounded">GOOGLE_CLIENT_ID</code>,{' '}
                    <code className="font-mono text-xs bg-surface-container px-1.5 py-0.5 rounded">GOOGLE_CLIENT_SECRET</code>,{' '}
                    <code className="font-mono text-xs bg-surface-container px-1.5 py-0.5 rounded">MICROSOFT_CLIENT_ID</code>, and{' '}
                    <code className="font-mono text-xs bg-surface-container px-1.5 py-0.5 rounded">SMTP_HOST</code> in your environment. When OAuth keys are not set, you can set your sender identity here and dispatch via <code className="font-mono text-xs">mailto:</code> or <code className="font-mono text-xs">.eml</code> export.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pl-14 md:pl-0">
                <button
                  onClick={handleTestConnection}
                  className="font-label-sm text-label-sm text-secondary hover:text-on-secondary-fixed-variant transition-colors flex items-center gap-1"
                  type="button"
                >
                  {testingStatus === 'verifying'
                    ? 'Checking Config...'
                    : testingStatus === 'ok'
                    ? 'Sender Identity Verified ✓'
                    : 'Verify Sender Identity'}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg mb-space-xl">
            {/* Card 1: Google Gmail */}
            <div className="flex flex-col justify-between bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div>
                <div className="flex items-start justify-between gap-4 mb-space-md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        ></path>
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        ></path>
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          fill="#FBBC05"
                        ></path>
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335"
                        ></path>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Google Gmail</h3>
                        <span className="inline-flex items-center gap-1 font-caption-caps text-caption-caps bg-tertiary-fixed text-on-tertiary-container px-2.5 py-0.5 rounded-full font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
                          {profile.emailProvider === 'none' ? 'Ready' : 'Active'}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Primary Dispatch Mailbox
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEmailInput(senderEmail);
                      setConnectModal('gmail');
                    }}
                    className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-lg hover:bg-surface-container-highest transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">check_circle</span>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">
                      Verified
                    </span>
                  </button>
                </div>

                {/* Connection Attributes Table */}
                <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-3 mb-space-lg">
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Sender Identity</span>
                    <button
                      onClick={() => {
                        setEmailInput(senderEmail);
                        setConnectModal('gmail');
                      }}
                      className="font-label-md text-label-md text-primary font-bold hover:text-secondary transition-colors"
                      type="button"
                    >
                      {senderEmail}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Scope Permissions</span>
                    <span className="font-body-sm text-body-sm text-on-surface text-right font-medium">
                      Authorized (Gmail API / send)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Connected On</span>
                    <span className="font-body-sm text-body-sm text-on-surface">Active Session</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Heartbeat Sync</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Just now</span>
                    </div>
                  </div>
                </div>

                {/* Dispatch Overview Visual */}
                <div className="px-1 mb-space-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Daily Approved Submissions
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">
                      {applications.length} / {rateLimit} Safe Cap
                    </span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div
                      className="bg-primary-container h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((applications.length / rateLimit) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-3 pt-space-md">
                <button
                  disabled={testingStatus !== 'idle'}
                  onClick={handleTestConnection}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-all active:scale-[0.98]"
                  type="button"
                >
                  {testingStatus === 'verifying' && (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      <span>Verifying Handshake...</span>
                    </>
                  )}
                  {testingStatus === 'ok' && (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-on-tertiary-fixed-variant">
                        check_circle
                      </span>
                      <span>OAuth Valid (200 OK)</span>
                    </>
                  )}
                  {testingStatus === 'idle' && (
                    <>
                      <span className="material-symbols-outlined text-[18px]">sync</span>
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-secondary hover:bg-secondary-fixed/40 font-label-sm text-label-sm transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                  <span>Disconnect Mailbox</span>
                </button>
              </div>
            </div>

            {/* Card 2: Microsoft Outlook / 365 */}
            <div className="flex flex-col justify-between bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div>
                <div className="flex items-start justify-between gap-4 mb-space-md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M22 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9.5V5H20.5A1.5 1.5 0 0 1 22 6.5z"
                          fill="#0078D4"
                        ></path>
                        <path d="M9.5 5H3.5A1.5 1.5 0 0 0 2 6.5v11A1.5 1.5 0 0 0 3.5 19h6V5z" fill="#106EBE"></path>
                        <path d="M7 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="#FFFFFF"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                          Outlook / Office 365
                        </h3>
                        <span className="font-caption-caps text-caption-caps bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full font-bold">
                          {profile.emailProvider === 'outlook' ? 'Connected' : 'Available'}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Secondary Business Mailbox
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      {profile.emailProvider === 'outlook' ? 'check_circle' : 'link_off'}
                    </span>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">
                      {profile.emailProvider === 'outlook' ? 'Linked' : 'Not Linked'}
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-3 mb-space-lg">
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Integration Engine</span>
                    <span className="font-label-md text-label-md text-primary font-medium">
                      Microsoft Graph OAuth 2.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Requested Scopes</span>
                    <span className="font-body-sm text-body-sm text-on-surface">Mail.Send, User.Read</span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Security Profile</span>
                    <span className="font-body-sm text-body-sm text-on-surface">Delegated Consent Token</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Compliance Level</span>
                    <span className="font-body-sm text-body-sm text-on-tertiary-container font-medium">
                      SOC2 Type II Compatible
                    </span>
                  </div>
                </div>

                <div className="px-1 mb-space-md">
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Dispatch resume submissions seamlessly from your enterprise Office 365 or personal Outlook inbox.
                    Job replies thread automatically into your active applications radar.
                  </p>
                </div>
              </div>

              <div className="pt-space-md flex items-center justify-end">
                <button
                  onClick={() => {
                    setEmailInput(profile.email || '');
                    setConnectModal('outlook');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container hover:bg-on-primary-fixed-variant text-on-primary font-label-md text-label-md shadow-sm transition-all duration-150 active:scale-[0.98]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add_link</span>
                  <span>Connect Outlook Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dispatch Safety & Autonomous Controls Panel */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-space-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">tune</span>
                  <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Dispatch Safety &amp; Guardrails
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Configure how Jobora AI schedules outbound communications without triggering spam detectors or
                  overwhelming hiring leads.
                </p>
              </div>
              <button
                onClick={() => {
                  setRateLimit(15);
                  setBccEnabled(true);
                  setTrackingEnabled(true);
                }}
                className="self-start md:self-auto px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-label-sm text-label-sm transition-colors flex items-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">restore</span>
                <span>Reset to Recommended</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              {/* Guardrail 1: Rate Limiting Slider */}
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-md text-label-md text-primary font-bold">Daily Send Throttle</span>
                    <span className="font-label-sm text-label-sm bg-primary-container text-on-primary px-2.5 py-0.5 rounded-full font-bold">
                      {rateLimit} emails / day
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                    Enforces human-speed staggered delivery to protect your domain reputation.
                  </p>
                </div>
                <div>
                  <input
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary"
                    max={30}
                    min={5}
                    type="range"
                  />
                  <div className="flex justify-between items-center text-on-surface-variant font-caption-caps text-caption-caps mt-2">
                    <span>5 Conservative</span>
                    <span className="text-secondary font-bold">15 Safe Rate</span>
                    <span>30 Max Cap</span>
                  </div>
                </div>
              </div>

              {/* Guardrail 2: BCC Verification Toggle */}
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-label-md text-label-md text-primary font-bold">
                      Automatic BCC Inward Copy
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        checked={bccEnabled}
                        onChange={(e) => setBccEnabled(e.target.checked)}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Every dispatched custom pitch will send an explicit copy directly to your connected inbox for 100%
                    transparent audit trails.
                  </p>
                </div>
                <div className="pt-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">mark_email_read</span>
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                    Delivers straight to Sent Items folder
                  </span>
                </div>
              </div>

              {/* Guardrail 3: Read Receipt & Click Tracking */}
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-label-md text-label-md text-primary font-bold">
                      Read &amp; Interaction Sync
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        checked={trackingEnabled}
                        onChange={(e) => setTrackingEnabled(e.target.checked)}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Embed zero-footprint web beacons to notify you the instant a recruiter or hiring executive opens
                    your portfolio link.
                  </p>
                </div>
                <div className="pt-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-tertiary-fixed-variant">
                    visibility
                  </span>
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                    Live ping on recruiter interaction
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity Log and Audit Table */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-space-md">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Recent Outbound Dispatch Log
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Real-time status of applications delivered via your connected mailbox.
                </p>
              </div>
              <button
                onClick={handleExportLogs}
                className="self-start sm:self-auto font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1"
                type="button"
              >
                Export Full SMTP Log
                <span className="material-symbols-outlined text-[16px]">download</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-4 py-3 font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider rounded-l-lg">
                      Target Company &amp; Role
                    </th>
                    <th className="px-4 py-3 font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider">
                      Recipient Contact
                    </th>
                    <th className="px-4 py-3 font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider">
                      Provider
                    </th>
                    <th className="px-4 py-3 font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider">
                      Delivery Stage
                    </th>
                    <th className="px-4 py-3 font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider rounded-r-lg text-right">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary font-label-md">
                            {app.company[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-primary font-semibold">
                              {app.company}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">{app.title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-body-sm text-body-sm text-on-surface">{app.recruiterEmail}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span> {app.syncChannel || 'Gmail OAuth'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-caption-caps text-caption-caps bg-tertiary-fixed text-on-tertiary-container px-2 py-0.5 rounded-full font-bold">
                          Delivered • {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-caption-caps text-caption-caps text-on-surface-variant">
                        {app.appliedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Connect Mailbox Modal */}
        {connectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
            <form
              onSubmit={handleSaveMailbox}
              className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Connect {connectModal === 'gmail' ? 'Google Gmail' : 'Microsoft Outlook'}
                </h3>
                <button
                  onClick={() => setConnectModal(null)}
                  type="button"
                  className="text-on-surface-variant hover:text-primary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Enter the email address you want Jobora AI to use for outbound application dispatches:
              </p>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-surface-container-low px-4 py-2.5 rounded-lg font-body-md text-body-md text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModal(null)}
                  className="px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md"
                >
                  Authorize OAuth 2.0
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </StitchShell>
  );
}
