'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, FileText, Search, Send } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { normalizeStatus } from '@/lib/status';

interface Result {
  key: string;
  group: 'Pages' | 'Your applications' | 'Jobs';
  label: string;
  detail?: string;
  href: string;
}

const PAGES: Array<{ label: string; href: string; words: string }> = [
  { label: 'Home', href: '/dashboard', words: 'dashboard overview' },
  { label: 'My profile', href: '/profile', words: 'cv upload skills education experience projects certifications' },
  { label: 'Jobs', href: '/jobs', words: 'search roles internships' },
  { label: 'Applications', href: '/applications', words: 'tracker board pipeline' },
  { label: 'Outbox', href: '/outbox', words: 'email gmail send approve' },
  { label: 'Email composer', href: '/email-composer', words: 'write email follow-up' },
  { label: 'CV', href: '/cv-studio', words: 'resume builder pdf word' },
  { label: 'Resume Studio', href: '/resume-studio', words: 'tailor compare versions docx' },
  { label: 'Cover letters', href: '/cover-letters', words: 'letter' },
  { label: 'Other documents', href: '/document-studio', words: 'statement of purpose bio thank you resignation' },
  { label: 'Career Ops', href: '/career-ops', words: 'fit report ats triage outreach offers strategy' },
  { label: 'Interview practice', href: '/interview', words: 'mock questions voice timer star' },
  { label: 'Learning roadmap', href: '/career-growth', words: 'skills plan courses' },
  { label: 'Skill gaps', href: '/career-insights', words: 'missing skills demand' },
  { label: 'Analytics', href: '/analytics', words: 'stats rates progress' },
  { label: 'LinkedIn optimiser', href: '/linkedin', words: 'headline about profile' },
  { label: 'Copilot', href: '/ai-copilot', words: 'ai chat assistant coach' },
  { label: 'Notifications', href: '/notifications', words: 'reminders activity' },
  { label: 'Account settings', href: '/settings', words: 'gmail delete export logout theme' },
];

const ICON = { Pages: FileText, 'Your applications': Send, Jobs: Briefcase } as const;

/** One search for pages, tracked applications and live jobs. Ctrl/Cmd+K focuses it. */
export function GlobalSearch() {
  const router = useRouter();
  const { applications, jobs, setSelectedJob } = useAppData();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const has = (...fields: Array<string | undefined>) => fields.some((f) => f?.toLowerCase().includes(term));
    const pages: Result[] = PAGES.filter((p) => has(p.label, p.words))
      .slice(0, 4)
      .map((p) => ({ key: `p-${p.href}`, group: 'Pages', label: p.label, href: p.href }));
    const apps: Result[] = applications
      .filter((a) => has(a.title, a.company, a.location))
      .slice(0, 4)
      .map((a) => ({
        key: `a-${a.id}`,
        group: 'Your applications',
        label: `${a.title} at ${a.company}`,
        detail: normalizeStatus(a.status),
        href: `/applications/${a.id}`,
      }));
    const jobHits: Result[] = jobs
      .filter((j) => has(j.title, j.company, j.location, ...(j.skills || [])))
      .slice(0, 5)
      .map((j) => ({ key: `j-${j.id}`, group: 'Jobs', label: `${j.title} at ${j.company}`, detail: j.location, href: `/jobs?selected=${encodeURIComponent(j.id)}` }));
    return [
      ...pages,
      ...apps,
      ...jobHits,
      { key: 'all-jobs', group: 'Jobs', label: `Search all jobs for “${q.trim()}”`, href: `/jobs?q=${encodeURIComponent(q.trim())}` },
    ];
  }, [q, applications, jobs]);

  useEffect(() => setActive(0), [q]);

  const go = (r: Result) => {
    if (r.key.startsWith('j-')) {
      const job = jobs.find((j) => `j-${j.id}` === r.key);
      if (job) setSelectedJob(job);
    }
    setOpen(false);
    setQ('');
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let lastGroup = '';
  return (
    <div ref={boxRef} className="relative min-w-0 flex-1 sm:max-w-md" role="search">
      <label htmlFor="global-search" className="sr-only">
        Search Jobora
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search jobs, applications, tools…"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="global-search-results"
        aria-activedescendant={open && results[active] ? `gs-${results[active].key}` : undefined}
        className="control h-10 pl-9 pr-14"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-ink-subtle sm:block">
        Ctrl K
      </kbd>
      {open && results.length > 0 && (
        <ul
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-paper p-1.5 shadow-raised"
        >
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            const Icon = ICON[r.group];
            return (
              <li key={r.key} role="presentation">
                {header && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">{header}</p>}
                <button
                  id={`gs-${r.key}`}
                  role="option"
                  aria-selected={i === active}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn('flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm', i === active ? 'bg-sand text-plum' : 'text-ink')}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{r.label}</span>
                  {r.detail && <span className="shrink-0 text-xs text-ink-subtle">{r.detail}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
