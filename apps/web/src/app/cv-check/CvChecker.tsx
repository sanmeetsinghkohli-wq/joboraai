'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Result {
  score: number;
  grade: string;
  issues: Array<{ id: string; severity: string; message: string }>;
  keywordCoverage: { found: number; total: number; missing: string[] } | null;
}

const box = 'rounded-2xl border border-[#E7DDD5] bg-white p-5 sm:p-6';
const label = 'mb-1.5 block text-sm font-semibold text-[#2A1728]';
const control =
  'w-full rounded-xl border border-[#E7DDD5] bg-white px-3.5 py-2.5 text-sm text-[#2A1728] focus:border-[#4A2350] focus:outline-none focus:ring-2 focus:ring-[#4A2350]/20';

/** Counts a click on the sign-up button. Fire-and-forget; never blocks navigation. */
function countCtaClick() {
  try {
    navigator.sendBeacon?.('/api/public/event', new Blob([JSON.stringify({ name: 'cv_check_cta' })], { type: 'application/json' }));
  } catch {
    /* counting is best-effort */
  }
}

/** "cv-check", or "cv-check-uowd" when the page was opened from a tagged link such as ?from=uowd. */
function signupSource(): string {
  if (typeof window === 'undefined') return 'cv-check';
  const tag = (new URLSearchParams(window.location.search).get('from') || '').replace(/[^a-z0-9-]/gi, '').slice(0, 25);
  return tag ? `cv-check-${tag}` : 'cv-check';
}

export function CvChecker() {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (mode === 'upload' && !file) return setError('Choose your CV file first.');
    if (mode === 'paste' && text.trim().length < 80) return setError('Paste your whole CV, including the section headings.');
    setLoading(true);
    try {
      let res: Response;
      if (mode === 'upload' && file) {
        const form = new FormData();
        form.append('file', file);
        form.append('keywords', keywords);
        res = await fetch('/api/public/cv-check', { method: 'POST', body: form });
      } else {
        res = await fetch('/api/public/cv-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, keywords }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data?.error?.message || 'The check could not run. Please try again.');
      else {
        setResult(data);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    } catch {
      setError('The check could not run. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const ring = (s: number) => (s >= 80 ? 'border-[#2F855A]' : s >= 60 ? 'border-[#E05347]' : 'border-[#B42318]');

  return (
    <div className="space-y-5">
      <form onSubmit={run} className={box} aria-describedby="cv-privacy">
        <div role="group" aria-label="How to add your CV" className="mb-5 inline-flex rounded-full bg-[#F3ECE6] p-1">
          {(['upload', 'paste'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn('h-9 rounded-full px-4 text-sm font-semibold', mode === m ? 'bg-white text-[#4A2350] shadow-sm' : 'text-[#63555F]')}
            >
              {m === 'upload' ? 'Upload a file' : 'Paste text'}
            </button>
          ))}
        </div>

        {mode === 'upload' ? (
          <div>
            <p className={label}>Your CV (PDF, Word or TXT, up to 5 MB)</p>
            <label
              htmlFor="cv-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E7DDD5] px-4 py-8 text-center focus-within:border-[#4A2350] hover:border-[#4A2350]"
            >
              <FileUp className="h-6 w-6 text-[#4A2350]" aria-hidden="true" />
              <span className="text-sm font-medium text-[#2A1728]">{file ? file.name : 'Choose a file'}</span>
              <span className="text-xs text-[#63555F]">Export from Word or Google Docs for the best result</span>
              <input
                id="cv-file"
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        ) : (
          <div>
            <label htmlFor="cv-text" className={label}>
              Your CV text
            </label>
            <textarea
              id="cv-text"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={control}
              placeholder="Paste everything, with each heading (EXPERIENCE, EDUCATION…) on its own line"
            />
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="cv-keywords" className={label}>
            Keywords from a job you want <span className="font-normal text-[#63555F]">(optional)</span>
          </label>
          <input
            id="cv-keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className={control}
            placeholder="e.g. python, sql, power bi"
          />
          <p className="mt-1 text-xs text-[#63555F]">Comma separated. We show which ones your CV already covers.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#4A2350] px-6 text-sm font-semibold text-white hover:bg-[#3B1B40] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? 'Checking…' : 'Check my CV'}
        </button>
        <p id="cv-privacy" className="mt-3 text-xs text-[#63555F]">
          Free, no sign-up. Your CV is read in memory and never stored.
        </p>
      </form>

      <div ref={resultRef} aria-live="polite" className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-[#F3C9C4] bg-[#FDF1EF] px-4 py-3 text-sm text-[#8A2A20]">
            {error}
          </p>
        )}
        {result && (
          <>
            <div className={cn(box, 'flex items-center gap-6')}>
              <div className={cn('flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-8', ring(result.score))}>
                <span className="font-serif text-3xl text-[#4A2350]">{result.score}</span>
                <span className="text-xs text-[#63555F]">/ 100</span>
              </div>
              <div>
                <p className="text-sm text-[#63555F]">Grade</p>
                <p className="font-serif text-3xl text-[#4A2350]">{result.grade}</p>
                <p className="mt-1 text-sm text-[#63555F]">
                  {result.issues.length === 0
                    ? 'Hiring software should read this CV without trouble.'
                    : `${result.issues.length} thing${result.issues.length > 1 ? 's' : ''} to fix.`}
                </p>
              </div>
            </div>

            {result.keywordCoverage && (
              <div className={box}>
                <h2 className="font-serif text-xl text-[#4A2350]">
                  Keywords: {result.keywordCoverage.found} of {result.keywordCoverage.total} found
                </h2>
                {result.keywordCoverage.missing.length > 0 && (
                  <>
                    <p className="mt-2 text-sm text-[#63555F]">Missing. Add only the ones you can honestly claim:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.keywordCoverage.missing.map((k) => (
                        <span key={k} className="rounded-full bg-[#F3ECE6] px-3 py-1 text-xs font-medium text-[#4A2350]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {result.issues.length > 0 ? (
              <div className={box}>
                <h2 className="font-serif text-xl text-[#4A2350]">What to fix</h2>
                <ul className="mt-3 space-y-3">
                  {result.issues.map((i) => (
                    <li key={i.id} className="flex gap-3 text-sm">
                      <AlertTriangle
                        className={cn('mt-0.5 h-4 w-4 shrink-0', i.severity === 'critical' ? 'text-[#B42318]' : 'text-[#B54708]')}
                        aria-hidden="true"
                      />
                      <span>{i.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-[#2F855A]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> No formatting problems found.
              </p>
            )}

            <div className="rounded-2xl bg-[#4A2350] p-6 text-white">
              <h2 className="font-serif text-2xl">Fix it and find jobs that fit</h2>
              <p className="mt-2 text-sm text-white/80">
                Jobora turns your CV into a clean profile, tailors it to each job, matches you with live roles across the UAE,
                GCC and India, and tracks every application. Free.
              </p>
              <Link
                href={`/auth?tab=signup&from=${encodeURIComponent(signupSource())}`}
                onClick={countCtaClick}
                className="mt-4 inline-flex h-11 items-center rounded-full bg-[#E05347] px-6 text-sm font-semibold text-white hover:bg-[#C9443A]"
              >
                Create my free account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
