'use client';

import React, { useState, useEffect } from 'react';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function EmailComposerPage() {
  const { profile, selectedJob, jobs, setSelectedJob, addApplication, logActivity } = useAppData();

  const activeJob = selectedJob || jobs[0] || {
    id: 'job-29481',
    title: 'AI Engineering Intern',
    company: 'Amazon MENA',
    location: 'Dubai, UAE',
    recruiterName: 'Tariq Mansoor',
    recruiterEmail: 'recruiter.mena@amazon.com',
    skills: ['PyTorch', 'RAG', 'FastAPI', 'AWS'],
    matchScore: 96,
  };

  const senderName = profile.fullName || 'Your Name';
  const senderInitial = (senderName.trim()[0] || 'U').toUpperCase();
  const senderEmail = profile.connectedEmail || profile.email || 'connect-mailbox@gmail.com';
  const senderDegree = profile.degree
    ? `${profile.degree}${profile.university ? ` • ${profile.university}` : ''}`
    : 'Computer Science & Artificial Intelligence';
  const senderPhoneLocation = [profile.phone || '+971 50 000 0000', profile.location || 'Dubai, United Arab Emirates']
    .filter(Boolean)
    .join(' • ');
  const senderLinks = [
    profile.github || `github.com/${(profile.firstName || 'candidate').toLowerCase()}-ai`,
    profile.linkedin || `linkedin.com/in/${(profile.fullName || 'candidate').toLowerCase().replace(/\s+/g, '')}`,
  ].join(' • ');

  const recruiterName = activeJob.recruiterName || 'Tariq Mansoor';
  const recruiterFirst = recruiterName.split(' ')[0] || 'Hiring Team';
  const recruiterInitials = recruiterName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const recruiterEmail = activeJob.recruiterEmail || `careers@${activeJob.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  const [activeTab, setActiveTab] = useState<'compose' | 'preview' | 'attachments'>('compose');
  const [ccBcc, setCcBcc] = useState('');
  const [subject, setSubject] = useState(
    `Application for ${activeJob.title} — ${senderName}`
  );
  const [toneLabel, setToneLabel] = useState('Diplomatic & Technical');
  const [emailBody, setEmailBody] = useState('');
  const [isEditingBody, setIsEditingBody] = useState(false);

  const resumeFileName =
    profile.resumeFileName ||
    `${(profile.firstName || 'Candidate').replace(/\s+/g, '_')}_Resume_${activeJob.company.replace(/\s+/g, '_')}.pdf`;
  const coverLetterFileName = `Cover_Letter_${activeJob.company.replace(/\s+/g, '_')}.pdf`;

  const [attachments, setAttachments] = useState([
    {
      id: 'att-1',
      name: resumeFileName,
      badge: `ATS ${profile.atsScore || activeJob.matchScore || 96}% Match`,
      badgeStyle: 'bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold',
      meta: `${profile.resumeSize || '142 KB'} • Verified Clean Signature`,
      icon: 'description',
      iconBg: 'bg-secondary-fixed text-on-secondary-fixed',
    },
    {
      id: 'att-2',
      name: coverLetterFileName,
      badge: 'PDF/A-1b',
      badgeStyle: 'bg-surface-container-highest text-on-surface',
      meta: `98 KB • ${activeJob.location || 'Regional'} Context`,
      icon: 'draft',
      iconBg: 'bg-surface-container-highest text-primary',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setSubject(`Application for ${activeJob.title} — ${senderName}`);
    const topSkills =
      profile.skills.length > 0
        ? profile.skills.slice(0, 3).join(', ')
        : (activeJob.skills || ['PyTorch', 'RAG', 'Distributed Systems']).slice(0, 3).join(', ');
    setEmailBody(
      `Dear ${recruiterFirst},\n\nI am writing to express my strong enthusiasm for the ${activeJob.title} opening at ${activeJob.company}. Having followed ${activeJob.company}'s regional expansions across ${activeJob.location || 'MENA'}, I would be honored to contribute to your engineering team.\n\nOver the past two years, my technical focus has centered on production-grade systems and applied engineering (${topSkills}):\n• Deep Learning & Fine-Tuning: Built and trained custom transformer models for latency-constrained inference pipelines, cutting query evaluation times by 38%.\n• Retrieval-Augmented Generation (RAG): Engineered production RAG workflows pairing vector databases (pgvector/Pinecone) with multi-modal LLM reasoning pipelines.\n• Regional Presence & Availability: Currently available in ${profile.location || activeJob.location || 'Dubai, UAE'}, allowing zero-friction onboarding for collaboration.\n\nI have attached my tailored resume (which demonstrates verified ATS keyword alignment with ${activeJob.company}’s engineering principles) along with my cover letter detailing project repositories. I look forward to the possibility of discussing how my foundation in scalable systems can support ${activeJob.company}’s technical milestones.\n\nThank you for your time and consideration.`
    );
  }, [activeJob.id, senderName, profile.location, profile.skills]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const wordCount = emailBody.trim() ? emailBody.trim().split(/\s+/).length : 0;
  const charCount = emailBody.length;

  const handleCycleTone = () => {
    const tones = ['Diplomatic & Technical', 'Executive & Concise', 'Founder-Direct & Impactful'];
    const next = tones[(tones.indexOf(toneLabel) + 1) % tones.length];
    setToneLabel(next);
    showToast(`AI Copilot recalibrated email tone to: ${next}`);
  };

  const handleAttachPortfolio = () => {
    if (attachments.some((a) => a.id === 'att-portfolio')) {
      showToast('Portfolio document already attached.');
      return;
    }
    setAttachments((prev) => [
      ...prev,
      {
        id: 'att-portfolio',
        name: `${(profile.firstName || 'Candidate')}_Technical_Portfolio.pdf`,
        badge: 'GitHub Synced',
        badgeStyle: 'bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold',
        meta: '215 KB • Architecture Case Studies',
        icon: 'folder_special',
        iconBg: 'bg-secondary-fixed text-on-secondary-fixed',
      },
    ]);
    showToast('Technical Portfolio attached to dispatch queue.');
  };

  const handleConfirmSend = async () => {
    setSending(true);
    await addApplication({
      jobId: activeJob.id,
      title: activeJob.title,
      company: activeJob.company,
      location: activeJob.location || 'Dubai, UAE',
      status: 'Applied',
      matchScore: activeJob.matchScore || 96,
      syncChannel: `${profile.emailProvider === 'outlook' ? 'Outlook' : 'Gmail'} OAuth`,
      nextAction: 'Follow up in 5 days',
      recruiterName,
      recruiterEmail,
      attachments: attachments.map((a) => ({
        name: a.name,
        size: a.meta.split('•')[0].trim(),
        badge: a.badge,
      })),
    });
    logActivity('outgoing_mail', `Dispatched application to ${recruiterName}`, `${activeJob.company} • ${activeJob.title}`);
    setSending(false);
    setModalOpen(false);
    showToast(`Email successfully dispatched via ${senderEmail} and logged to Applications Tracker.`);
  };

  return (
    <StitchShell activeNav="applications">
      <div className="flex flex-col w-full">
        {/* Ambient Atmospheric Glow Layers */}
        <div className="relative w-full overflow-hidden pb-12">
          <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-secondary-container/20 blur-[100px] pointer-events-none -z-10"></div>
          <div className="absolute top-48 left-12 w-80 h-80 rounded-full bg-primary-fixed/30 blur-[90px] pointer-events-none -z-10"></div>

          {/* Page Header & Tab Rail */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
                  Dispatch Studio
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Step 4 of 4 • Outbound Outreach
                </span>
                {jobs.length > 1 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <select
                      value={activeJob.id}
                      onChange={(e) => {
                        const found = jobs.find((j) => j.id === e.target.value);
                        if (found) setSelectedJob(found);
                      }}
                      className="bg-surface-container px-2.5 py-0.5 rounded-lg font-label-sm text-label-sm text-primary focus:outline-none cursor-pointer"
                    >
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          Target: {j.company} — {j.title}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Application Email Composer
              </h1>
            </div>

            {/* Navigation Segmented Tabs */}
            <div className="flex items-center p-1 bg-surface-container rounded-xl shadow-inner self-start md:self-auto">
              <button
                onClick={() => setActiveTab('compose')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 ${
                  activeTab === 'compose'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Compose</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 ${
                  activeTab === 'preview'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Preview &amp; AI Review</span>
                <span className="font-caption-caps text-caption-caps bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.5 rounded-full font-bold">
                  98%
                </span>
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 ${
                  activeTab === 'attachments'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">attachment</span>
                <span>Attachments</span>
                <span className="font-caption-caps text-caption-caps bg-surface-container-highest text-on-surface px-1.5 py-0.5 rounded-full">
                  {attachments.length}
                </span>
              </button>
            </div>
          </div>

          {/* Security & OAuth Status Banner */}
          <div className="w-full bg-surface-container-low rounded-xl p-3.5 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-tertiary-fixed-variant shadow-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path>
                </svg>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Sending Account:</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">{senderEmail}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
                  Connected via {profile.emailProvider === 'outlook' ? 'Microsoft' : 'Google'} OAuth
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-container-lowest px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
              <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-bold">
                Requires explicit approval before dispatch
              </span>
            </div>
          </div>

          {/* 12-Column Grid: Composer Canvas (8 cols) + Copilot Drawer (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Editor Column (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {activeTab !== 'preview' ? (
                /* Compose View Panel */
                <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col gap-5">
                  {/* Send From Field */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-24 font-label-md text-label-md text-on-surface-variant">From</label>
                    <div className="flex-1 relative">
                      <div className="w-full bg-surface-container-low rounded-lg px-3.5 py-2.5 flex items-center justify-between text-on-surface font-body-md text-body-md shadow-xs">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                            {senderInitial}
                          </div>
                          <span className="font-semibold text-primary">{senderName}</span>
                          <span className="text-on-surface-variant truncate">&lt;{senderEmail}&gt;</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="font-caption-caps text-caption-caps bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-0.5 rounded-full font-bold">
                            Connected
                          </span>
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* To Recipient Field */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-24 font-label-md text-label-md text-on-surface-variant">To</label>
                    <div className="flex-1 flex flex-wrap items-center gap-2 p-2 rounded-lg bg-surface-container-low/60 shadow-xs">
                      <div className="inline-flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-sm text-label-sm font-bold">
                          {recruiterInitials}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-label-md text-label-md text-primary font-bold">{recruiterName}</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{recruiterEmail}</span>
                        </div>
                        <span className="font-caption-caps text-caption-caps bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded">
                          Sr. Tech Recruiter
                        </span>
                      </div>
                      <input
                        value={ccBcc}
                        onChange={(e) => setCcBcc(e.target.value)}
                        className="flex-1 min-w-[120px] bg-transparent font-body-sm text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none px-2 py-1"
                        placeholder="Add Cc or Bcc..."
                        type="text"
                      />
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="w-24 font-label-md text-label-md text-on-surface-variant">Subject</label>
                    <div className="flex-1 relative">
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-surface-container-low rounded-lg px-3.5 py-2.5 pr-36 font-label-md text-label-md text-primary font-semibold focus:outline-none focus:bg-surface-container-lowest shadow-xs"
                        type="text"
                      />
                      <span className="absolute right-3 top-2.5 flex items-center gap-1 font-caption-caps text-caption-caps text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded">
                        <span className="material-symbols-outlined text-[14px]">bolt</span> High Open Rate
                      </span>
                    </div>
                  </div>

                  {/* Rich Text Formatting Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 pb-1 bg-surface-container-low px-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsEditingBody(!isEditingBody)}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Toggle Raw Editor"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_bold</span>
                      </button>
                      <button
                        onClick={() => setIsEditingBody(!isEditingBody)}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Italic"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_italic</span>
                      </button>
                      <button
                        onClick={() => setIsEditingBody(!isEditingBody)}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Underline"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_underlined</span>
                      </button>
                      <div className="w-px h-4 bg-outline-variant mx-1"></div>
                      <button
                        onClick={() => setIsEditingBody(!isEditingBody)}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Bulleted List"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                      </button>
                      <button
                        onClick={() => setIsEditingBody(!isEditingBody)}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Numbered List"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                      </button>
                      <div className="w-px h-4 bg-outline-variant mx-1"></div>
                      <button
                        onClick={() => setIsEditingBody(!isEditingBody)}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Edit Text"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                        {wordCount} Words • {charCount.toLocaleString()} Chars
                      </span>
                      <button
                        onClick={handleCycleTone}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-lowest text-primary text-label-sm font-label-sm shadow-xs hover:bg-surface-container transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">tune</span> Tone:{' '}
                        {toneLabel}
                      </button>
                    </div>
                  </div>

                  {/* Rich Text Email Body Area */}
                  <div className="relative bg-surface-container-lowest rounded-lg p-4 font-body-md text-body-md text-on-surface leading-relaxed min-h-[360px] shadow-xs focus-within:ring-2 focus-within:ring-secondary/20">
                    {isEditingBody ? (
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={12}
                        className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none resize-y leading-relaxed"
                      />
                    ) : (
                      <div onClick={() => setIsEditingBody(true)} className="cursor-text">
                        <p className="mb-4">Dear {recruiterFirst},</p>
                        <p className="mb-4">
                          I am writing to express my strong enthusiasm for the{' '}
                          <strong className="text-primary font-semibold">{activeJob.title}</strong> opening at{' '}
                          {activeJob.company}. Having followed {activeJob.company}&apos;s regional expansions in AI and
                          cloud infrastructure across {activeJob.location || 'the UAE and MENA'}, I would be honored to
                          contribute to your engineering team.
                        </p>
                        <p className="mb-4">
                          Over the past two years, my technical focus has centered on production-grade NLP and applied
                          machine learning:
                        </p>
                        <ul className="list-disc pl-5 mb-4 space-y-2 text-on-surface">
                          <li>
                            <strong className="text-primary font-semibold">
                              PyTorch Deep Learning &amp; Fine-Tuning:
                            </strong>{' '}
                            Built and trained custom transformer models for latency-constrained inference pipelines,
                            cutting query evaluation times by 38%.
                          </li>
                          <li>
                            <strong className="text-primary font-semibold">
                              Retrieval-Augmented Generation (RAG):
                            </strong>{' '}
                            Engineered production RAG workflows pairing vector databases (pgvector/Pinecone) with
                            multi-modal LLM reasoning pipelines.
                          </li>
                          <li>
                            <strong className="text-primary font-semibold">
                              Regional Presence &amp; Availability:
                            </strong>{' '}
                            Currently based in {profile.location || activeJob.location || 'Dubai, UAE'} with immediate
                            availability, allowing zero-friction onboarding for collaboration.
                          </li>
                        </ul>
                        <p className="mb-4">
                          I have attached my tailored resume (which demonstrates verified ATS keyword alignment with{' '}
                          {activeJob.company}’s leadership principles) along with my cover letter detailing project
                          repositories. I look forward to the possibility of discussing how my foundation in scalable AI
                          systems can support {activeJob.company}’s technical milestones.
                        </p>
                        <p className="mb-2">Thank you for your time and consideration.</p>
                      </div>
                    )}

                    <div className="mt-6 pt-4 bg-surface-container-low/50 rounded-lg p-3">
                      <p className="font-semibold text-primary font-label-md text-label-md">{senderName}</p>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">{senderDegree}</p>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">{senderPhoneLocation}</p>
                      <p className="text-body-sm font-body-sm text-secondary font-medium">{senderLinks}</p>
                    </div>
                  </div>

                  {/* Attached Documents Strip */}
                  <div className="flex flex-col gap-2 pt-2">
                    <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-bold">
                      Attached Documents ({attachments.length} files ready for dispatch)
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all shadow-xs group"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${att.iconBg} flex items-center justify-center shrink-0`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{att.icon}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-label-md text-label-md text-primary font-bold truncate max-w-[210px]">
                                {att.name}
                              </span>
                              <span
                                className={`font-caption-caps text-caption-caps px-1.5 py-0.5 rounded-full ${att.badgeStyle}`}
                              >
                                {att.badge}
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">{att.meta}</span>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => showToast(`Previewing ${att.name}`)}
                              className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                              title="Preview Document"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button
                              onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== att.id))}
                              className="p-1 rounded text-on-surface-variant hover:text-error transition-colors"
                              title="Remove"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Quick Add Document Button */}
                      <button
                        onClick={handleAttachPortfolio}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all text-label-md font-label-md shadow-xs"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Attach Portfolio</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Preview & AI Review Panel */
                <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-4 bg-surface-container-low rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">verified</span>
                      <span className="font-label-md text-label-md text-primary font-bold">
                        Email Copilot Diagnostic Analysis
                      </span>
                    </div>
                    <span className="font-caption-caps text-caption-caps bg-tertiary-fixed text-on-tertiary-fixed-variant px-2.5 py-1 rounded-full font-bold">
                      Readiness Score: 98/100
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-surface-container-low rounded-lg">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Tone Alignment
                      </span>
                      <p className="font-label-md text-label-md text-primary font-bold mt-1">
                        Direct &amp; Engineering-Focused
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Scores 99% for technical recruiting style guidelines.
                      </p>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-lg">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Keywords Density
                      </span>
                      <p className="font-label-md text-label-md text-primary font-bold mt-1">
                        {(activeJob.skills || ['PyTorch', 'RAG', 'Latency']).slice(0, 3).join(', ')}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Matches core hard requirements from job specification.
                      </p>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-lg">
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Readability Index
                      </span>
                      <p className="font-label-md text-label-md text-primary font-bold mt-1">45-Sec Scan Time</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Bullet points front-load highest value qualifications.
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-5 rounded-lg shadow-inner">
                    <div className="font-body-sm text-body-sm text-on-surface-variant mb-2">
                      Simulated Recruiter View (Gmail Desktop client)
                    </div>
                    <div className="font-label-md text-label-md text-primary font-bold mb-1">{subject}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                      From: {senderName} &lt;{senderEmail}&gt; • To: {recruiterName} &lt;{recruiterEmail}&gt;
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line">
                      {emailBody}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => showToast('Draft saved to local workspace.')}
                    className="px-4 py-2 rounded-lg font-label-md text-label-md text-primary hover:bg-surface-container-high transition-all"
                    type="button"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('preview');
                      showToast('AI Copilot verified 98% recruiter alignment.');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-label-md text-secondary hover:bg-secondary-fixed/30 transition-all"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">spark</span>
                    <span>Review AI Polish</span>
                  </button>
                </div>
                {/* Primary Confirmation Dispatch Trigger */}
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container hover:bg-on-primary-fixed text-on-primary font-label-md text-label-md shadow-md hover:shadow-lg transition-all duration-150 transform active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">send</span>
                  <span>
                    Approve &amp; Send via {profile.emailProvider === 'outlook' ? 'Outlook' : 'Gmail'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right-Side Copilot Intelligence Drawer (4 Columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Recruiter Intelligence Card */}
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">psychology</span>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Recruiter Intelligence</h2>
                  </div>
                  <span className="font-caption-caps text-caption-caps bg-surface-container-highest text-on-surface px-2 py-0.5 rounded-full">
                    {activeJob.company}
                  </span>
                </div>

                {/* Recruiter Profile Snippet */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-container-low">
                  <img
                    alt={recruiterName}
                    className="w-12 h-12 rounded-full object-cover shrink-0 shadow-xs"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnbP3Ww5Ko0v-IUhhbi3n4f4sF-LJJzxJXBvRpmlUW7bPUG7DjmPXlzpzwTBYnBn0DQ1RxBgvBm-bpp3JpzXi-7mQdm1sq9Px7z-O5643BDv2yEJyXIjObI3hUDSiqoccqdUHhnrfMhbMjERrW-qokWrj6PnGije2MMq13SekoX_aX005i9if-VlKb5hqA9bDPYOfNWY_DYYd1BgXRM2Vr4wBaqnMFv0imYGdz6If81TElsL-i1IMB"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md text-primary font-bold truncate">{recruiterName}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Sr. Technical Recruiter, {activeJob.company}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                      <span className="font-caption-caps text-caption-caps text-on-tertiary-fixed-variant font-bold">
                        Active in {activeJob.location || 'Dubai'} (GST +4)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hiring Manager & Timing Telemetry */}
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                        Optimal Dispatch Window
                      </span>
                      <span className="font-caption-caps text-caption-caps bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-0.5 rounded font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="font-label-md text-label-md text-primary font-bold">Tuesday at 10:00 AM (GST)</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Recruiters at {activeJob.company} show highest first-hour response rates on Tuesday mornings
                      between 9:30 AM and 11:00 AM.
                    </p>
                  </div>

                  {/* Predicted Response Rate Metric Visualization */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                        Response Probability
                      </span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">78%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-secondary-container via-secondary to-primary-container h-2 rounded-full"
                        style={{ width: '78%' }}
                      ></div>
                    </div>
                    <div className="pt-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">
                            check_circle
                          </span>{' '}
                          Regional Residency Fit
                        </span>
                        <span className="font-bold text-primary">+25%</span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">
                            check_circle
                          </span>{' '}
                          Technical Keyword Match
                        </span>
                        <span className="font-bold text-primary">+32%</span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">
                            check_circle
                          </span>{' '}
                          Direct Recruiter Outreach
                        </span>
                        <span className="font-bold text-primary">+21%</span>
                      </div>
                    </div>
                  </div>

                  {/* Hiring Manager Tactical Insight */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">lightbulb</span>
                      <span className="font-label-md text-label-md text-primary font-bold">Hiring Manager Notes</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      The {activeJob.company} engineering cluster prioritizes candidates who have deployed production
                      systems on constrained compute over purely theoretical research. Emphasizing query latency and
                      vector indexing makes your profile stand out immediately.
                    </p>
                  </div>
                </div>

                {/* Application Activity History */}
                <div className="flex flex-col gap-2 pt-2">
                  <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Application Tracker Sync
                  </span>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-high/60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">sync_alt</span>
                      <span className="font-body-sm text-body-sm text-on-surface">
                        Auto-log to Applications Pipeline
                      </span>
                    </div>
                    <span className="font-caption-caps text-caption-caps bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">
                      Enabled
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick AI Copilot Assistant Widget */}
              <div className="bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-xl shadow-md p-5 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-secondary/30 blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary-fixed text-[20px]">auto_awesome</span>
                    <span className="font-label-md text-label-md font-bold text-surface">
                      Jobora Dispatch Safeguard
                    </span>
                  </div>
                  <span className="font-caption-caps text-caption-caps bg-surface/10 px-2 py-0.5 rounded">
                    v2.4 Active
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-surface-container-high relative z-10">
                  This outreach email is pre-vetted against anti-spam triggers, verified SPF/DKIM compliance, and
                  optimal recruiter scan hierarchy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal / Approval Confirmation Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm transition-opacity duration-200">
            <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">outgoing_mail</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Confirm Email Dispatch
                    </h3>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                      Final Verification Check
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors p-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">security</span>
                <p className="font-body-md text-body-md text-on-surface leading-snug">
                  Once approved, this email will be dispatched directly through your connected account (
                  <strong className="text-primary font-semibold">{senderEmail}</strong>) and logged in Applications
                  Tracker.
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-surface-container p-3.5 rounded-xl">
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Recipient:</span>
                  <span className="font-semibold text-primary">
                    {recruiterName} ({activeJob.company})
                  </span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Attachments:</span>
                  <span className="font-semibold text-primary">{attachments.length} PDF documents (ATS verified)</span>
                </div>
                <div className="flex justify-between items-center text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Tracking:</span>
                  <span className="font-semibold text-on-tertiary-fixed-variant">
                    Real-time open &amp; click tracking
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-all"
                  type="button"
                >
                  Cancel &amp; Continue Editing
                </button>
                <button
                  disabled={sending}
                  onClick={handleConfirmSend}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-on-primary-fixed font-label-md text-label-md shadow-md transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {sending ? 'hourglass_top' : 'send'}
                  </span>
                  <span>{sending ? 'Dispatching...' : 'Confirm & Send Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification Pill */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
            <div className="bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary-fixed text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">{toastMsg}</span>
            </div>
          </div>
        )}
      </div>
    </StitchShell>
  );
}
