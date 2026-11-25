'use client';

import { useState } from 'react';
import { Check, Download, FileText, Loader2, Save, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useToast } from '@/components/providers';
import { DOCUMENT_TABS, SubNav } from '@/components/SubNav';
import { Button } from '@/components/ui/button';
import { Badge, Card, CardTitle, Field, Input, Notice, PageHeader, Textarea } from '@/components/ui/primitives';
import { useAppData, type CvVersion, type LiveUserProfile } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { buildCvDocx, saveBlob } from '@/lib/cvExport';
import { slug } from '@/lib/format';
import { lineDiff, wordDiff } from '@/lib/wordDiff';

interface Tailored {
  summary: string;
  experience: string;
  skills: string[];
  keywords: string[];
  changes: Array<{ what: string; why: string }>;
  untraceable: string[];
}

function parseTailored(text: string): Tailored {
  const raw = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  return {
    summary: String(raw.summary || ''),
    experience: String(raw.experience || ''),
    skills: arr(raw.skills),
    keywords: arr(raw.keywords),
    changes: Array.isArray(raw.changes)
      ? raw.changes.map((c: { what?: unknown; why?: unknown }) => ({ what: String(c?.what || ''), why: String(c?.why || '') })).filter((c: { what: string }) => c.what)
      : [],
    untraceable: arr(raw.untraceable),
  };
}

async function downloadDocx(profile: LiveUserProfile, version?: Pick<CvVersion, 'summary' | 'experience' | 'skills' | 'name'>) {
  const blob = await buildCvDocx({
    ...profile,
    summary: version?.summary ?? profile.summary,
    experience: version?.experience ?? profile.experience,
    skills: version?.skills ?? profile.skills,
  });
  saveBlob(blob, `${slug(profile.fullName || 'cv')}${version ? `_${slug(version.name)}` : ''}_CV.docx`);
}

