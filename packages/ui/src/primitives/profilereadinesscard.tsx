import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';
import { Badge } from './badge';

export interface ProfileReadinessCardProps {
  readiness: number;
  status: 'incomplete' | 'partial' | 'complete';
  missingFields: string[];
  missingSkills: string[];
  readyForJobs: boolean;
  readyForApplications: boolean;
  className?: string;
}

function ReadinessBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; variant: 'default' | 'warning' | 'success'; color: string }> = {
    incomplete: { label: 'Incomplete', variant: 'default', color: 'text-neutral-500 border-neutral-300 bg-neutral-50' },
    partial: { label: 'Partial', variant: 'warning', color: 'text-amber-700 border-amber-200 bg-amber-50' },
    complete: { label: 'Complete', variant: 'success', color: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
  };
  const config = configs[status] || configs.incomplete;

  return (
    <Badge variant={config.variant} size="sm" className={clsx(config.color)}>
      {config.label}
    </Badge>
  );
}

export function ProfileReadinessCard({
  readiness,
  status,
  missingFields,
  missingSkills,
  readyForJobs,
  readyForApplications,
  className,
}: ProfileReadinessCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-cream-200 bg-white/80 backdrop-blur-sm p-4 sm:p-5',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-cream-900">Profile Readiness</h3>
        <ReadinessBadge status={status} />
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-cream-500 font-medium">Overall score</span>
          <span className="font-semibold text-cream-900">{readiness}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-cream-200 overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-700',
              readiness >= 80 ? 'bg-success-500' : readiness >= 50 ? 'bg-warning-500' : 'bg-error-500'
            )}
            style={{ width: `${readiness}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Icon name="check-circle" size={14} className="text-success-600" />
          <span className="text-cream-600">
            {readyForJobs ? 'Ready for job search' : 'Not ready for job search'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="check-circle" size={14} className="text-success-600" />
          <span className="text-cream-600">
            {readyForApplications ? 'Ready to apply' : 'Not ready to apply'}
          </span>
        </div>
      </div>

      {missingFields.length > 0 || missingSkills.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-cream-100">
          <p className="text-xs font-medium text-cream-500 mb-2">Missing</p>
          <div className="flex flex-wrap gap-1.5">
            {missingFields.map((f) => (
              <span
                key={f}
                className="rounded-md bg-error-50 px-2 py-0.5 text-xs text-error-600 border border-error-100"
              >
                {f}
              </span>
            ))}
            {missingSkills.map((s) => (
              <span
                key={s}
                className="rounded-md bg-cream-100 px-2 py-0.5 text-xs text-cream-600 border border-cream-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-cream-100 text-center text-xs text-success-600">
          All set! Your profile is ready.
        </div>
      )}
    </div>
  );
}
