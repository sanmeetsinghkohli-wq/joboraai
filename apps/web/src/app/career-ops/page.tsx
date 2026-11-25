'use client';

import { useState } from 'react';
import { recordInterview, scoreFromFeedback } from '@/lib/workspace';
import { AlertTriangle, ClipboardCheck, Copy, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { AnswerTools } from '@/components/AnswerTools';
import { Markdown } from '@/components/Markdown';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Badge, Card, CardTitle, Field, Input, Notice, PageHeader, Segmented, Select, Textarea } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';

type Tab =
  | 'evaluate'
  | 'strategy'
  | 'triage'
  | 'cv'
  | 'ats'
  | 'cover'
  | 'interview-prep'
  | 'upskill'
  | 'outreach'
  | 'followup'
  | 'mock'
  | 'offer';

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'evaluate', label: 'Fit report' },
  { value: 'strategy', label: 'Application strategy' },
  { value: 'triage', label: 'Triage' },
  { value: 'cv', label: 'Tailor CV' },
  { value: 'ats', label: 'ATS check' },
  { value: 'cover', label: 'Cover letter' },
  { value: 'interview-prep', label: 'Interview prep' },
  { value: 'upskill', label: 'Skill plan' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'followup', label: 'Follow-ups' },
  { value: 'mock', label: 'Mock interview' },
  { value: 'offer', label: 'Offers' },
];

interface Flag {
  kind: 'ai-directed' | 'scam';
  message: string;
  quote: string;
}

interface AiResult {
  text?: string;
  flags?: Flag[];
  error?: string;
}

async function callAi(mode: string, input: string, profile: unknown): Promise<AiResult> {
  const res = await fetch('/api/career/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, input, profile }),
  });
  const data = await res.json().catch(() => ({}));
  return { text: data.text, flags: data.flags, error: res.ok ? undefined : data?.error?.message || 'Something went wrong.' };
}

