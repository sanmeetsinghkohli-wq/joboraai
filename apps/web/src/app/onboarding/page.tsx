'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';

const STEP_LABELS = [
  'Personal Info',
  'Preferences',
  'Education',
  'Upload CV',
  'Complete',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, jobs, logActivity } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<number>(1);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [location, setLocation] = useState(profile.location || '');
  const [github, setGithub] = useState(profile.github || '');
  const [linkedin, setLinkedin] = useState(profile.linkedin || '');

  // Step 2: Preferences
  const [targetRole, setTargetRole] = useState(profile.targetRole || '');
  const [workMode, setWorkMode] = useState('Hybrid & Remote');
  const [availability, setAvailability] = useState(profile.graduationYear || 'Immediate / Summer 2025');
  const [skillInput, setSkillInput] = useState(profile.skills.join(', '));

  // Step 3: Education
  const [university, setUniversity] = useState(profile.university || '');
  const [degree, setDegree] = useState(profile.degree || '');
  const [gpa, setGpa] = useState(profile.gpa || '');
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear || '');

  // Step 4: Upload CV & Insights
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (profile.fullName && !fullName) setFullName(profile.fullName);
    if (profile.phone && !phone) setPhone(profile.phone);
    if (profile.location && !location) setLocation(profile.location);
    if (profile.targetRole && !targetRole) setTargetRole(profile.targetRole);
    if (profile.university && !university) setUniversity(profile.university);
    if (profile.degree && !degree) setDegree(profile.degree);
    if (profile.gpa && !gpa) setGpa(profile.gpa);
    if (profile.graduationYear && !graduationYear) setGraduationYear(profile.graduationYear);
    if (profile.github && !github) setGithub(profile.github);
    if (profile.linkedin && !linkedin) setLinkedin(profile.linkedin);
    if (profile.skills.length > 0 && !skillInput) setSkillInput(profile.skills.join(', '));
  }, [profile]);

  const displayFileName =
    profile.resumeFileName ||
    (fullName ? `${fullName.replace(/\s+/g, '_')}_Resume.pdf` : 'No_Resume_Uploaded_Yet.pdf');
  const displayFileSize = profile.resumeSize || '—';
  const displayAtsScore = profile.atsScore || (profile.resumeFileName ? 96 : 88);

  const currentSkills = skillInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    let parsedSkills = [...currentSkills];

    try {
      const text = await file.text();
      const candidates = [
        'Python',
        'PyTorch',
        'TensorFlow',
        'React',
        'Next.js',
        'TypeScript',
        'FastAPI',
        'Docker',
        'Kubernetes',
        'AWS',
        'SQL',
        'PostgreSQL',
        'RAG',
        'LangChain',
        'Go',
        'gRPC',
        'Java',
        'C++',
        'Node.js',
      ];
      const detected = candidates.filter((c) => text.toLowerCase().includes(c.toLowerCase()));
      if (detected.length >= 2) {
        parsedSkills = Array.from(new Set([...parsedSkills, ...detected]));
        setSkillInput(parsedSkills.join(', '));
      }
    } catch {}

    await updateProfile({
      resumeFileName: file.name,
      resumeSize: sizeKb,
      resumeUploadedAt: 'Just now',
      atsScore: 96,
      skills: parsedSkills,
    });
    logActivity('upload_file', `Parsed resume: ${file.name}`, `${parsedSkills.length} skills extracted`);
  };

  const saveCurrentStepData = async () => {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || profile.firstName || '';
    const lastName = parts.slice(1).join(' ') || profile.lastName || '';

    await updateProfile({
      firstName,
      lastName,
      fullName: fullName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      github: github.trim(),
      linkedin: linkedin.trim(),
      targetRole: targetRole.trim(),
      university: university.trim(),
      degree: degree.trim(),
      gpa: gpa.trim(),
      graduationYear: graduationYear.trim() || availability.trim(),
      skills: currentSkills,
      atsScore: displayAtsScore,
    });
  };

  const handleNextStep = async () => {
    await saveCurrentStepData();
    if (step < 5) {
      setStep(step + 1);
    } else {
      setFinalizing(true);
      logActivity(
        'auto_awesome',
        'Completed 5-Step Copilot Onboarding Setup',
        `${targetRole || 'Career Profile'} • ${location || 'Global'}`
      );
      router.push('/dashboard');
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/auth');
    }
  };

  const progressPercent = step * 20;

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
        <div className="flex flex-col w-full">
          <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low shadow-xl">
            <div className="absolute -top-32 -right-28 w-96 h-96 rounded-full bg-gradient-to-br from-secondary-fixed via-secondary-container/20 to-transparent blur-3xl pointer-events-none opacity-60"></div>
            <div className="absolute -bottom-36 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-surface-tint/15 via-primary-fixed/20 to-transparent blur-3xl pointer-events-none opacity-50"></div>

            <div className="relative px-gutter py-space-lg md:px-margin md:py-space-xl flex flex-col gap-space-lg">
              {/* 5-Step Progress Header */}
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary">
                      Copilot Setup • Step {step} of 5
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    {progressPercent}% Finished
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 w-full pt-1">
                  {STEP_LABELS.map((label, idx) => {
                    const sNum = idx + 1;
                    const isCompleted = sNum < step;
                    const isCurrent = sNum === step;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setStep(sNum)}
                        className="group flex flex-col gap-1.5 text-left focus:outline-none"
                      >
                        <div
                          className={`h-1.5 w-full rounded-full transition-all ${
                            isCompleted
                              ? 'bg-primary-container'
                              : isCurrent
                              ? 'bg-secondary-container'
                              : 'bg-surface-container-highest'
                          }`}
                        ></div>
                        <div
                          className={`hidden md:flex items-center gap-1 font-label-sm text-label-sm ${
                            isCompleted
                              ? 'text-on-surface'
                              : isCurrent
                              ? 'text-secondary font-bold'
                              : 'text-on-surface-variant/60'
                          }`}
                        >
                          {isCompleted ? (
                            <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">
                              check_circle
                            </span>
                          ) : isCurrent ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant inline-block"></span>
                          )}
                          <span className="truncate">{label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Heading Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    {step === 1 && 'Step 1: Personal Information'}
                    {step === 2 && 'Step 2: Career & Role Preferences'}
                    {step === 3 && 'Step 3: Academic & Education Background'}
                    {step === 4 && "Let's build your copilot profile"}
                    {step === 5 && 'Your AI Career Copilot is Ready'}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    {step === 1 && 'Verify your contact details and portfolio links for automated recruiter outreach.'}
                    {step === 2 && 'Tell Jobora AI which roles, locations, and technical stacks you are targeting.'}
                    {step === 3 && 'Add your university and degree details for graduate & internship eligibility.'}
                    {step === 4 && 'Personalized matching for internships and graduate roles in Dubai & Remote.'}
                    {step === 5 && 'Review your calibrated profile before launching into your live job dashboard.'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-on-primary-container self-start md:self-auto">
                  <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                  <span className="font-label-sm text-label-sm">Profile Accuracy {Math.min(98, 70 + step * 6)}%</span>
                </div>
              </div>

              {/* STEP 1: PERSONAL INFO */}
              {step === 1 && (
                <div className="bg-surface-container-lowest border border-[#EDE5E1] rounded-xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">Full Name</label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">Phone Number</label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+971 50 000 0000"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">Current City &amp; Country</label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Dubai, United Arab Emirates"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">GitHub / Portfolio URL</label>
                      <input
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="github.com/yourusername"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-primary">LinkedIn Profile URL</label>
                    <input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/in/yourusername"
                      className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: PREFERENCES */}
              {step === 2 && (
                <div className="bg-surface-container-lowest border border-[#EDE5E1] rounded-xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">Target Role / Title</label>
                      <input
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. AI Engineering Intern / Full Stack Engineer"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">Preferred Work Mode</label>
                      <select
                        value={workMode}
                        onChange={(e) => setWorkMode(e.target.value)}
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      >
                        <option value="Hybrid & Remote">Hybrid &amp; Remote</option>
                        <option value="Remote Only">Remote Only</option>
                        <option value="On-Site / Hybrid">On-Site / Hybrid</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-primary">
                      Core Skills &amp; Technologies (Comma Separated)
                    </label>
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="PyTorch, Python, React, TypeScript, FastAPI, Docker, AWS"
                      className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentSkills.map((s) => (
                      <span
                        key={s}
                        className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-surface-container border border-[#EDE5E1] text-primary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: EDUCATION */}
              {step === 3 && (
                <div className="bg-surface-container-lowest border border-[#EDE5E1] rounded-xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">University / Institution</label>
                      <input
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="e.g. Heriot-Watt University Dubai / BITS Pilani"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">Degree &amp; Major</label>
                      <input
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        placeholder="e.g. B.S. Computer Science & AI"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">Graduation / Availability</label>
                      <input
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        placeholder="e.g. Summer 2025 / Class of 2026"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-primary">GPA / Academic Standing</label>
                      <input
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="e.g. 3.85 / 4.0 (Dean's List)"
                        className="bg-surface-container-low border border-[#EDE5E1] px-4 py-3 rounded-lg font-body-md text-body-md text-on-surface focus-ring"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: UPLOAD CV (Exact Stitch Step 4 Screen) */}
              {step === 4 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group cursor-pointer rounded-xl bg-surface-container-lowest p-6 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <input
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        type="file"
                      />
                      <div className="flex flex-col items-center justify-center text-center gap-3 py-4">
                        <div className="w-14 h-14 rounded-full bg-surface-container-low text-secondary flex items-center justify-center transition-transform group-hover:scale-105">
                          <span className="material-symbols-outlined text-[30px]">upload_file</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-headline-sm text-headline-sm text-primary">
                            Upload your latest resume
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Drag and drop PDF or DOCX up to 10MB
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                            PDF
                          </span>
                          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                            DOCX
                          </span>
                          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                            ATS Optimized
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[20px]">description</span>
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-primary truncate max-w-[200px] sm:max-w-xs">
                                {displayFileName}
                              </span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant flex-shrink-0">
                                {displayFileSize}
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-tertiary-fixed-variant flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[15px]">task_alt</span>
                              Parsing complete: {currentSkills.length} skills extracted
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-on-surface-variant hover:text-secondary p-1 rounded-full transition-colors"
                          title="Replace resume"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-secondary-container h-full rounded-full transition-all duration-500"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-caption-caps text-caption-caps px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold tracking-wider">
                            ATS Score {displayAtsScore}/100
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">Parser v2.4</span>
                        </div>
                        <Link
                          href="/cv-studio"
                          className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-0.5"
                        >
                          <span>View parsed highlights</span>
                          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        </Link>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-highest/60 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                        Your resume data is private and encrypted. Never shared with third parties or public scraping
                        engines.
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                          <h3 className="font-headline-sm text-headline-sm text-primary">Extracted Insights</h3>
                        </div>
                        <button
                          onClick={() => setIsEditingInsights(!isEditingInsights)}
                          className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline"
                          type="button"
                        >
                          {isEditingInsights ? 'Done' : 'Edit'}
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                          <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                            Target Role Match
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-primary">
                              {targetRole || 'Software / AI Engineer'}
                            </span>
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                              Primary
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                          <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                            Target Region &amp; Mode
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-primary">
                              {location || 'Dubai, UAE'} ({workMode})
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">MENA Hub</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                            <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                              Availability
                            </span>
                            <span className="font-label-md text-label-md text-primary">
                              {graduationYear || availability}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                            <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                              Current Stage
                            </span>
                            <span className="font-label-md text-label-md text-primary truncate">
                              {degree || 'Candidate'}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 flex flex-col gap-2">
                          <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                            Key Matched Strengths
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentSkills.length > 0 ? (
                              currentSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container text-on-surface"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Upload your CV or add skills in Step 2
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-primary-container to-surface-tint p-4 text-on-primary flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-lowest/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px] text-primary-fixed">bolt</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md">Instant Apply Ready</span>
                          <span className="font-body-sm text-body-sm text-inverse-primary">
                            {Math.max(18, jobs.length)} matches awaiting submission
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-inverse-primary">arrow_forward</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: COMPLETE */}
              {step === 5 && (
                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[36px]">verified</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-primary font-semibold">
                    Welcome aboard, {fullName || 'Candidate'}!
                  </h2>
                  <p className="font-body-md text-body-sm text-on-surface-variant max-w-lg">
                    Your Jobora AI Career Copilot is now calibrated for{' '}
                    <strong className="text-primary">{targetRole || 'Tech & Engineering'}</strong> roles in{' '}
                    <strong className="text-primary">{location || 'Dubai & Remote'}</strong> with{' '}
                    <strong className="text-primary">{currentSkills.length} verified skills</strong>.
                  </p>
                </div>
              )}

              {/* Footer Navigation Buttons */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleBackStep}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center justify-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>{step === 1 ? 'Back to Sign Up' : 'Previous Step'}</span>
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={async () => {
                      await saveCurrentStepData();
                      router.push('/dashboard');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant font-label-md text-label-md text-center"
                    type="button"
                  >
                    Save &amp; Skip to Dashboard
                  </button>
                  <button
                    disabled={finalizing}
                    onClick={handleNextStep}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary-container hover:bg-on-primary-fixed text-on-primary font-label-md text-label-md shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    type="button"
                  >
                    <span>
                      {step < 5
                        ? `Continue to Step ${step + 1}`
                        : finalizing
                        ? 'Finalizing Copilot...'
                        : 'Launch Dashboard'}
                    </span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
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
