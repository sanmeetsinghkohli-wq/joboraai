'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Mic, Square, Trash2, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { JobPicker } from '@/components/JobPicker';
import { useToast } from '@/components/providers';
import { Button, IconButton } from '@/components/ui/button';
import { Badge, Card, CardTitle, EmptyState, PageHeader, Textarea } from '@/components/ui/primitives';
import { useAppData, type LiveJob } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';

interface Question {
  id: string;
  kind: 'Behavioural' | 'Role' | 'Skill';
  text: string;
}

interface SavedAnswer {
  id: string;
  question: string;
  role: string;
  answer: string;
  savedAt: string;
}

const STORAGE_KEY = 'jobora_interview_answers';

const BEHAVIOURAL: Question[] = [
  { id: 'b-1', kind: 'Behavioural', text: 'Tell me about yourself and why you are interested in this role.' },
  { id: 'b-2', kind: 'Behavioural', text: 'Describe a time you had to deliver something under a tight deadline. What did you do?' },
  { id: 'b-3', kind: 'Behavioural', text: 'Tell me about a disagreement with a colleague and how you resolved it.' },
  { id: 'b-4', kind: 'Behavioural', text: 'What is a mistake you made at work, and what did you change afterwards?' },
];

/** Questions built only from the role's own title, company and listed skills. */
function questionsFor(job: LiveJob | null): Question[] {
  if (!job) return BEHAVIOURAL;
  const role: Question[] = [
    { id: 'r-1', kind: 'Role', text: `Why do you want to work at ${job.company}?` },
    { id: 'r-2', kind: 'Role', text: `What would you focus on in your first three months as ${job.title}?` },
  ];
  const skills: Question[] = job.skills.slice(0, 5).map((skill, i) => ({
    id: `s-${i}`,
    kind: 'Skill',
    text: `Walk me through a piece of work where you used ${skill}. What was the result?`,
  }));
  return [...role, ...skills, ...BEHAVIOURAL];
}

const STAR = [
  { key: 'S', label: 'Situation', hint: 'Where and when — the context in a sentence or two.' },
  { key: 'T', label: 'Task', hint: 'What you were responsible for.' },
  { key: 'A', label: 'Action', hint: 'What you did yourself, step by step.' },
  { key: 'R', label: 'Result', hint: 'What changed — with a number if you have one.' },
];

export default function InterviewPage() {
  const { selectedJob, logActivity } = useAppData();
  const { addToast } = useToast();

  const questions = useMemo(() => questionsFor(selectedJob), [selectedJob]);
  const [qid, setQid] = useState(questions[0].id);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<SavedAnswer[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) setSaved(stored);
    } catch {
      /* none saved */
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // When the role changes the question list changes; keep a valid selection.
  useEffect(() => {
    if (!questions.some((q) => q.id === qid)) setQid(questions[0].id);
  }, [questions, qid]);

  const question = questions.find((q) => q.id === qid) || questions[0];
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const roleLabel = selectedJob ? `${selectedJob.title} — ${selectedJob.company}` : 'General';

  const pick = (id: string) => {
    setQid(id);
    setAnswer('');
    setChecked({});
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const readAloud = () => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(question.text);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const save = () => {
    const entry: SavedAnswer = {
      id: `ans-${Date.now()}`,
      question: question.text,
      role: roleLabel,
      answer: answer.trim(),
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...saved].slice(0, 50);
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    logActivity('mic', 'Saved an interview answer', roleLabel);
    addToast({ title: 'Answer saved' });
  };

  const remove = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <AppShell wide>
      <PageHeader
        title="Interview practice"
        description="Pick a role to get questions built from what its listing asks for. Write your answer, then check it against the STAR structure."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Questions */}
        <Card as="section" padded={false}>
          <div className="border-b border-line p-5">
            <JobPicker id="interview-job" label="Practise for" />
          </div>
          <ul aria-label="Questions" className="divide-y divide-line">
            {questions.map((q) => {
              const active = q.id === question.id;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => pick(q.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full flex-col gap-1.5 px-5 py-3.5 text-left transition-colors',
                      active ? 'bg-plum-50' : 'hover:bg-ivory'
                    )}
                  >
                    <Badge tone={q.kind === 'Skill' ? 'coral' : q.kind === 'Role' ? 'plum' : 'neutral'}>{q.kind}</Badge>
                    <span className={cn('text-sm leading-snug', active ? 'font-semibold text-plum' : 'text-ink')}>{q.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          {/* Answer */}
          <Card as="section">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-xl text-plum sm:text-2xl">{question.text}</h2>
              {canSpeak && (
                <IconButton label={speaking ? 'Stop reading' : 'Read question aloud'} onClick={readAloud}>
                  {speaking ? <Square className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
                </IconButton>
              )}
            </div>

            <label htmlFor="answer" className="mt-5 block text-sm font-medium text-ink">
              Your answer
            </label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={10}
              className="mt-1.5"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-ink-subtle">
              <span>{words} words</span>
              <span>Spoken answers usually run 150–300 words.</span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {STAR.map((s) => {
                const on = Boolean(checked[s.key]);
                return (
                  <label
                    key={s.key}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded border p-3 transition-colors',
                      on ? 'border-success/40 bg-success-100' : 'border-line bg-paper hover:border-plum-200'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setChecked((c) => ({ ...c, [s.key]: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#268566]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{s.label}</span>
                      <span className="block text-xs text-ink-muted">{s.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-subtle">Tick each part your answer covers. This is your own check — nothing is scored.</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={save} disabled={!answer.trim()}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Save answer
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setAnswer('');
                  setChecked({});
                }}
                disabled={!answer}
              >
                Clear
              </Button>
            </div>
          </Card>

          {/* Saved */}
          <Card as="section" padded={false}>
            <div className="border-b border-line px-5 py-4">
              <CardTitle>Saved answers</CardTitle>
              <p className="mt-0.5 text-xs text-ink-subtle">Stored in this browser.</p>
            </div>
            {saved.length === 0 ? (
              <EmptyState icon={<Mic className="h-6 w-6" />} title="No saved answers" className="py-8">
                Answers you save appear here so you can reread them before the interview.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {saved.map((s) => (
                  <li key={s.id} className="flex gap-2 px-5 py-4">
                    <details className="min-w-0 flex-1">
                      <summary className="cursor-pointer text-sm font-medium text-ink">{s.question}</summary>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{s.answer}</p>
                    </details>
                    <div className="flex shrink-0 items-start gap-1">
                      <span className="pt-0.5 text-xs text-ink-subtle">{timeAgo(s.savedAt)}</span>
                      <IconButton label="Delete answer" onClick={() => remove(s.id)} className="-mt-3">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
