'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Download, Plus, Printer } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { JobPicker } from '@/components/JobPicker';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Field, Input, Notice, PageHeader, Textarea } from '@/components/ui/primitives';
import { TagInput } from '@/components/ui/tag-input';
import { useAppData } from '@/context/AppDataContext';
import { downloadFile, slug } from '@/lib/format';
import { hasSkill } from '@/lib/match';

import { SubNav, DOCUMENT_TABS } from '@/components/SubNav';
import { buildCvDocx, saveBlob } from '@/lib/cvExport';
interface CvForm {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  experience: string;
  degree: string;
  university: string;
  graduationYear: string;
  skills: string[];
}

const EMPTY: CvForm = {
  fullName: '',
  targetRole: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  summary: '',
  experience: '',
  degree: '',
  university: '',
  graduationYear: '',
  skills: [],
};

/** Splits free text into paragraphs, and each paragraph into a heading line plus bullet lines. */
function parseExperience(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map(([heading, ...rest]) => ({ heading, lines: rest.map((l) => l.replace(/^[-•*]\s*/, '')) }));
}

function toPlainText(cv: CvForm): string {
  const contact = [cv.email, cv.phone, cv.location, cv.linkedin, cv.github].filter(Boolean).join(' | ');
  const edu = [cv.degree, cv.university, cv.graduationYear].filter(Boolean).join(', ');
  const parts: string[] = [cv.fullName.toUpperCase(), cv.targetRole, contact].filter(Boolean);
  if (cv.summary) parts.push('', 'SUMMARY', cv.summary);
  if (cv.experience) parts.push('', 'EXPERIENCE', cv.experience);
  if (edu) parts.push('', 'EDUCATION', edu);
  if (cv.skills.length) parts.push('', 'SKILLS', cv.skills.join(', '));
  return parts.join('\n');
}

