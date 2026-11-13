'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Markdown } from '@/components/Markdown';
import { Button } from '@/components/ui/button';
import { Badge, Notice } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ label: string; href: string }>;
  usedModel?: boolean;
}

const STARTERS = [
  'Which of my saved roles fit my skills best?',
  'What skills am I missing for the roles I have saved?',
  'Which applications need a follow-up?',
  'How should I prepare for a behavioural interview?',
];

export default function CopilotPage() {
  const { profile, jobs, savedJobIds, applications, logActivity } = useAppData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || sending) return;
    setError(null);
    setInput('');
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', content: prompt }]);
    setSending(true);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          context: { profile, jobs: jobs.slice(0, 15), savedJobIds, applications },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.reply) {
        setError(data?.error?.message || 'Copilot could not answer just now. Please try again.');
        setInput(prompt);
        return;
      }
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          actions: Array.isArray(data.suggestedActions) ? data.suggestedActions : [],
          usedModel: data.providerMode === 'groq_ai',
        },
      ]);
      logActivity('sparkles', 'Asked Copilot', prompt.slice(0, 60));
    } catch {
      setError('We could not reach Copilot. Check your connection and try again.');
      setInput(prompt);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col">
        <header className="mb-4">
          <h1 className="font-serif text-2xl text-plum sm:text-3xl">Copilot</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Ask about your search. Copilot sees your profile, tracked applications and the roles currently loaded. It never
            applies or sends anything for you.
          </p>
        </header>

        <div className="flex-1 space-y-5 pb-4" aria-live="polite">
          {messages.length === 0 && (
            <div className="rounded-xl border border-line bg-paper p-6 shadow-card sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-plum text-coral">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-serif text-xl text-plum">What would you like to know?</h2>
              <p className="mt-1 text-sm text-ink-muted">Try one of these, or ask your own question.</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => send(s)}
                      className="h-full w-full rounded border border-line bg-ivory px-4 py-3 text-left text-sm text-ink transition-colors hover:border-plum-200 hover:bg-plum-50"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-line rounded-xl rounded-br-sm bg-plum px-4 py-3 text-sm text-paper">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum text-coral"
                >
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border border-line bg-paper px-4 py-3 shadow-card">
                  <Markdown text={m.content} />
                  {(m.actions?.length || 0) > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                      {m.actions!.map((a) => (
                        <Link
                          key={a.href + a.label}
                          href={a.href}
                          className="inline-flex h-9 items-center rounded border border-line bg-ivory px-3 text-sm font-medium text-plum hover:border-plum-200"
                        >
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {!m.usedModel && (
                    <p className="mt-2 text-xs text-ink-subtle">Answered from your saved data without a language model.</p>
                  )}
                </div>
              </div>
            )
          )}

          {sending && (
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-plum text-coral" aria-hidden="true">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </span>
              Thinking…
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-4 mt-2 rounded-xl border border-line bg-paper p-2 shadow-raised"
        >
          <label htmlFor="copilot-input" className="sr-only">
            Message Copilot
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="copilot-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={2000}
              placeholder="Ask about your search"
              className="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <Button type="submit" size="md" aria-label="Send" disabled={!input.trim()} loading={sending} className="w-11 px-0">
              {!sending && <ArrowUp className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </div>
          <div className="flex items-center justify-between px-3 pb-1 pt-1">
            <span className="text-xs text-ink-subtle">Enter to send · Shift+Enter for a new line</span>
            {profile.skills.length === 0 && (
              <Badge tone="warn" className={cn('hidden sm:inline-flex')}>
                Add skills for better answers
              </Badge>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
