import { clsx } from 'clsx';

export interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  inverse?: boolean; // for dark backgrounds
  label?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, inverse = false, label, showLabel = true }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && <div className="flex justify-between text-xs mb-1">
        <span className={clsx('font-medium', !inverse && 'text-cream-700', inverse && 'text-cream-100')}>
          {label || 'Progress'}
        </span>
        <span className={clsx('font-medium', !inverse && 'text-cream-700', inverse && 'text-cream-100')}>
          {clampedValue}%
        </span>
      </div>}
      <div
        className={clsx(
          'h-2 rounded-full overflow-hidden',
          inverse ? 'bg-cream-100' : 'bg-cream-200'
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-700',
            clampedValue >= 80 ? 'bg-gradient-to-r from-success-400 to-success-500' :
            clampedValue >= 50 ? 'bg-gradient-to-r from-warning-400 to-warning-500' :
            'bg-gradient-to-r from-error-400 to-error-500'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
