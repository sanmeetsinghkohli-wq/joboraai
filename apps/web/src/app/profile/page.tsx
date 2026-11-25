'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, FileUp, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Field, Input, Notice, PageHeader, Textarea } from '@/components/ui/primitives';
import { TagInput } from '@/components/ui/tag-input';
import {
  useAppData,
  type LiveUserProfile,
  type ProfileCertification,
  type ProfileProject,
} from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { profileStrength } from '@/lib/profile';

type Form = Pick<
  LiveUserProfile,
  | 'fullName'
  | 'phone'
  | 'location'
  | 'linkedin'
  | 'github'
  | 'targetRole'
  | 'careerGoals'
  | 'industries'
  | 'preferredLocations'
  | 'workModes'
  | 'salaryExpectation'
  | 'skills'
  | 'summary'
  | 'degree'
  | 'university'
  | 'graduationYear'
  | 'gpa'
  | 'experience'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages'
>;

const FORM_KEYS: Array<keyof Form> = [
  'fullName', 'phone', 'location', 'linkedin', 'github', 'targetRole', 'careerGoals', 'industries',
  'preferredLocations', 'workModes', 'salaryExpectation', 'skills', 'summary', 'degree', 'university',
  'graduationYear', 'gpa', 'experience', 'projects', 'certifications', 'achievements', 'languages',
];

const ARRAY_KEYS = new Set<keyof Form>(['industries', 'workModes', 'skills', 'projects', 'certifications', 'achievements', 'languages']);

const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];

interface Parsed {
  fullName: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  education: Array<{ degree: string; institution: string; year: string; gpa: string }>;
  experience: Array<{ title: string; company: string; location: string; start: string; end: string; bullets: string[] }>;
  projects: ProfileProject[];
  certifications: ProfileCertification[];
  achievements: string[];
  languages: string[];
  links: { linkedin: string; github: string; portfolio: string };
}

type ImportKey = 'contact' | 'summary' | 'skills' | 'education' | 'experience' | 'projects' | 'certifications' | 'achievements';

