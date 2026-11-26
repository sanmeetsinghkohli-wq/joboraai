import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { trNode } from '@/lib/i18n';

/* ── Card ─────────────────────────────────────────────────────────────── */

export function Card({
  className,
  padded = true,
  as: Tag = 'div',
  ...rest
}: React.HTMLAttributes<HTMLElement> & { padded?: boolean; as?: 'div' | 'section' | 'article' | 'aside' | 'li' }) {
  return (
    <Tag
      className={cn('rounded-lg border border-line bg-paper shadow-card', padded && 'p-5 sm:p-6', className)}
      {...rest}
    />
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn('font-serif text-xl text-plum', className)}>{trNode(children)}</h2>;
}

/* ── Badge ────────────────────────────────────────────────────────────── */

type Tone = 'neutral' | 'plum' | 'coral' | 'success' | 'warn' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-sand text-ink-muted border-line',
  plum: 'bg-plum-50 text-plum border-plum-100',
  coral: 'bg-coral-50 text-coral-700 border-coral-100',
  success: 'bg-success-100 text-success-700 border-success/20',
  warn: 'bg-warn-100 text-warn border-warn/20',
  muted: 'bg-paper text-ink-subtle border-line',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ── Form fields ──────────────────────────────────────────────────────── */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-subtle">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('control h-11', className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('control min-h-[7rem] resize-y leading-relaxed', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('control h-11 pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

/* ── Segmented tabs ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('scrollbar-none inline-flex max-w-full gap-1 overflow-x-auto rounded bg-sand p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm px-3 text-sm font-medium transition-colors duration-150',
              active ? 'bg-paper text-plum shadow-card' : 'text-ink-muted hover:text-plum'
            )}
          >
            {opt.label}
            {typeof opt.count === 'number' && (
              <span className={cn('text-xs tabular-nums', active ? 'text-coral-700' : 'text-ink-subtle')}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Feedback ─────────────────────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded bg-[linear-gradient(90deg,rgb(var(--c-sand))_25%,rgb(var(--c-ivory))_50%,rgb(var(--c-sand))_75%)] bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-coral-50 text-coral-700">
        {icon}
      </div>
      <h3 className="font-serif text-xl text-plum">{trNode(title)}</h3>
      {children && <p className="mt-1.5 max-w-md text-sm text-ink-muted">{trNode(children)}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

type NoticeTone = 'info' | 'success' | 'warn' | 'error';

const noticeStyles: Record<NoticeTone, { box: string; Icon: typeof Info }> = {
  info: { box: 'border-plum-100 bg-plum-50 text-plum', Icon: Info },
  success: { box: 'border-success/20 bg-success-100 text-success-700', Icon: CircleCheck },
  warn: { box: 'border-warn/20 bg-warn-100 text-warn', Icon: TriangleAlert },
  error: { box: 'border-danger/20 bg-danger-100 text-danger', Icon: CircleAlert },
};

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: NoticeTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { box, Icon } = noticeStyles[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded border px-4 py-3 text-sm', box, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5', 'text-ink-muted')}>{children}</div>
      </div>
    </div>
  );
}

/* ── Page furniture ───────────────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{trNode(eyebrow)}</p>}
        <h1 className="font-serif text-2xl text-plum sm:text-3xl">{trNode(title)}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{trNode(description)}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="mt-1 font-serif text-3xl tabular-nums text-plum">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
      </div>
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-plum-50 text-plum">
          {icon}
        </div>
      )}
    </Card>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-sm border border-line bg-ivory px-2 py-0.5 text-xs text-ink-muted',
        className
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
