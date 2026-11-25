'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export const DOCUMENT_TABS = [
  { href: '/cv-studio', label: 'CV' },
  { href: '/resume-studio', label: 'Resume Studio' },
  { href: '/cover-letters', label: 'Cover letters' },
  { href: '/document-studio', label: 'Other documents' },
];

export const GROWTH_TABS = [
  { href: '/career-growth', label: 'Learning roadmap' },
  { href: '/career-insights', label: 'Skill gaps in live jobs' },
];

/** Tabs that join pages sharing one sidebar entry. */
export function SubNav({ items, label }: { items: Array<{ href: string; label: string }>; label: string }) {
  const pathname = usePathname() || '';
  return (
    <nav aria-label={label} className="scrollbar-none -mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-line px-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'border-plum text-plum' : 'border-transparent text-ink-muted hover:text-plum'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
