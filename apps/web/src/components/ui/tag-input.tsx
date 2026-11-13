'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Text input that turns entries into removable tags.
 * Enter or comma adds a tag; Backspace on an empty field removes the last one.
 */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  describedBy,
  className,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  describedBy?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const incoming = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (incoming.length === 0) return;
    const lower = new Set(value.map((v) => v.toLowerCase()));
    const next = [...value];
    for (const item of incoming) {
      if (!lower.has(item.toLowerCase())) {
        lower.add(item.toLowerCase());
        next.push(item);
      }
    }
    onChange(next);
    setDraft('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded border border-line bg-paper px-2 py-1.5 transition-colors focus-within:border-plum focus-within:ring-2 focus-within:ring-coral/30 hover:border-plum-200',
        className
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-sm bg-plum-50 py-0.5 pl-2 pr-0.5 text-sm text-plum"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== tag))}
            aria-label={`Remove ${tag}`}
            className="flex h-6 w-6 items-center justify-center rounded-sm text-plum/60 hover:bg-plum-100 hover:text-plum"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (text.includes(',')) {
            e.preventDefault();
            commit(text);
          }
        }}
        placeholder={value.length === 0 ? placeholder : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        className="h-8 min-w-[8rem] flex-1 bg-transparent px-1.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
      />
    </div>
  );
}
