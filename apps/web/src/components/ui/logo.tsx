import { cn } from '@/lib/cn';

/** The Jobora "J" mark with its coral cap and sparkle, drawn inline. */
export function LogoMark({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('h-8 w-8', className)} aria-hidden="true">
      <path
        d="M18 8 L28 5 V25 A11 11 0 0 1 6 25 V20 H14 V25 A2 2 0 0 0 18 25 Z"
        fill={tone === 'dark' ? '#3E1F38' : '#F8F5F0'}
      />
      <path d="M18 5.5 Q18 3 21 3 H26 Q28.6 3 28 5.6 L27.6 7 Q23 9.4 18 11 Z" fill="#EF6764" />
      <path d="M33 0 Q33.6 3.4 37 4 Q33.6 4.6 33 8 Q32.4 4.6 29 4 Q32.4 3.4 33 0 Z" fill="#EF6764" />
    </svg>
  );
}

export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="Jobora AI">
      <LogoMark tone={tone} />
      <span
        aria-hidden="true"
        className={cn('font-sans text-xl font-extrabold tracking-tight', tone === 'dark' ? 'text-[#2E1729]' : 'text-paper')}
      >
        Jobora
      </span>
      <span
        aria-hidden="true"
        className="rounded-md bg-[#EF6764] px-1.5 py-0.5 font-sans text-xs font-extrabold leading-none text-white"
      >
        AI
      </span>
    </span>
  );
}