export default function CvPage() {
  const { authStatus, profile, updateProfile, selectedJob, logActivity } = useAppData();
  const { addToast } = useToast();

  const [cv, setCv] = useState<CvForm>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Wait for the session: this page mounts before the profile has loaded.
  useEffect(() => {
    if (loaded || authStatus !== 'authenticated') return;
    setCv({
      fullName: profile.fullName,
      targetRole: profile.targetRole,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedin: profile.linkedin,
      github: profile.github,
      summary: profile.summary,
      experience: profile.experience || '',
      degree: profile.degree,
      university: profile.university,
      graduationYear: profile.graduationYear,
      skills: profile.skills,
    });
    setLoaded(true);
  }, [loaded, authStatus, profile]);

  const set = <K extends keyof CvForm>(key: K, value: CvForm[K]) => setCv((prev) => ({ ...prev, [key]: value }));

  const dirty = useMemo(() => {
    const keys = Object.keys(EMPTY) as Array<keyof CvForm>;
    return keys.some((k) =>
      k === 'skills'
        ? cv.skills.join('|') !== profile.skills.join('|')
        : (cv[k] as string) !== ((profile as unknown as Record<string, string>)[k] || '')
    );
  }, [cv, profile]);

  const save = async () => {
    setSaving(true);
    const { email: _email, ...rest } = cv;
    await updateProfile(rest);
    setSaving(false);
    logActivity('file', 'Updated CV', cv.targetRole || cv.fullName);
    addToast({ title: 'CV saved' });
  };

  // Skills the chosen role lists that are not on the CV yet.
  const roleSkills = selectedJob?.skills || [];
  const missing = roleSkills.filter((s) => !hasSkill(cv.skills, s));
  const covered = roleSkills.filter((s) => hasSkill(cv.skills, s));

  const experience = parseExperience(cv.experience);
  const contact = [cv.email, cv.phone, cv.location].filter(Boolean);
  const links = [cv.linkedin, cv.github].filter(Boolean);
  const education = [cv.degree, cv.university].filter(Boolean).join(', ');
  const isEmpty = !cv.summary && !cv.experience && !education && cv.skills.length === 0;

  return (
    <AppShell wide>
      <div className="no-print">
        <SubNav items={DOCUMENT_TABS} label="CV and documents" />
        <PageHeader
          title="CV"
          description="Your CV is built only from what you enter here. Edit on the left and the page on the right updates as you type."
          actions={
            <>
              <Button variant="secondary" onClick={() => downloadFile(`${slug(cv.fullName || 'cv')}_CV.txt`, toPlainText(cv), 'text/plain;charset=utf-8')}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Plain text
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const blob = await buildCvDocx({ ...profile, ...cv });
                  saveBlob(blob, `${slug(cv.fullName || 'cv')}_CV.docx`);
                }}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Word
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print or save PDF
              </Button>
              <Button onClick={save} loading={saving} disabled={!dirty}>
                Save
              </Button>
            </>
          }
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="no-print space-y-6">
          <Card as="section">
            <CardTitle>Compare with a role</CardTitle>
            <JobPicker id="cv-job" label="Role to compare against" className="mt-4" />
            {selectedJob &&
              (roleSkills.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">This listing does not name specific skills.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-ink-muted">
                    Your CV mentions <strong className="text-ink">{covered.length}</strong> of the{' '}
                    <strong className="text-ink">{roleSkills.length}</strong> skills this role lists.
                  </p>
                  {missing.length > 0 ? (
                    <>
                      <ul className="flex flex-wrap gap-1.5">
                        {missing.map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              onClick={() => set('skills', [...cv.skills, s])}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-paper px-3 text-sm text-ink-muted transition-colors hover:border-plum hover:text-plum"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <Notice tone="warn">Only add a skill if you genuinely have it — you may be asked about it.</Notice>
                    </>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-success-700">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Every listed skill is on your CV.
                    </p>
                  )}
                </div>
              ))}
          </Card>

          <Card as="section">
            <CardTitle>Details</CardTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="cv-name">
                <Input id="cv-name" value={cv.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Headline" htmlFor="cv-role" hint="Usually the role you want.">
                <Input id="cv-role" value={cv.targetRole} onChange={(e) => set('targetRole', e.target.value)} aria-describedby="cv-role-hint" />
              </Field>
              <Field label="Phone" htmlFor="cv-phone" optional>
                <Input id="cv-phone" type="tel" value={cv.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
              </Field>
              <Field label="Location" htmlFor="cv-location" optional>
                <Input id="cv-location" value={cv.location} onChange={(e) => set('location', e.target.value)} />
              </Field>
              <Field label="LinkedIn" htmlFor="cv-linkedin" optional>
                <Input id="cv-linkedin" value={cv.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
              </Field>
              <Field label="Portfolio or GitHub" htmlFor="cv-github" optional>
                <Input id="cv-github" value={cv.github} onChange={(e) => set('github', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card as="section">
            <CardTitle>Content</CardTitle>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Summary" htmlFor="cv-summary" hint="Two or three sentences.">
                <Textarea id="cv-summary" rows={4} value={cv.summary} onChange={(e) => set('summary', e.target.value)} aria-describedby="cv-summary-hint" />
              </Field>
              <Field
                label="Experience"
                htmlFor="cv-experience"
                hint="One role per paragraph. First line: title, company and dates. Following lines: what you did. Leave a blank line between roles."
              >
                <Textarea
                  id="cv-experience"
                  rows={9}
                  value={cv.experience}
                  onChange={(e) => set('experience', e.target.value)}
                  aria-describedby="cv-experience-hint"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Degree or qualification" htmlFor="cv-degree" optional>
                  <Input id="cv-degree" value={cv.degree} onChange={(e) => set('degree', e.target.value)} />
                </Field>
                <Field label="School or university" htmlFor="cv-university" optional>
                  <Input id="cv-university" value={cv.university} onChange={(e) => set('university', e.target.value)} />
                </Field>
                <Field label="Year completed" htmlFor="cv-year" optional>
                  <Input id="cv-year" inputMode="numeric" value={cv.graduationYear} onChange={(e) => set('graduationYear', e.target.value)} />
                </Field>
              </div>
              <Field label="Skills" htmlFor="cv-skills" hint="Press Enter after each one.">
                <TagInput id="cv-skills" value={cv.skills} onChange={(v) => set('skills', v)} describedBy="cv-skills-hint" />
              </Field>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <section aria-label="CV preview" className="xl:sticky xl:top-24">
          <div className="print-sheet mx-auto min-h-[40rem] max-w-[50rem] rounded-lg border border-line bg-paper p-8 shadow-raised sm:p-12">
            <header className="border-b border-line pb-5">
              <h2 className="font-serif text-3xl text-plum">{cv.fullName || 'Your name'}</h2>
              {cv.targetRole && <p className="mt-1 text-lg text-ink-muted">{cv.targetRole}</p>}
              {(contact.length > 0 || links.length > 0) && (
                <p className="mt-3 text-sm text-ink-muted">{[...contact, ...links].join('  ·  ')}</p>
              )}
            </header>

            {isEmpty && (
              <p className="no-print mt-8 text-sm text-ink-subtle">
                Your CV is empty. Add a summary, your experience and your skills on the left and they will appear here.
              </p>
            )}

            {cv.summary && (
              <section className="mt-6">
                <h3 className="eyebrow">Summary</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{cv.summary}</p>
              </section>
            )}

            {experience.length > 0 && (
              <section className="mt-6">
                <h3 className="eyebrow">Experience</h3>
                <div className="mt-2 space-y-4">
                  {experience.map((role, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-ink">{role.heading}</p>
                      {role.lines.length > 0 && (
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink">
                          {role.lines.map((line, j) => (
                            <li key={j}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {education && (
              <section className="mt-6">
                <h3 className="eyebrow">Education</h3>
                <p className="mt-2 text-sm text-ink">
                  {education}
                  {cv.graduationYear && <span className="text-ink-muted"> — {cv.graduationYear}</span>}
                </p>
              </section>
            )}

            {cv.skills.length > 0 && (
              <section className="mt-6">
                <h3 className="eyebrow">Skills</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink">{cv.skills.join(' · ')}</p>
              </section>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
