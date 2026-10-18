import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';
import { Badge } from './badge';

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  workMode: string;
  posted: string;
  match?: number;
  isSaved: boolean;
  isMock: boolean;
  onSave: () => void;
  onDetails: () => void;
  className?: string;
}

export function JobCard({
  title,
  company,
  location,
  workMode,
  posted,
  match,
  isSaved,
  isMock,
  onSave,
  onDetails,
  className,
}: JobCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-cream-200 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:shadow-cream-900/5 hover:border-cream-300',
        'cursor-pointer',
        className
      )}
      onClick={onDetails}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-cream-900 truncate">{title}</h3>
            <p className="text-sm text-cream-500 mt-0.5">{company}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="text-cream-400 hover:text-cream-600 transition-colors p-1 rounded-md hover:bg-cream-100"
            aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
          >
            <Icon name={isSaved ? 'bookmark-filled' : 'bookmark' as IconNames} size={18} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="default" size="sm">
            {location}
          </Badge>
          <Badge
            variant={workMode === 'remote' ? 'success' : workMode === 'hybrid' ? 'warning' : 'neutral'}
            size="sm"
          >
            {workMode}
          </Badge>
          <span className="text-xs text-cream-400">{posted}</span>
          {isMock && <Badge variant="outline" size="sm" className="text-cream-500 border-cream-300">Mock data</Badge>}
        </div>

        {match !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-cream-500 font-medium">Match</span>
              <span className="font-semibold text-cream-900">{match}%</span>
            </div>
            <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                style={{ width: `${match}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-4 pb-4 sm:px-5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Details
        </button>
      </div>
    </div>
  );
}
