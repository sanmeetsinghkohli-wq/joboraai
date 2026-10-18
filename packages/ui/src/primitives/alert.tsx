import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface AlertProps {
  variant?: AlertVariant;
  title: string;
  children?: React.ReactNode;
  className?: string;
  icon?: IconNames;
}

export function Alert({ variant = 'info', title, children, className, icon }: AlertProps) {
  const config = {
    info: { icon: 'info' as IconNames, bg: 'bg-cream-50', border: 'border-cream-200', text: 'text-cream-700', iconColor: 'text-cream-500' },
    success: { icon: 'check-circle' as IconNames, bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', iconColor: 'text-success-500' },
    warning: { icon: 'alert-triangle' as IconNames, bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', iconColor: 'text-warning-500' },
    error: { icon: 'alert-circle' as IconNames, bg: 'bg-error-50', border: 'border-error-200', text: 'text-error-700', iconColor: 'text-error-500' },
    neutral: { icon: 'info' as IconNames, bg: 'bg-cream-50', border: 'border-cream-200', text: 'text-cream-700', iconColor: 'text-cream-500' },
  }[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4 flex gap-3',
        config.bg,
        config.border,
        className
      )}
    >
      <Icon name={icon || config.icon} size={18} className={clsx('shrink-0', config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', config.text)}>{title}</p>
        {children && <div className={clsx('mt-1 text-sm', config.text)}>{children}</div>}
      </div>
    </div>
  );
}

export interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return <div className={clsx('text-sm', className)}>{children}</div>;
}

export interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function AlertTitle({ children, className }: AlertTitleProps) {
  return <p className={clsx('text-sm font-medium', className)}>{children}</p>;
}