export default function CareerOpsPage() {
  const [tab, setTab] = useState<Tab>('evaluate');
  return (
    <AppShell>
      <PageHeader
        eyebrow="Career Ops"
        title="Your job-search toolkit"
        description="Fit reports, ATS checks and drafts built only from your own profile. Nothing is ever sent for you."
      />
      <Segmented label="Tool" options={TABS} value={tab} onChange={setTab} className="mb-6 overflow-x-auto" />
      {tab === 'evaluate' && <Evaluate />}
      {tab === 'strategy' && (
        <JobTool
          key="strategy"
          mode="strategy"
          title="Plan this application"
          description="A readiness checklist, how to position yourself, which experience to lead with, honest answers to weak spots and drafted answers to application questions."
          inputLabel="Application questions or notes"
          placeholder="Paste any application questions from the form, or notes about the role"
          button="Build my strategy"
          withJob
          optionalInput
        />
      )}
      {tab === 'triage' && (
        <JobTool
          key="triage"
          mode="triage"
          title="Quick go / no-go on several roles"
          description="Paste two or more postings, separated by a line with three dashes (---). You get one line per role with a score estimate and a verdict."
          inputLabel="Job postings"
          placeholder={'First job description…\n---\nSecond job description…'}
          button="Triage roles"
        />
      )}
      {tab === 'cv' && (
        <JobTool
          key="cv"
          mode="cv"
          title="Tailor your CV to one role"
          description="Reorders and rewords your own profile around the job's keywords, keeps it ATS-safe, and lists anything it could not trace back to your profile."
          button="Tailor my CV"
          withJob
        />
      )}
      {tab === 'cover' && (
        <JobTool
          key="cover"
          mode="cover"
          title="Cover letter, 300–420 words"
          description="Answer the questions below in a few words each for a much stronger letter. You review it before using it anywhere."
          inputLabel="Your answers (optional)"
          placeholder={'Why this company or role?\nWhat problem would you help them solve?\nWhat would you do first?\nTone: direct, conversational or formal?'}
          button="Draft cover letter"
          withJob
          optionalInput
        />
      )}
      {tab === 'interview-prep' && (
        <JobTool
          key="interview-prep"
          mode="interview-prep"
          title="Prepare for the interview"
          description="Likely questions, STAR+R stories built only from your profile, questions to ask them, and honest answers to your weak spots."
          button="Build interview prep"
          withJob
        />
      )}
      {tab === 'upskill' && (
        <JobTool
          key="upskill"
          mode="upskill"
          title="Close your skill gaps"
          description="Ranks the gaps that recur across your target roles with the fastest credible way to close each, and suggests other job titles worth searching."
          inputLabel="Target roles or postings"
          placeholder="e.g. AI engineer, ML engineer, data scientist — or paste a few postings"
          button="Build my skill plan"
        />
      )}
      {tab === 'ats' && <AtsCheck />}
      {tab === 'outreach' && <SimpleDraft mode="outreach" />}
      {tab === 'followup' && <FollowUps />}
      {tab === 'mock' && <MockInterview />}
      {tab === 'offer' && <Offers />}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ shared */

function useJobText() {
  const { selectedJob } = useAppData();
  const fromSelected = selectedJob
    ? [
        `${selectedJob.title} at ${selectedJob.company} (${selectedJob.location})`,
        selectedJob.salaryRange && `Pay: ${selectedJob.salaryRange}`,
        selectedJob.sourceUrl && `Link: ${selectedJob.sourceUrl}`,
        selectedJob.skills?.length && `Skills listed: ${selectedJob.skills.join(', ')}`,
        selectedJob.description,
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  return { selectedJob, fromSelected };
}

function JobInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const { selectedJob, fromSelected } = useJobText();
  return (
    <Field
      label="Job posting"
      htmlFor={id}
      hint="Paste the full job description. Jobora treats it as untrusted text."
    >
      <Textarea id={id} rows={9} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste the job description here" />
      {selectedJob && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange(fromSelected)}>
          Use “{selectedJob.title}” from Jobs
        </Button>
      )}
    </Field>
  );
}

function Output({ result, loading }: { result: AiResult | null; loading: boolean }) {
  const { addToast } = useToast();
  if (loading)
    return (
      <Card className="flex items-center gap-3 text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Drafting…
      </Card>
    );
  if (!result) return null;
  return (
    <div className="space-y-4" aria-live="polite">
      {result.flags && result.flags.length > 0 && <Flags flags={result.flags} />}
      {result.error && <Notice tone="warn">{result.error}</Notice>}
      {result.text && (
        <Card>
          <div className="mb-3 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(result.text ?? '');
                addToast({ type: 'success', title: 'Copied to clipboard' });
              }}
            >
              <Copy className="h-4 w-4" aria-hidden="true" /> Copy
            </Button>
          </div>
          <Markdown text={result.text} />
        </Card>
      )}
    </div>
  );
}

function Flags({ flags }: { flags: Flag[] }) {
  return (
    <Notice tone="error" title="Red flags in this posting">
      <ul className="mt-1 space-y-2">
        {flags.map((f, i) => (
          <li key={i}>
            <span className="font-semibold">{f.kind === 'scam' ? 'Possible scam: ' : 'AI-directed text: '}</span>
            {f.message}
            <q className="mt-0.5 block text-xs italic opacity-80">{f.quote}</q>
          </li>
        ))}
      </ul>
    </Notice>
  );
}

/* ------------------------------------------------------------------ tools */

function Evaluate() {
  const { profile } = useAppData();
  const [job, setJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>Is this role worth applying for?</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">
          Career-ops&apos; method: every requirement is checked against your profile with the evidence quoted, then one
          overall score out of 5. Below 4.0 it will tell you honestly not to apply.
        </p>
        <JobInput id="fit-job" value={job} onChange={setJob} />
        <Button
          className="mt-4"
          disabled={loading || !job.trim()}
          onClick={async () => {
            setLoading(true);
            setResult(await callAi('evaluate', job, profile));
            setLoading(false);
          }}
        >
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Build fit report
        </Button>
      </Card>
      <Output result={result} loading={loading} />
    </div>
  );
}

