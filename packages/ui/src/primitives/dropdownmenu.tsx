import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  return <div className={clsx('relative', className)}>{children}</div>;
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  as?: 'button' | 'div';
  className?: string;
}

export function DropdownMenuTrigger({ children, as: Tag = 'button', className }: DropdownMenuTriggerProps) {
  return (
    <Tag
      className={clsx(
        'inline-flex items-center justify-center rounded-md p-1.5 text-cream-500 hover:text-cream-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuContent({ children, className }: DropdownMenuContentProps) {
  return (
    <div
      className={clsx(
        'absolute right-0 top-full mt-1 min-w-[200px] rounded-xl border border-cream-200 bg-white shadow-lg',
        'animate-slide-up',
        className
      )}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  icon?: IconNames;
  divide?: boolean;
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled = false,
  icon,
  divide,
}: DropdownMenuItemProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      className={clsx(
        'flex items-center gap-2.5 px-3 py-2 text-sm text-cream-700 cursor-pointer transition-colors',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-cream-50',
        icon && 'flex items-center gap-2',
        divide && 'border-t border-cream-100 my-1',
        className
      )}
    >
      {icon && <Icon name={icon} size={16} className="text-cream-400" />}
      {children}
    </div>
  );
}

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={clsx('mx-2 mt-1 h-px bg-cream-200', className)} />;
}

export interface DropdownMenuBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function DropdownMenuBadge({ children, variant = 'default', className }: DropdownMenuBadgeProps) {
  const variantMap = {
    default: 'bg-primary-100 text-primary-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    error: 'bg-error-100 text-error-700',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