function experienceText(items: Parsed['experience']) {
  return items
    .map((e) => {
      const head = [e.title, e.company].filter(Boolean).join(' at ');
      const meta = [e.location, [e.start, e.end].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');
      return [head + (meta ? ` (${meta})` : ''), ...e.bullets.map((b) => `- ${b}`)].join('\n');
    })
    .join('\n\n');
}

export default function ProfilePage() {
  const { profile, updateProfile, authStatus } = useAppData();
  const { addToast } = useToast();

  const fromProfile = (): Form =>
    Object.fromEntries(FORM_KEYS.map((k) => [k, profile[k] ?? (ARRAY_KEYS.has(k) ? [] : '')])) as Form;
  const [form, setForm] = useState<Form>(fromProfile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(fromProfile()), [form, profile]); // eslint-disable-line react-hooks/exhaustive-deps
  const strength = profileStrength({ ...profile, ...form });

  const save = async () => {
    setSaving(true);
    await updateProfile({
      ...form,
      projects: form.projects.filter((p) => p.name.trim()),
      certifications: form.certifications.filter((c) => c.name.trim()),
    });
    setSaving(false);
    addToast({ type: 'success', title: 'Profile saved' });
  };

  // ── CV import ──────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [meta, setMeta] = useState<{ fileName: string; ats: { score: number; grade: string } } | null>(null);
  const [picked, setPicked] = useState<Record<ImportKey, boolean>>({
    contact: true, summary: true, skills: true, education: true, experience: true, projects: true, certifications: true, achievements: true,
  });

  const upload = async (file: File) => {
    setImporting(true);
    setImportError('');
    setParsed(null);
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/profile/parse-cv', { method: 'POST', body });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.parsed) {
      setParsed(data.parsed);
      setMeta({ fileName: file.name, ats: data.ats });
    } else {
      setImportError(data?.error?.message || 'We could not read that CV.');
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const importRows: Array<{ key: ImportKey; label: string; found: string; replaces: boolean }> = parsed
    ? [
        {
          key: 'contact' as ImportKey,
          label: 'Name, phone, location and links',
          found: [parsed.fullName, parsed.phone, parsed.location, parsed.links.linkedin, parsed.links.github || parsed.links.portfolio].filter(Boolean).join(' · '),
          replaces: Boolean(form.phone || form.location || form.linkedin || form.github),
        },
        { key: 'summary' as ImportKey, label: 'Summary', found: parsed.summary ? `${parsed.summary.slice(0, 90)}…` : '', replaces: Boolean(form.summary) },
        {
          key: 'skills' as ImportKey,
          label: 'Skills (added to yours)',
          found: parsed.skills.slice(0, 10).join(', ') + (parsed.skills.length > 10 ? ` +${parsed.skills.length - 10} more` : ''),
          replaces: false,
        },
        {
          key: 'education' as ImportKey,
          label: 'Education',
          found: parsed.education.map((e) => [e.degree, e.institution].filter(Boolean).join(', ')).join(' · '),
          replaces: Boolean(form.degree || form.university),
        },
        {
          key: 'experience' as ImportKey,
          label: 'Experience and internships',
          found: parsed.experience.map((e) => [e.title, e.company].filter(Boolean).join(' at ')).join(' · '),
          replaces: Boolean(form.experience),
        },
        { key: 'projects' as ImportKey, label: 'Projects', found: parsed.projects.map((p) => p.name).join(', '), replaces: form.projects.length > 0 },
        {
          key: 'certifications' as ImportKey,
          label: 'Certifications',
          found: parsed.certifications.map((c) => c.name).join(', '),
          replaces: form.certifications.length > 0,
        },
        { key: 'achievements' as ImportKey, label: 'Achievements and hackathons', found: parsed.achievements.slice(0, 4).join(' · '), replaces: false },
      ].filter((r) => r.found)
    : [];

  const applyImport = async () => {
    if (!parsed) return;
    const next: Partial<LiveUserProfile> = {};
    if (picked.contact) {
      if (parsed.fullName) next.fullName = parsed.fullName;
      if (parsed.phone) next.phone = parsed.phone;
      if (parsed.location) next.location = parsed.location;
      if (parsed.links.linkedin) next.linkedin = parsed.links.linkedin;
      if (parsed.links.github || parsed.links.portfolio) next.github = parsed.links.github || parsed.links.portfolio;
    }
    if (picked.summary && parsed.summary) next.summary = parsed.summary;
    if (picked.skills && parsed.skills.length) {
      const have = new Set(form.skills.map((s) => s.toLowerCase()));
      next.skills = [...form.skills, ...parsed.skills.filter((s) => !have.has(s.toLowerCase()))];
    }
    if (picked.education && parsed.education[0]) {
      const e = parsed.education[0];
      next.degree = e.degree;
      next.university = e.institution;
      next.graduationYear = e.year;
      if (e.gpa) next.gpa = e.gpa;
    }
    if (picked.experience && parsed.experience.length) next.experience = experienceText(parsed.experience);
    if (picked.projects && parsed.projects.length) next.projects = parsed.projects;
    if (picked.certifications && parsed.certifications.length) next.certifications = parsed.certifications;
    if (picked.achievements && parsed.achievements.length) {
      next.achievements = [...new Set([...form.achievements, ...parsed.achievements])];
    }
    if (parsed.languages.length) next.languages = [...new Set([...form.languages, ...parsed.languages])];
    if (!form.targetRole && parsed.headline) next.targetRole = parsed.headline;
    if (meta) {
      next.resumeFileName = meta.fileName;
      next.resumeUploadedAt = new Date().toISOString();
      next.atsScore = meta.ats.score;
    }
    await updateProfile(next);
    setParsed(null);
    addToast({ type: 'success', title: 'Profile updated from your CV', description: 'Check each section below.' });
  };

  if (authStatus === 'loading') return <AppShell>{null}</AppShell>;

  const updateProject = (i: number, patch: Partial<ProfileProject>) =>
    set('projects', form.projects.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const updateCert = (i: number, patch: Partial<ProfileCertification>) =>
    set('certifications', form.certifications.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <AppShell>
      <PageHeader
        eyebrow="My career profile"
        title="Your profile powers everything"
        description="Matches, fit scores, CVs, letters and interview prep all read from here. Enter it once."
        actions={
          <Button onClick={save} loading={saving} disabled={!dirty}>
            Save changes
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          {/* CV import */}
          <Card as="section" className="border-plum-100 bg-plum-50/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Fill this in from your CV</CardTitle>
                <p className="mt-1 text-sm text-ink-muted">
                  Upload a PDF, DOCX or TXT (up to 5 MB). You choose what gets added; nothing changes until you confirm.
                </p>
                {profile.resumeFileName && <p className="mt-1 text-xs text-ink-subtle">Last imported: {profile.resumeFileName}</p>}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                id="cv-file"
                aria-label="Upload your CV"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              <Button onClick={() => fileRef.current?.click()} disabled={importing} className="shrink-0">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
                {importing ? 'Reading your CV…' : 'Upload CV'}
              </Button>
            </div>
            {importError && (
              <Notice tone="warn" className="mt-4">
                {importError}
              </Notice>
            )}

            {parsed && (
              <div className="mt-5 rounded-lg border border-line bg-paper p-4" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-plum">Found in {meta?.fileName}</p>
                  {meta && (
                    <span className="text-sm text-ink-muted">
                      ATS readability estimate:{' '}
                      <strong className="text-plum">
                        {meta.ats.score}/100 ({meta.ats.grade})
                      </strong>
                    </span>
                  )}
                </div>
                {importRows.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-muted">Nothing usable was found in this file.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {importRows.map((row) => (
                      <li key={row.key} className="flex items-start gap-3 py-2.5">
                        <input
                          type="checkbox"
                          id={`imp-${row.key}`}
                          checked={picked[row.key]}
                          onChange={(e) => setPicked((p) => ({ ...p, [row.key]: e.target.checked }))}
                          className="mt-1 h-4 w-4 accent-plum"
                        />
                        <label htmlFor={`imp-${row.key}`} className="min-w-0 flex-1 text-sm">
                          <span className="font-medium text-ink">{row.label}</span>
                          {row.replaces && <span className="ml-2 text-xs text-warn">replaces what you have</span>}
                          <span className="mt-0.5 block truncate text-ink-muted">{row.found}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={applyImport} disabled={importRows.length === 0}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Add selected to my profile
                  </Button>
                  <Button variant="ghost" onClick={() => setParsed(null)}>
                    Discard
                  </Button>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-subtle">
                  <Sparkles className="h-3.5 w-3.5 text-coral" aria-hidden="true" /> Read by AI from your file. Check it below
                  before you rely on it.
                </p>
              </div>
            )}
          </Card>

          <Section id="about" title="About you">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="p-name">
                <Input id="p-name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Phone" htmlFor="p-phone" optional>
                <Input id="p-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
              </Field>
              <Field label="City and country" htmlFor="p-location">
                <Input id="p-location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Dubai, UAE" />
              </Field>
              <Field label="Languages" htmlFor="p-languages" optional>
                <TagInput id="p-languages" value={form.languages} onChange={(v) => set('languages', v)} />
              </Field>
              <Field label="LinkedIn" htmlFor="p-linkedin" optional>
                <Input id="p-linkedin" value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
              </Field>
              <Field label="GitHub or portfolio" htmlFor="p-github" optional>
                <Input id="p-github" value={form.github} onChange={(e) => set('github', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section id="goals" title="Career goals">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Target role" htmlFor="p-role">
                <Input id="p-role" value={form.targetRole} onChange={(e) => set('targetRole', e.target.value)} placeholder="e.g. AI Engineer" />
              </Field>
              <Field label="Preferred locations" htmlFor="p-plocs" optional>
                <Input
                  id="p-plocs"
                  value={form.preferredLocations}
                  onChange={(e) => set('preferredLocations', e.target.value)}
                  placeholder="e.g. Dubai, Riyadh, Remote"
                />
              </Field>
              <Field label="Industries" htmlFor="p-ind" optional>
                <TagInput id="p-ind" value={form.industries} onChange={(v) => set('industries', v)} />
              </Field>
              <Field label="Salary expectation" htmlFor="p-salary" optional hint="Kept private. Used only when comparing offers.">
                <Input
                  id="p-salary"
                  value={form.salaryExpectation}
                  onChange={(e) => set('salaryExpectation', e.target.value)}
                  placeholder="e.g. AED 12,000 / month"
                  aria-describedby="p-salary-hint"
                />
              </Field>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-medium text-ink">Work mode</legend>
              <div className="flex flex-wrap gap-2">
                {WORK_MODES.map((m) => {
                  const on = form.workModes.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('workModes', on ? form.workModes.filter((x) => x !== m) : [...form.workModes, m])}
                      className={cn(
                        'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors',
                        on ? 'border-plum bg-plum text-paper' : 'border-line bg-paper text-ink-muted hover:border-plum-200'
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Field label="Where you want to be in 2–3 years" htmlFor="p-goals" optional className="mt-4">
              <Textarea id="p-goals" rows={3} value={form.careerGoals} onChange={(e) => set('careerGoals', e.target.value)} />
            </Field>
          </Section>

          <Section id="skills" title="Skills">
            <Field label="Skills" htmlFor="p-skills" hint="Jobs are compared against this list. Press Enter after each one.">
              <TagInput id="p-skills" value={form.skills} onChange={(v) => set('skills', v)} describedBy="p-skills-hint" />
            </Field>
          </Section>

          <Section id="summary" title="Summary">
            <Field label="Professional summary" htmlFor="p-summary" hint="2–4 lines. Used at the top of your CV and in letters.">
              <Textarea id="p-summary" rows={4} value={form.summary} onChange={(e) => set('summary', e.target.value)} aria-describedby="p-summary-hint" />
            </Field>
          </Section>

          <Section id="education" title="Education">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Degree" htmlFor="p-degree">
                <Input id="p-degree" value={form.degree} onChange={(e) => set('degree', e.target.value)} placeholder="e.g. BSc Computer Science" />
              </Field>
              <Field label="University" htmlFor="p-uni">
                <Input id="p-uni" value={form.university} onChange={(e) => set('university', e.target.value)} />
              </Field>
              <Field label="Graduation year" htmlFor="p-grad" optional>
                <Input id="p-grad" value={form.graduationYear} onChange={(e) => set('graduationYear', e.target.value)} />
              </Field>
              <Field label="GPA" htmlFor="p-gpa" optional>
                <Input id="p-gpa" value={form.gpa} onChange={(e) => set('gpa', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section id="experience" title="Experience and internships">
            <Field
              label="Roles"
              htmlFor="p-exp"
              hint="One role per paragraph: title at company (dates), then bullet points starting with -."
            >
              <Textarea id="p-exp" rows={9} value={form.experience} onChange={(e) => set('experience', e.target.value)} aria-describedby="p-exp-hint" />
            </Field>
          </Section>

          <Section id="projects" title="Projects">
            {form.projects.length === 0 && (
              <p className="mb-3 text-sm text-ink-muted">Projects are the best proof of skills for students. Add your strongest two or three.</p>
            )}
            <ul className="space-y-4">
              {form.projects.map((p, i) => (
                <li key={i} className="rounded-lg border border-line p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Project name" htmlFor={`pr-name-${i}`}>
                      <Input id={`pr-name-${i}`} value={p.name} onChange={(e) => updateProject(i, { name: e.target.value })} />
                    </Field>
                    <Field label="Link" htmlFor={`pr-link-${i}`} optional>
                      <Input id={`pr-link-${i}`} value={p.link} onChange={(e) => updateProject(i, { link: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="What it does and your part" htmlFor={`pr-desc-${i}`} className="mt-3">
                    <Textarea id={`pr-desc-${i}`} rows={2} value={p.description} onChange={(e) => updateProject(i, { description: e.target.value })} />
                  </Field>
                  <div className="mt-3 flex items-end gap-3">
                    <Field label="Tech used" htmlFor={`pr-tech-${i}`} className="flex-1">
                      <TagInput id={`pr-tech-${i}`} value={p.tech} onChange={(v) => updateProject(i, { tech: v })} />
                    </Field>
                    <Button
                      variant="ghost"
                      onClick={() => set('projects', form.projects.filter((_, j) => j !== i))}
                      aria-label={`Remove project ${p.name || i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => set('projects', [...form.projects, { name: '', description: '', tech: [], link: '' }])}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add project
            </Button>
          </Section>

          <Section id="certifications" title="Certifications and achievements">
            <ul className="space-y-3">
              {form.certifications.map((c, i) => (
                <li key={i} className="grid items-end gap-3 sm:grid-cols-[2fr_1.4fr_0.8fr_auto]">
                  <Field label="Certification" htmlFor={`ce-name-${i}`}>
                    <Input id={`ce-name-${i}`} value={c.name} onChange={(e) => updateCert(i, { name: e.target.value })} />
                  </Field>
                  <Field label="Issuer" htmlFor={`ce-iss-${i}`} optional>
                    <Input id={`ce-iss-${i}`} value={c.issuer} onChange={(e) => updateCert(i, { issuer: e.target.value })} />
                  </Field>
                  <Field label="Year" htmlFor={`ce-yr-${i}`} optional>
                    <Input id={`ce-yr-${i}`} value={c.year} onChange={(e) => updateCert(i, { year: e.target.value })} />
                  </Field>
                  <Button
                    variant="ghost"
                    onClick={() => set('certifications', form.certifications.filter((_, j) => j !== i))}
                    aria-label={`Remove ${c.name || 'certification'}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => set('certifications', [...form.certifications, { name: '', issuer: '', year: '' }])}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add certification
            </Button>
            <Field
              label="Achievements, hackathons and competitions"
              htmlFor="p-ach"
              optional
              className="mt-5"
              hint="Press Enter after each one."
            >
              <TagInput id="p-ach" value={form.achievements} onChange={(v) => set('achievements', v)} describedBy="p-ach-hint" />
            </Field>
          </Section>

          <div className="flex items-center gap-3 pb-4">
            <Button onClick={save} loading={saving} disabled={!dirty}>
              Save changes
            </Button>
            {dirty && <span className="text-sm text-ink-subtle">You have unsaved changes.</span>}
          </div>
        </div>

        {/* Strength */}
        <aside className="lg:sticky lg:top-20">
          <Card>
            <CardTitle>Profile strength</CardTitle>
            <p className="mt-2 font-serif text-4xl tabular-nums text-plum">{strength.score}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-coral transition-[width] duration-500" style={{ width: `${strength.score}%` }} />
            </div>
            <ul className="mt-4 space-y-2">
              {strength.checks.map((c) => (
                <li key={c.key}>
                  <a href={`#${c.anchor}`} className="flex items-center gap-2 text-sm hover:text-plum">
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                        c.done ? 'bg-success-100 text-success-700' : 'border border-dashed border-line text-transparent'
                      )}
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span className={c.done ? 'text-ink-muted' : 'font-medium text-ink'}>{c.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Card as="section" aria-labelledby={`${id}-title`}>
      <span id={id} className="relative -top-24 block" aria-hidden="true" />
      <h2 id={`${id}-title`} className="mb-4 font-serif text-xl text-plum">
        {title}
      </h2>
      {children}
    </Card>
  );
}