interface AtsResult {
  score: number;
  grade: string;
  issues: Array<{ id: string; severity: string; message: string }>;
  keywordCoverage: { total: number; found: number; percent: number; missing: string[] } | null;
}

function AtsCheck() {
  const { profile } = useAppData();
  const { selectedJob } = useJobText();
  const [source, setSource] = useState<'profile' | 'text'>('profile');
  const [text, setText] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AtsResult | null>(null);

  const run = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/career/ats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, text, profile, keywords }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setResult(data);
    else {
      setResult(null);
      setError(data?.error?.message || 'The check could not run.');
    }
    setLoading(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>Can applicant tracking systems read your CV?</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">
          Scored by the open-source career-ops ATS checker: text, headings, contact details, layout, fonts and hidden
          text. No AI is involved, so the same CV always gets the same score.
        </p>
        <Segmented
          label="CV source"
          options={[
            { value: 'profile', label: 'My Jobora CV' },
            { value: 'text', label: 'Paste a CV' },
          ]}
          value={source}
          onChange={setSource}
          className="mb-4"
        />
        {source === 'text' && (
          <Field label="CV text" htmlFor="ats-text" hint="Put each section heading (EXPERIENCE, EDUCATION…) on its own line.">
            <Textarea id="ats-text" rows={9} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
        )}
        <Field label="Keywords from the job" htmlFor="ats-kw" optional hint="Comma separated. Shows which ones your CV covers.">
          <Input id="ats-kw" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="python, sql, machine learning" />
          {selectedJob?.skills?.length ? (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setKeywords(selectedJob.skills.join(', '))}>
              Use skills from “{selectedJob.title}”
            </Button>
          ) : null}
        </Field>
        <Button className="mt-4" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
          Run ATS check
        </Button>
      </Card>

      <div className="space-y-4" aria-live="polite">
        {error && <Notice tone="warn">{error}</Notice>}
        {result && (
          <>
            <Card className="flex items-center gap-6">
              <div
                className={cn(
                  'flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-8',
                  result.score >= 80 ? 'border-success' : result.score >= 60 ? 'border-coral' : 'border-danger'
                )}
              >
                <span className="font-serif text-3xl text-plum">{result.score}</span>
                <span className="text-xs text-ink-subtle">/ 100</span>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Grade</p>
                <p className="font-serif text-3xl text-plum">{result.grade}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {result.issues.length === 0 ? 'No issues found.' : `${result.issues.length} thing${result.issues.length > 1 ? 's' : ''} to fix.`}
                </p>
              </div>
            </Card>
            {result.keywordCoverage && (
              <Card>
                <CardTitle>
                  Keywords: {result.keywordCoverage.found} of {result.keywordCoverage.total} found
                </CardTitle>
                {result.keywordCoverage.missing.length > 0 && (
                  <>
                    <p className="mt-2 text-sm text-ink-muted">Missing. Add only the ones you can honestly claim:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.keywordCoverage.missing.map((k) => (
                        <Badge key={k}>{k}</Badge>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}
            {result.issues.length > 0 && (
              <Card>
                <CardTitle>What to fix</CardTitle>
                <ul className="mt-3 space-y-3">
                  {result.issues.map((i) => (
                    <li key={i.id} className="flex gap-3 text-sm">
                      <AlertTriangle
                        className={cn('mt-0.5 h-4 w-4 shrink-0', i.severity === 'critical' ? 'text-danger' : 'text-warn')}
                        aria-hidden="true"
                      />
                      <span className="text-ink">{i.message}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SimpleDraft({ mode }: { mode: 'outreach' }) {
  const { profile } = useAppData();
  const [job, setJob] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>Reach out to a recruiter or hiring manager</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">Three short drafts. Copy the one you like and send it yourself.</p>
        <JobInput id="out-job" value={job} onChange={setJob} />
        <Field label="Who you are writing to" htmlFor="out-contact" optional className="mt-4">
          <Input id="out-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. Sara, engineering manager" />
        </Field>
        <Button
          className="mt-4"
          disabled={loading || !job.trim()}
          onClick={async () => {
            setLoading(true);
            setResult(await callAi(mode, `${job}\n\nContact: ${contact || 'not given'}`, profile));
            setLoading(false);
          }}
        >
          Draft messages
        </Button>
      </Card>
      <Output result={result} loading={loading} />
    </div>
  );
}

function FollowUps() {
  const { profile, applications } = useAppData();
  const [appId, setAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const app = applications.find((a) => a.id === appId);

  const due = (iso: string, days: number) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d;
  };
  const followDate = app?.appliedAt ? due(app.appliedAt, 7) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>Follow up at the right time</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">
          About 7 business days after applying, and 2–3 days after an interview.
        </p>
        {applications.length === 0 ? (
          <Notice tone="info">Track an application first. Follow-ups are built from your tracker.</Notice>
        ) : (
          <>
            <Field label="Application" htmlFor="fu-app">
              <Select id="fu-app" value={appId} onChange={(e) => setAppId(e.target.value)}>
                <option value="">Choose an application</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} — {a.company} ({a.status})
                  </option>
                ))}
              </Select>
            </Field>
            {followDate && (
              <p className="mt-3 text-sm text-ink-muted">
                Suggested follow-up: <strong className="text-plum">{followDate.toLocaleDateString()}</strong>
              </p>
            )}
            <Button
              className="mt-4"
              disabled={loading || !app}
              onClick={async () => {
                if (!app) return;
                setLoading(true);
                setResult(
                  await callAi(
                    'followup',
                    `Role: ${app.title}\nCompany: ${app.company}\nStatus: ${app.status}\nApplied: ${app.appliedAt || 'unknown'}\nRecruiter: ${app.recruiterName || 'not given'}\nToday: ${new Date().toISOString().slice(0, 10)}`,
                    profile
                  )
                );
                setLoading(false);
              }}
            >
              Draft follow-ups
            </Button>
          </>
        )}
      </Card>
      <Output result={result} loading={loading} />
    </div>
  );
}

function MockInterview() {
  const { profile } = useAppData();
  const [role, setRole] = useState(profile.targetRole || '');
  const [asked, setAsked] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<AiResult | null>(null);

  const next = async () => {
    setLoading(true);
    setError('');
    setFeedback(null);
    setAnswer('');
    const r = await callAi('mock-question', `Role: ${role}\nPrevious questions:\n${asked.join('\n') || '(none)'}`, profile);
    if (r.text) {
      setQuestion(r.text);
      setAsked((a) => [...a, r.text as string]);
    } else setError(r.error || 'Could not get a question.');
    setLoading(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>Practise one question at a time</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">Answer as you would out loud. You get a score out of 5 and a stronger version built from your own facts.</p>
        <Field label="Role" htmlFor="mock-role">
          <Input id="mock-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend developer" />
        </Field>
        <Button className="mt-4" variant={question ? 'secondary' : 'primary'} onClick={next} disabled={loading || !role.trim()}>
          {question ? 'Next question' : 'Start mock interview'}
        </Button>
        {asked.length > 0 && <p className="mt-3 text-xs text-ink-subtle">{asked.length} question{asked.length > 1 ? 's' : ''} asked this session</p>}
        {error && <Notice tone="warn" className="mt-4">{error}</Notice>}
      </Card>
      <div className="space-y-4">
        {question && (
          <Card>
            <Badge>Question {asked.length}</Badge>
            <p className="mt-3 font-serif text-xl text-plum">{question}</p>
            <Field label="Your answer" htmlFor="mock-answer" className="mt-4">
              <Textarea id="mock-answer" rows={7} value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </Field>
            <AnswerTools value={answer} onChange={setAnswer} />
            <Button
              className="mt-4"
              disabled={loading || !answer.trim()}
              onClick={async () => {
                setLoading(true);
                const r = await callAi('mock-feedback', `Role: ${role}\nQuestion: ${question}\nAnswer: ${answer}`, profile);
                setFeedback(r);
                const score = scoreFromFeedback(r.text);
                if (score !== null) recordInterview({ role, question, score, source: 'career-ops' });
                setLoading(false);
              }}
            >
              Get feedback
            </Button>
          </Card>
        )}
        <Output result={feedback} loading={loading && Boolean(question)} />
      </div>
    </div>
  );
}

function Offers() {
  const { profile } = useAppData();
  const [offers, setOffers] = useState(['', '']);
  const [priorities, setPriorities] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const filled = offers.filter((o) => o.trim());

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>Compare offers and prepare to negotiate</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">Uses only the figures you enter. It does not guess market rates.</p>
        {offers.map((o, i) => (
          <Field key={i} label={`Offer ${i + 1}`} htmlFor={`offer-${i}`} className="mb-3">
            <Textarea
              id={`offer-${i}`}
              rows={4}
              value={o}
              onChange={(e) => setOffers((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder="Company, role, base pay, bonus, location, start date…"
            />
          </Field>
        ))}
        {offers.length < 4 && (
          <Button variant="ghost" size="sm" onClick={() => setOffers((o) => [...o, ''])}>
            Add another offer
          </Button>
        )}
        <Field label="What matters most to you" htmlFor="offer-prio" optional className="mt-3">
          <Input id="offer-prio" value={priorities} onChange={(e) => setPriorities(e.target.value)} placeholder="e.g. learning, remote work, pay" />
        </Field>
        <Button
          className="mt-4"
          disabled={loading || filled.length === 0}
          onClick={async () => {
            setLoading(true);
            setResult(
              await callAi('offer', `${filled.map((o, i) => `Offer ${i + 1}:\n${o}`).join('\n\n')}\n\nPriorities: ${priorities || 'not given'}`, profile)
            );
            setLoading(false);
          }}
        >
          Compare offers
        </Button>
      </Card>
      <Output result={result} loading={loading} />
    </div>
  );
}

/** One career-ops mode: an optional job posting plus an optional free-text field, then a draft. */
function JobTool({
  mode,
  title,
  description,
  button,
  withJob = false,
  inputLabel,
  placeholder,
  optionalInput = false,
}: {
  mode: 'triage' | 'cv' | 'cover' | 'interview-prep' | 'upskill' | 'strategy';
  title: string;
  description: string;
  button: string;
  withJob?: boolean;
  inputLabel?: string;
  placeholder?: string;
  optionalInput?: boolean;
}) {
  const { profile } = useAppData();
  const [job, setJob] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  const ready = (!withJob || job.trim()) && (!inputLabel || optionalInput || text.trim());

  const run = async () => {
    setLoading(true);
    const parts = [
      withJob && `JOB POSTING:\n${job}`,
      inputLabel && text.trim() && `${inputLabel.toUpperCase()}:\n${text}`,
    ].filter(Boolean);
    setResult(await callAi(mode, parts.join('\n\n'), profile));
    setLoading(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>{title}</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">{description}</p>
        {withJob && <JobInput id={`${mode}-job`} value={job} onChange={setJob} />}
        {inputLabel && (
          <Field
            label={inputLabel}
            htmlFor={`${mode}-text`}
            optional={optionalInput}
            className={withJob ? 'mt-4' : undefined}
          >
            <Textarea
              id={`${mode}-text`}
              rows={mode === 'triage' ? 12 : 5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
            />
          </Field>
        )}
        <Button className="mt-4" disabled={loading || !ready} onClick={run}>
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> {button}
        </Button>
      </Card>
      <Output result={result} loading={loading} />
    </div>
  );
}
