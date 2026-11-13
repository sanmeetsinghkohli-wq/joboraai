'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, PenLine, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { JobPicker } from '@/components/JobPicker';
import { useToast } from '@/components/providers';
import { Button, IconButton } from '@/components/ui/button';
import { Card, CardTitle, EmptyState, Notice, PageHeader, Textarea } from '@/components/ui/primitives';
import { useAppData, type LiveJob, type LiveUserProfile } from '@/context/AppDataContext';
import { downloadFile, slug, timeAgo } from '@/lib/format';

interface LetterDraft {
  id: string;
  jobId: string;
  name: string;
  content: string;
  updatedAt: string;
}

const STORAGE_KEY = 'jobora_cover_letter_drafts';

function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * A starting draft assembled only from the user's profile and the role's own
 * details. It states nothing the user has not entered.
 */
function buildDraft(profile: LiveUserProfile, job: LiveJob | null): string {
  const name = profile.fullName || '';
  const today = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const header = [name, [profile.location, profile.email, profile.phone].filter(Boolean).join(' · ')].filter(Boolean);

  const company = job?.company || '[Company]';
  const role = job?.title || profile.targetRole || '[Role]';
  const matched = (job?.matchedSkills || []).slice(0, 4);

  const opening = `I am writing to apply for the ${role} position at ${company}.`;
  const skillsLine =
    matched.length > 0
      ? ` The role asks for ${list(matched)}, which I work with and would bring to your team.`
      : profile.skills.length > 0
      ? ` My background includes ${list(profile.skills.slice(0, 4))}.`
      : '';

  const body = profile.summary
    ? profile.summary
    : '[Add two or three sentences about your most relevant experience and what you achieved.]';

  const closing = `I would welcome the chance to talk about how I could contribute to ${company}. Thank you for your time and consideration.`;

  return [
    ...header,
    '',
    today,
    '',
    `Dear Hiring Team at ${company},`,
    '',
    `${opening}${skillsLine}`,
    '',
    body,
    '',
    closing,
    '',
    'Sincerely,',
    name || '[Your name]',
  ].join('\n');
}

