import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface EmptyStateProps {
  icon?: IconNames;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon = 'inbox', title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className
      )}
    >
      <div className="flex-shrink-0 rounded-full bg-cream-100 p-4 mb-3">
        <Icon name={icon} size={28} className="text-cream-400" />
      </div>
      <h3 className="text-base font-semibold text-cream-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-cream-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface EmptyStateIconProps {
  icon: IconNames;
  className?: string;
}

export function EmptyStateIcon({ icon, className }: EmptyStateIconProps) {
  return (
    <div className={clsx('flex-shrink-0 rounded-full bg-cream-100 p-3', className)}>
      <Icon name={icon} size={24} className="text-cream-400" />
    </div>
  );
}

export interface EmptyStateTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function EmptyStateTitle({ children, className }: EmptyStateTitleProps) {
  return <h3 className={clsx('text-base font-semibold text-cream-900', className)}>{children}</h3>;
}

export interface EmptyStateDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function EmptyStateDescription({ children, className }: EmptyStateDescriptionProps) {
  return <p className={clsx('mt-1 max-w-md text-sm text-cream-500', className)}>{children}</p>;
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className
      )}
    >
      <div className="flex-shrink-0 rounded-full bg-error-50 p-4 mb-3">
        <Icon name="alert-circle" size={28} className="text-error-600" />
      </div>
      <h3 className="text-base font-semibold text-cream-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-cream-500">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export interface LoadingStateProps {
  description?: string;
  className?: string;
}

export function LoadingState({ description = 'Loading...', className }: LoadingStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className
      )}
    >
      <div className="flex-shrink-0 rounded-full bg-cream-100 p-4 mb-3">
        <div className="h-10 w-10 rounded-full border-3 border-cream-200 border-t-primary-600 animate-spin" />
      </div>
      <p className="text-sm text-cream-500">{description}</p>
    </div>
  );
}
