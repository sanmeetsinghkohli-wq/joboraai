import React from 'react';

export const ARROW_PATH = 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3';

export function ArrowIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ARROW_PATH} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className = 'w-4 h-4 text-[#2A1728]' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        clipRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        fillRule="evenodd"
      />
    </svg>
  );
}

/** Hand-split heading line: overflow-hidden mask + rising inner span (CSS only, see the lp block in globals.css). */
export function Line({ children, i = 0, className = '' }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <span className="lp-line block">
      <span className={`lp-line-in block ${className}`} style={{ ['--i' as string]: i }}>
        {children}
      </span>
    </span>
  );
}

export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05347] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6F2]';
export const FOCUS_DARK =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05347] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A1728]';