export default function CoverLettersPage() {
  const { profile, selectedJob, logActivity } = useAppData();
  const { addToast } = useToast();

  const [drafts, setDrafts] = useState<LetterDraft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) setDrafts(stored.filter((d) => d && typeof d.content === 'string'));
    } catch {
      /* no saved drafts */
    }
  }, []);

  const persist = (next: LetterDraft[]) => {
    setDrafts(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      addToast({ type: 'error', title: 'Could not save to this browser', description: 'Storage may be full or disabled.' });
    }
  };

  const generated = useMemo(() => buildDraft(profile, selectedJob), [profile, selectedJob]);

  // Follow the selected role until the user starts editing or opens a saved draft.
  useEffect(() => {
    if (!activeId && !touched) setText(generated);
  }, [generated, activeId, touched]);

  const placeholders = (text.match(/\[[^\]]+\]/g) || []).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const draftName = selectedJob ? `${selectedJob.company} — ${selectedJob.title}` : profile.targetRole || 'General letter';

  const save = () => {
    const now = new Date().toISOString();
    if (activeId) {
      persist(drafts.map((d) => (d.id === activeId ? { ...d, content: text, updatedAt: now } : d)));
    } else {
      const draft: LetterDraft = {
        id: `cl-${Date.now()}`,
        jobId: selectedJob?.id || '',
        name: draftName,
        content: text,
        updatedAt: now,
      };
      persist([draft, ...drafts]);
      setActiveId(draft.id);
      logActivity('pen', 'Saved a cover letter', draft.name);
    }
    setTouched(false);
    addToast({ title: 'Draft saved' });
  };

  const open = (draft: LetterDraft) => {
    setActiveId(draft.id);
    setText(draft.content);
    setTouched(false);
  };

  const startNew = () => {
    setActiveId(null);
    setTouched(false);
    setText(generated);
  };

  const remove = (draft: LetterDraft) => {
    persist(drafts.filter((d) => d.id !== draft.id));
    if (activeId === draft.id) startNew();
    addToast({ title: 'Draft deleted', description: draft.name });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ title: 'Copied to clipboard' });
    } catch {
      addToast({ type: 'error', title: 'Could not copy', description: 'Select the text and copy it manually.' });
    }
  };

  const active = drafts.find((d) => d.id === activeId) || null;

  return (
    <AppShell>
      <div className="no-print">
        <PageHeader
          title="Cover letters"
          description="Start from a draft built from your profile and the role, then make it yours. Nothing is added that you did not enter."
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Card as="section" className="no-print">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <JobPicker id="letter-job" label="Write for" className="flex-1" />
              <Button
                variant="secondary"
                onClick={startNew}
                disabled={!activeId && !touched}
                title="Discard edits and rebuild the draft from your profile"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset draft
              </Button>
            </div>
            {!profile.summary && (
              <Notice tone="info" className="mt-4">
                Your profile has no summary, so the middle paragraph is a placeholder.{' '}
                <Link href="/settings" className="font-semibold text-plum underline underline-offset-4">
                  Add a summary
                </Link>{' '}
                to fill it automatically.
              </Notice>
            )}
          </Card>

          <Card as="section" padded={false} className="print-sheet overflow-hidden">
            <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
              <p className="min-w-0 truncate text-sm font-medium text-ink">
                {active ? active.name : `New draft · ${draftName}`}
              </p>
              <p className="text-xs tabular-nums text-ink-subtle">{words} words</p>
            </div>
            <label htmlFor="letter-text" className="sr-only">
              Cover letter text
            </label>
            <Textarea
              id="letter-text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setTouched(true);
              }}
              rows={22}
              className="no-print rounded-none border-0 px-5 py-5 font-serif text-base leading-relaxed focus:ring-0 sm:px-8"
            />
            {/* Printed version: plain text, no form chrome. */}
            <div className="hidden whitespace-pre-line p-0 font-serif text-base leading-relaxed text-ink print:block">{text}</div>
          </Card>

          {placeholders > 0 && (
            <Notice tone="warn" className="no-print">
              {placeholders} placeholder{placeholders === 1 ? '' : 's'} in [square brackets] still need{placeholders === 1 ? 's' : ''} replacing
              before you send this.
            </Notice>
          )}

          <div className="no-print flex flex-wrap gap-2">
            <Button onClick={save} disabled={!text.trim()}>
              {active ? 'Save changes' : 'Save draft'}
            </Button>
            <Button variant="secondary" onClick={copy}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadFile(`Cover_Letter_${slug(draftName)}.txt`, text, 'text/plain;charset=utf-8')}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Plain text
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print or save PDF
            </Button>
          </div>
        </div>

        <Card as="aside" padded={false} className="no-print" aria-label="Saved drafts">
          <div className="border-b border-line px-5 py-4">
            <CardTitle>Saved drafts</CardTitle>
            <p className="mt-0.5 text-xs text-ink-subtle">Stored in this browser.</p>
          </div>
          {drafts.length === 0 ? (
            <EmptyState icon={<PenLine className="h-6 w-6" />} title="No drafts yet" className="py-8">
              Save a letter to keep it here and reuse it later.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center gap-1 pr-2">
                  <button
                    type="button"
                    onClick={() => open(d)}
                    aria-current={d.id === activeId ? 'true' : undefined}
                    className={`min-w-0 flex-1 px-5 py-3 text-left transition-colors hover:bg-ivory ${
                      d.id === activeId ? 'bg-plum-50' : ''
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                    <p className="text-xs text-ink-subtle">Edited {timeAgo(d.updatedAt)}</p>
                  </button>
                  <IconButton label={`Delete draft ${d.name}`} onClick={() => remove(d)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
