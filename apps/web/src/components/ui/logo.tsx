import { cn } from '@/lib/cn';

/** Inline mark so the logo never depends on a remote image. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id="jobora-mark" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E76F72" />
          <stop offset="1" stopColor="#351B32" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#jobora-mark)" />
      <path
        d="M19.5 9v9.2a4.3 4.3 0 0 1-8.3 1.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="9" r="1.9" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span
        className={cn('font-serif text-xl font-semibold tracking-tight', tone === 'dark' ? 'text-plum' : 'text-paper')}
      >
        Jobora
      </span>
    </span>
  );
}