export default function ResumeStudioPage() {
  const { profile, updateProfile, selectedJob, authStatus } = useAppData();
  const { addToast } = useToast();
  const [job, setJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Tailored | null>(null);
  const [versionName, setVersionName] = useState('');

  const versions = profile.cvVersions ?? [];
  const hasCv = Boolean(profile.summary || profile.experience || profile.skills.length);

  const tailor = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    const res = await fetch('/api/career/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'cv-json', input: `JOB POSTING:\n${job}`, profile }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !data.text) {
      setError(data?.error?.message || 'The CV could not be tailored. Please try again.');
      return;
    }
    try {
      setResult(parseTailored(data.text));
      setVersionName(selectedJob && job.includes(selectedJob.title) ? `${selectedJob.title} – ${selectedJob.company}` : 'Tailored version');
    } catch {
      setError('The AI returned something we could not read. Please try again.');
    }
  };

  const saveVersion = async () => {
    if (!result) return;
    const v: CvVersion = {
      id: `cv-${Date.now()}`,
      name: versionName.trim() || 'Tailored version',
      createdAt: new Date().toISOString(),
      forRole: versionName.trim(),
      summary: result.summary,
      experience: result.experience,
      skills: result.skills,
    };
    await updateProfile({ cvVersions: [v, ...versions].slice(0, 20) });
    addToast({ type: 'success', title: 'Version saved', description: v.name });
  };

  const makeMain = async (v: Pick<CvVersion, 'summary' | 'experience' | 'skills' | 'name'>) => {
    // Keep the current main CV as a version first, so nothing is lost.
    const backup: CvVersion = {
      id: `cv-${Date.now()}-prev`,
      name: `Before "${v.name}"`,
      createdAt: new Date().toISOString(),
      summary: profile.summary,
      experience: profile.experience,
      skills: profile.skills,
    };
    await updateProfile({
      summary: v.summary,
      experience: v.experience,
      skills: v.skills,
      cvVersions: [backup, ...versions].slice(0, 20),
    });
    addToast({ type: 'success', title: 'Main CV updated', description: 'Your previous CV was saved as a version.' });
  };

  if (authStatus === 'loading') return <AppShell>{null}</AppShell>;

  return (
    <AppShell wide>
      <SubNav items={DOCUMENT_TABS} label="CV and documents" />
      <PageHeader
        eyebrow="Resume Studio"
        title="Tailor, compare and keep versions"
        description="Tailor your CV to one job, see exactly what changed and why, then save it as a version or download it as Word."
        actions={
          <Button variant="secondary" onClick={() => downloadDocx(profile)} disabled={!hasCv}>
            <Download className="h-4 w-4" aria-hidden="true" /> Main CV as Word
          </Button>
        }
      />

      {!hasCv && (
        <Notice tone="info" className="mb-6">
          Your profile has no summary, experience or skills yet. Upload your CV on My profile first, then tailor it here.
        </Notice>
      )}

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card as="section">
            <CardTitle>Tailor to a job</CardTitle>
            <Field label="Job posting" htmlFor="rs-job" className="mt-4" hint="Paste the full description.">
              <Textarea id="rs-job" rows={10} value={job} onChange={(e) => setJob(e.target.value)} />
            </Field>
            {selectedJob && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() =>
                  setJob(
                    [`${selectedJob.title} at ${selectedJob.company} (${selectedJob.location})`, `Skills listed: ${(selectedJob.skills || []).join(', ')}`, selectedJob.description]
                      .filter(Boolean)
                      .join('\n')
                  )
                }
              >
                Use “{selectedJob.title}”
              </Button>
            )}
            <Button className="mt-4 w-full" onClick={tailor} disabled={loading || !job.trim() || !hasCv}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
              {loading ? 'Tailoring…' : 'Tailor my CV'}
            </Button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-subtle">
              <Sparkles className="h-3.5 w-3.5 text-coral" aria-hidden="true" /> Only reorders and rewords your own facts.
            </p>
          </Card>

          <Card as="section">
            <CardTitle>Saved versions</CardTitle>
            {versions.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">Tailored versions you save appear here, one per role type.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {versions.map((v) => (
                  <li key={v.id} className="py-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <FileText className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                      <span className="truncate">{v.name}</span>
                    </p>
                    <p className="ml-6 text-xs text-ink-subtle">{new Date(v.createdAt).toLocaleDateString()}</p>
                    <div className="ml-4 mt-1.5 flex flex-wrap gap-1">
                      <Button variant="ghost" size="sm" onClick={() => downloadDocx(profile, v)}>
                        <Download className="h-3.5 w-3.5" aria-hidden="true" /> Word
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => makeMain(v)}>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" /> Make main
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete version ${v.name}`}
                        onClick={() => updateProfile({ cvVersions: versions.filter((x) => x.id !== v.id) })}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6" aria-live="polite">
          {error && <Notice tone="warn">{error}</Notice>}
          {loading && (
            <Card className="flex items-center gap-3 text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Reading the job and tailoring your CV…
            </Card>
          )}
          {!result && !loading && !error && (
            <Card className="text-sm text-ink-muted">
              Your tailored CV appears here next to your current one, with every added word highlighted and every removed
              word struck through.
            </Card>
          )}

          {result && (
            <>
              <Card as="section">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Field label="Save as" htmlFor="rs-name" className="flex-1">
                    <Input id="rs-name" value={versionName} onChange={(e) => setVersionName(e.target.value)} />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={saveVersion}>
                      <Save className="h-4 w-4" aria-hidden="true" /> Save version
                    </Button>
                    <Button variant="secondary" onClick={() => makeMain({ ...result, name: versionName || 'Tailored version' })}>
                      Make it my main CV
                    </Button>
                    <Button variant="secondary" onClick={() => downloadDocx(profile, { ...result, name: versionName || 'tailored' })}>
                      <Download className="h-4 w-4" aria-hidden="true" /> Word
                    </Button>
                  </div>
                </div>
              </Card>

              {result.untraceable.length > 0 && (
                <Notice tone="warn" title="Check these before you use it">
                  <ul className="mt-1 list-disc pl-5">
                    {result.untraceable.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </Notice>
              )}

              <Compare title="Summary" before={profile.summary} after={result.summary} />
              <Compare title="Experience" before={profile.experience} after={result.experience} pre />
              <Compare title="Skills" before={profile.skills.join(', ')} after={result.skills.join(', ')} />

              <div className="grid gap-6 lg:grid-cols-2">
                <Card as="section">
                  <CardTitle>What changed and why</CardTitle>
                  <ul className="mt-3 space-y-3 text-sm">
                    {result.changes.map((c, i) => (
                      <li key={i}>
                        <p className="font-medium text-ink">{c.what}</p>
                        <p className="text-ink-muted">{c.why}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card as="section">
                  <CardTitle>Job keywords used</CardTitle>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.keywords.map((k) => (
                      <Badge key={k}>{k}</Badge>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Compare({ title, before, after, pre = false }: { title: string; before: string; after: string; pre?: boolean }) {
  const parts = pre ? lineDiff(before || '', after || '') : wordDiff(before || '', after || '');
  const text = cn('text-sm leading-relaxed', pre && 'whitespace-pre-wrap');
  return (
    <Card as="section">
      <CardTitle>{title}</CardTitle>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">Before</p>
          <div className={cn(text, 'rounded-md border border-line bg-ivory p-3 text-ink-muted')}>{before || '—'}</div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">After</p>
          <div className={cn(text, 'rounded-md border border-plum-100 bg-paper p-3 text-ink')}>
            {parts.map((p, i) =>
              p.type === 'same' ? (
                <span key={i}>{p.text}</span>
              ) : p.type === 'added' ? (
                <mark key={i} className="rounded bg-success-100 px-0.5 text-success-700">
                  {p.text}
                </mark>
              ) : (
                <del key={i} className="text-ink-subtle decoration-danger/60">
                  {p.text}
                </del>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
