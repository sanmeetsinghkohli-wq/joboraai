'use client';

import { useState } from 'react';
import { ClipboardCheck, Copy, Loader2, Sparkles } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Field, Input, Notice, Select, Textarea } from '@/components/ui/primitives';
import { useAppData } from '@/context/AppDataContext';

export interface ToolField {
  id: string;
  label: string;
  kind?: 'text' | 'textarea' | 'select';
  placeholder?: string;
  hint?: string;
  rows?: number;
  optional?: boolean;
  options?: string[];
  initial?: string;
}

/**
 * One AI tool: a few labelled inputs, the user's profile as context, and a
 * Markdown draft the user can copy. Every draft is built only from the
 * user's own details (rules live in lib/career-ops/prompts.ts).
 */
export function AiDraftTool({
  mode,
  title,
  description,
  button,
  fields,
}: {
  mode: string;
  title: string;
  description: string;
  button: string;
  fields: ToolField[];
}) {
  const { profile } = useAppData();
  const { addToast } = useToast();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, f.initial ?? (f.kind === 'select' ? f.options?.[0] ?? '' : '')]))
  );
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const ready = fields.every((f) => f.optional || values[f.id]?.trim());

  const run = async () => {
    setLoading(true);
    setError('');
    setText('');
    const input = fields
      .filter((f) => values[f.id]?.trim())
      .map((f) => `${f.label.toUpperCase()}:\n${values[f.id]}`)
      .join('\n\n');
    const res = await fetch('/api/career/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, input, profile }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.text) setText(data.text);
    else setError(data?.error?.message || 'Something went wrong. Please try again.');
    setLoading(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardTitle>{title}</CardTitle>
        <p className="mb-4 mt-1 text-sm text-ink-muted">{description}</p>
        <div className="space-y-4">
          {fields.map((f) => (
            <Field key={f.id} label={f.label} htmlFor={`${mode}-${f.id}`} hint={f.hint} optional={f.optional}>
              {f.kind === 'textarea' ? (
                <Textarea
                  id={`${mode}-${f.id}`}
                  rows={f.rows ?? 6}
                  value={values[f.id]}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                />
              ) : f.kind === 'select' ? (
                <Select
                  id={`${mode}-${f.id}`}
                  value={values[f.id]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                >
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id={`${mode}-${f.id}`}
                  value={values[f.id]}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                />
              )}
            </Field>
          ))}
        </div>
        <Button className="mt-5" disabled={loading || !ready} onClick={run}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          )}
          {button}
        </Button>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-subtle">
          <Sparkles className="h-3.5 w-3.5 text-coral" aria-hidden="true" />
          AI-generated from your profile. Review before you use it.
        </p>
      </Card>

      <div aria-live="polite">
        {loading && (
          <Card className="flex items-center gap-3 text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Working on it…
          </Card>
        )}
        {error && <Notice tone="warn">{error}</Notice>}
        {text && (
          <Card>
            <div className="mb-3 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(text);
                  addToast({ type: 'success', title: 'Copied to clipboard' });
                }}
              >
                <Copy className="h-4 w-4" aria-hidden="true" /> Copy
              </Button>
            </div>
            <Markdown text={text} />
          </Card>
        )}
      </div>
    </div>
  );
}
