import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface StatCardProps {
  label: string;
  value: string;
  icon?: IconNames;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  className?: string;
}

export function StatCard({ label, value, icon, trend, trendUp = true, delay = 0, className }: StatCardProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border border-cream-200 bg-white/80 backdrop-blur-sm p-4 sm:p-5',
        'animate-fade-in',
        `animation-delay-${delay}ms`,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-cream-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-cream-900">{value}</p>
          {trend && (
            <p
              className={clsx(
                'mt-2 text-xs font-medium',
                trendUp ? 'text-success-600' : 'text-error-600'
              )}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary-50 p-3">
            <Icon name={icon} size={20} className="text-primary-600" />
          </div>
        )}
      </div>
    </div>
  );
}

export interface StatLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function StatLabel({ children, className }: StatLabelProps) {
  return <p className={clsx('text-xs font-medium text-cream-500 uppercase tracking-wider', className)}>{children}</p>;
}

export interface StatValueProps {
  children: React.ReactNode;
  className?: string;
}

export function StatValue({ children, className }: StatValueProps) {
  return <p className={clsx('text-xl sm:text-2xl font-bold text-cream-900', className)}>{children}</p>;
}

export interface StatChangeProps {
  children: React.ReactNode;
  trendUp?: boolean;
  className?: string;
}

export function StatChange({ children, trendUp = true, className }: StatChangeProps) {
  return (
    <p className={clsx('text-xs font-medium', trendUp ? 'text-success-600' : 'text-error-600', className)}>
      {children}
    </p>
  );
}
