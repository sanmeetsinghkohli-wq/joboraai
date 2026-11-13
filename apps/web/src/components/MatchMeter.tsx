import { cn } from '@/lib/cn';

/**
 * Shows how many of a job's listed skills are on the profile.
 * Renders an explanation instead of a number when no honest score exists.
 */
export function MatchMeter({
  matched,
  total,
  hasProfileSkills,
  size = 'sm',
  className,
}: {
  matched: number;
  total: number;
  hasProfileSkills: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  if (total === 0) {
    return <span className={cn('text-xs text-ink-subtle', className)}>No skills listed</span>;
  }
  if (!hasProfileSkills) {
    return <span className={cn('text-xs text-ink-subtle', className)}>Add skills to compare</span>;
  }

  const pct = Math.round((matched / total) * 100);
  const tone = pct >= 60 ? 'bg-success' : pct >= 30 ? 'bg-coral' : 'bg-plum-200';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('overflow-hidden rounded-full bg-sand', size === 'lg' ? 'h-2 w-28' : 'h-1.5 w-14')}
        role="img"
        aria-label={`${matched} of ${total} listed skills match your profile`}
      >
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('tabular-nums text-ink-muted', size === 'lg' ? 'text-sm font-medium' : 'text-xs')}>
        {matched}/{total} skills
      </span>
    </div>
  );
}
