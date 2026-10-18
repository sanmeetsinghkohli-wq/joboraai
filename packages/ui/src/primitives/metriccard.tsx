import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface MetricCardProps {
  label: string;
  value: string;
  icon?: IconNames;
  delay?: number;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function MetricCard({ label, value, icon, trend, trendUp = true, delay = 0, className }: MetricCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-cream-200 bg-white/80 backdrop-blur-sm p-4 sm:p-5',
        `animation-delay-${delay}ms`,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-cream-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-cream-900">{value}</p>
          {trend && (
            <p className={clsx('mt-2 text-xs font-medium', trendUp ? 'text-success-600' : 'text-error-600')}>
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-cream-50 p-2.5">
            <Icon name={icon} size={18} className="text-cream-500" />
          </div>
        )}
      </div>
    </div>
  );
}
