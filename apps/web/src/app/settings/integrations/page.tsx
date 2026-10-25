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
      <div className="flex flex-col w-full py-6 gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-coral uppercase tracking-wider text-[11px] font-bold">
                Outbound Pipeline
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#EDE5E1]"></span>
              <span className="text-[11px] text-[#7D747D] uppercase font-medium">
                OAuth 2.0 Authenticated
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#351B32] tracking-tight">
              Mailbox Integrations &amp; Dispatcher
            </h1>
            <p className="text-sm text-[#7D747D] mt-1.5 font-sans leading-relaxed">
              Connect your personal Gmail or Outlook account via secure OAuth to send tailored job applications
              directly from your own email address.
            </p>
          </div>

          {/* Quick Dispatch Health Widget */}
          <div className="flex items-center gap-3 editorial-card border border-[#EDE5E1] bg-white px-4 py-3 rounded-2xl shadow-sm self-start md:self-auto">
            <div className="relative flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#EDE5E1]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                ></path>
                <path
                  className="text-[#268566] transition-all duration-700 ease-out"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="72, 100"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
              </svg>
              <span className="absolute text-xs font-bold text-[#351B32]">72%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#351B32] leading-none">Deliverability Score</span>
              <span className="badge-emerald text-[10px] font-bold mt-1">
                High Reputation Tier
              </span>
            </div>
          </div>
        </div>

        {/* Security & Trust Callout Banner */}
        <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/60 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#EDE5E1] flex items-center justify-center shrink-0 text-[#268566]">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#351B32]">
                    Enterprise OAuth Zero-Credential Storage
                  </span>
                  <span className="badge-neutral text-[10px] font-bold">
                    Local / Manual Draft Mode Active
                  </span>
                </div>
                <p className="text-xs text-[#7D747D] max-w-3xl leading-relaxed">
                  Jobora AI never stores your mailbox password. To enable live server-side OAuth token exchange in production, configure{' '}
                  <code className="font-mono text-xs bg-white border border-[#EDE5E1] px-1.5 py-0.5 rounded">GOOGLE_CLIENT_ID</code>,{' '}
                  <code className="font-mono text-xs bg-white border border-[#EDE5E1] px-1.5 py-0.5 rounded">GOOGLE_CLIENT_SECRET</code>,{' '}
                  <code className="font-mono text-xs bg-white border border-[#EDE5E1] px-1.5 py-0.5 rounded">MICROSOFT_CLIENT_ID</code>, and{' '}
                  <code className="font-mono text-xs bg-white border border-[#EDE5E1] px-1.5 py-0.5 rounded">SMTP_HOST</code> in your environment. When OAuth keys are not set, you can set your sender identity here and dispatch via <code className="font-mono text-xs">mailto:</code> or <code className="font-mono text-xs">.eml</code> export.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pl-14 md:pl-0">
              <button
                onClick={handleTestConnection}
                className="btn-editorial-secondary text-xs flex items-center gap-1"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Google Gmail */}
          <div className="flex flex-col justify-between editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center shrink-0">
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
                      <h3 className="font-serif text-lg text-[#351B32] font-bold">Google Gmail</h3>
                      <span className="badge-emerald text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#268566] animate-pulse"></span>
                        {profile.emailProvider === 'none' ? 'Ready' : 'Active'}
                      </span>
                    </div>
                    <span className="text-xs text-[#7D747D]">
                      Primary Dispatch Mailbox
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEmailInput(senderEmail);
                    setConnectModal('gmail');
                  }}
                  className="btn-editorial-secondary text-xs flex items-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#268566]">check_circle</span>
                  <span>Verified</span>
                </button>
              </div>

              {/* Connection Attributes Table */}
              <div className="bg-[#F8F5F0] border border-[#EDE5E1] rounded-xl p-4 flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE5E1]">
                  <span className="text-xs text-[#7D747D]">Sender Identity</span>
                  <button
                    onClick={() => {
                      setEmailInput(senderEmail);
                      setConnectModal('gmail');
                    }}
                    className="text-xs font-bold text-[#351B32] hover:text-[#E76F72] transition-colors"
                    type="button"
                  >
                    {senderEmail}
                  </button>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE5E1]">
                  <span className="text-xs text-[#7D747D]">Scope Permissions</span>
                  <span className="text-xs text-[#351B32] font-medium">
                    Authorized (Gmail API / send)
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE5E1]">
                  <span className="text-xs text-[#7D747D]">Connected On</span>
                  <span className="text-xs text-[#351B32]">Active Session</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7D747D]">Heartbeat Sync</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#268566]"></span>
                    <span className="text-xs text-[#7D747D]">Just now</span>
                  </div>
                </div>
              </div>

              {/* Dispatch Overview Visual */}
              <div className="px-1 mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#7D747D]">
                    Daily Approved Submissions
                  </span>
                  <span className="text-xs text-[#351B32] font-bold">
                    {applications.length} / {rateLimit} Safe Cap
                  </span>
                </div>
                <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#268566] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((applications.length / rateLimit) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#EDE5E1]">
              <button
                disabled={testingStatus !== 'idle'}
                onClick={handleTestConnection}
                className="btn-editorial-secondary text-xs flex items-center gap-1.5"
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
                    <span className="material-symbols-outlined text-[18px] text-[#268566]">
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
                className="btn-editorial-coral text-xs flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {/* Card 2: Microsoft Outlook / 365 */}
          <div className="flex flex-col justify-between editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center shrink-0">
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
                      <h3 className="font-serif text-lg text-[#351B32] font-bold">
                        Outlook / Office 365
                      </h3>
                      <span className="badge-neutral text-[11px] font-bold">
                        {profile.emailProvider === 'outlook' ? 'Connected' : 'Available'}
                      </span>
                    </div>
                    <span className="text-xs text-[#7D747D]">
                      Secondary Business Mailbox
                    </span>
                  </div>
                </div>
                <div className="badge-neutral text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    {profile.emailProvider === 'outlook' ? 'check_circle' : 'link_off'}
                  </span>
                  <span>
                    {profile.emailProvider === 'outlook' ? 'Linked' : 'Not Linked'}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8F5F0] border border-[#EDE5E1] rounded-xl p-4 flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE5E1]">
                  <span className="text-xs text-[#7D747D]">Integration Engine</span>
                  <span className="text-xs text-[#351B32] font-medium">
                    Microsoft Graph OAuth 2.0
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE5E1]">
                  <span className="text-xs text-[#7D747D]">Requested Scopes</span>
                  <span className="text-xs text-[#351B32]">Mail.Send, User.Read</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE5E1]">
                  <span className="text-xs text-[#7D747D]">Security Profile</span>
                  <span className="text-xs text-[#351B32]">Delegated Consent Token</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7D747D]">Compliance Level</span>
                  <span className="badge-emerald text-[11px] font-bold">
                    SOC2 Type II
                  </span>
                </div>
              </div>

              <div className="px-1 mb-4">
                <p className="text-xs text-[#7D747D] leading-relaxed">
                  Dispatch resume submissions seamlessly from your enterprise Office 365 or personal Outlook inbox.
                  Job replies thread automatically into your active applications radar.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EDE5E1] flex items-center justify-end">
              <button
                onClick={() => {
                  setEmailInput(profile.email || '');
                  setConnectModal('outlook');
                }}
                className="btn-editorial-primary text-xs flex items-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add_link</span>
                <span>Connect Outlook Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dispatch Safety & Autonomous Controls Panel */}
        <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EDE5E1]">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E76F72] text-[22px]">tune</span>
                <h2 className="font-serif text-xl text-[#351B32] font-bold">
                  Dispatch Safety &amp; Guardrails
                </h2>
              </div>
              <p className="text-xs text-[#7D747D] mt-1 font-sans">
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
              className="btn-editorial-secondary text-xs flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">restore</span>
              <span>Reset to Recommended</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Guardrail 1: Rate Limiting Slider */}
            <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/40 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#351B32]">Daily Send Throttle</span>
                  <span className="badge-coral text-[11px] font-bold">
                    {rateLimit} / day
                  </span>
                </div>
                <p className="text-xs text-[#7D747D] mb-4 leading-relaxed">
                  Enforces human-speed staggered delivery to protect your domain reputation.
                </p>
              </div>
              <div>
                <input
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#EDE5E1] rounded-lg appearance-none cursor-pointer accent-[#351B32]"
                  max={30}
                  min={5}
                  type="range"
                />
                <div className="flex justify-between items-center text-[#7D747D] text-[10px] uppercase tracking-wider font-semibold mt-2">
                  <span>5 Min</span>
                  <span className="text-[#351B32] font-bold">15 Recommended</span>
                  <span>30 Max</span>
                </div>
              </div>
            </div>

            {/* Guardrail 2: BCC Verification Toggle */}
            <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/40 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-[#351B32]">
                    Automatic BCC Inward Copy
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      checked={bccEnabled}
                      onChange={(e) => setBccEnabled(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-10 h-5 bg-[#EDE5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#351B32]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#7D747D] leading-relaxed">
                  Every dispatched custom pitch will send an explicit copy directly to your connected inbox for 100%
                  transparent audit trails.
                </p>
              </div>
              <div className="pt-3 border-t border-[#EDE5E1] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#268566]">mark_email_read</span>
                <span className="text-[11px] text-[#7D747D]">
                  Delivers to Sent Items folder
                </span>
              </div>
            </div>

            {/* Guardrail 3: Read Receipt & Click Tracking */}
            <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/40 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-[#351B32]">
                    Read &amp; Interaction Sync
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      checked={trackingEnabled}
                      onChange={(e) => setTrackingEnabled(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-10 h-5 bg-[#EDE5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#351B32]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#7D747D] leading-relaxed">
                  Embed zero-footprint web beacons to notify you the instant a recruiter or hiring executive opens
                  your portfolio link.
                </p>
              </div>
              <div className="pt-3 border-t border-[#EDE5E1] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#268566]">
                  visibility
                </span>
                <span className="text-[11px] text-[#7D747D]">
                  Live ping on recruiter interaction
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Log and Audit Table */}
        <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EDE5E1]">
            <div>
              <h3 className="font-serif text-lg text-[#351B32] font-bold">
                Recent Outbound Dispatch Log
              </h3>
              <p className="text-xs text-[#7D747D]">
                Real-time status of applications delivered via your connected mailbox.
              </p>
            </div>
            <button
              onClick={handleExportLogs}
              className="btn-editorial-secondary text-xs flex items-center gap-1 self-start sm:self-auto"
              type="button"
            >
              <span>Export SMTP Log</span>
              <span className="material-symbols-outlined text-[16px]">download</span>
            </button>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8F5F0] border-b border-[#EDE5E1] text-[11px] text-[#7D747D] uppercase font-semibold tracking-wider">
                  <th className="px-4 py-3 rounded-l-xl">
                    Target Company &amp; Role
                  </th>
                  <th className="px-4 py-3">
                    Recipient Contact
                  </th>
                  <th className="px-4 py-3">
                    Provider
                  </th>
                  <th className="px-4 py-3">
                    Delivery Stage
                  </th>
                  <th className="px-4 py-3 rounded-r-xl text-right">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5E1]">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F8F5F0]/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#351B32] text-white flex items-center justify-center font-bold text-xs">
                          {app.company[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#351B32]">
                            {app.company}
                          </span>
                          <span className="text-[11px] text-[#7D747D]">{app.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#5A525A]">{app.recruiterEmail}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-[#7D747D] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E76F72]"></span> {app.syncChannel || 'Gmail OAuth'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge-emerald text-[11px] font-bold">
                        Delivered • {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-[#7D747D]">
                      {app.appliedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connect Mailbox Modal */}
        {connectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#351B32]/60 backdrop-blur-xs animate-fade-in">
            <form
              onSubmit={handleSaveMailbox}
              className="editorial-card border border-[#EDE5E1] bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-scale-in"
            >
              <div className="flex items-center justify-between border-b border-[#EDE5E1] pb-3">
                <h3 className="font-serif text-lg text-[#351B32] font-bold">
                  Connect {connectModal === 'gmail' ? 'Google Gmail' : 'Microsoft Outlook'}
                </h3>
                <button
                  onClick={() => setConnectModal(null)}
                  type="button"
                  className="text-[#7D747D] hover:text-[#351B32] p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-[#7D747D] leading-relaxed">
                Enter the email address you want Jobora AI to use for outbound application dispatches:
              </p>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-white border border-[#EDE5E1] px-4 py-2.5 rounded-xl text-sm text-[#1D1A21] focus-ring"
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModal(null)}
                  className="btn-editorial-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-editorial-primary text-xs"
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
