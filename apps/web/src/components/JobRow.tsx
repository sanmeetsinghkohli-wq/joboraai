import { Bookmark, BookmarkCheck, MapPin } from 'lucide-react';
import type { LiveJob } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';
import { MatchMeter } from './MatchMeter';

/** Square with the company's first letter — used instead of remote logo images. */
export function CompanyInitial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded bg-plum-50 font-serif text-lg text-plum',
        className
      )}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  );
}

export function JobRow({
  job,
  selected = false,
  saved,
  hasProfileSkills,
  onSelect,
  onToggleSave,
}: {
  job: LiveJob;
  selected?: boolean;
  saved: boolean;
  hasProfileSkills: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
}) {
  const meta = [job.location, job.workMode, job.employmentType].filter(Boolean);

  return (
    <li
      className={cn(
        'group relative flex gap-3 rounded-lg border bg-paper p-4 transition-[border-color,box-shadow] duration-150',
        selected ? 'border-plum shadow-raised' : 'border-line shadow-card hover:border-plum-200'
      )}
    >
      <CompanyInitial name={job.company} />
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-snug text-ink">
          {/* The button stretches over the whole card so the entire row is one target. */}
          <button
            type="button"
            onClick={onSelect}
            aria-current={selected ? 'true' : undefined}
            className="text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-coral"
          >
            {job.title}
          </button>
        </h3>
        <p className="mt-0.5 truncate text-sm text-ink-muted">{job.company}</p>
        {meta.length > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-subtle">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{meta.join(' · ')}</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <MatchMeter
            matched={job.matchedSkills?.length ?? 0}
            total={job.skills.length}
            hasProfileSkills={hasProfileSkills}
          />
          {job.postedAt && <span className="text-xs text-ink-subtle">{job.postedAt}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleSave}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
        className={cn(
          'relative z-10 -mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded transition-colors',
          saved ? 'text-coral-700' : 'text-ink-subtle hover:bg-plum-50 hover:text-plum'
        )}
      >
        {saved ? <BookmarkCheck className="h-5 w-5" aria-hidden="true" /> : <Bookmark className="h-5 w-5" aria-hidden="true" />}
      </button>
    </li>
  );
}
