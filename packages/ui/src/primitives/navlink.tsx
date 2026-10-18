import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface NavLinkProps {
  label: string;
  href: string;
  icon: IconNames;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function NavLink({ label, href, icon, active = false, badge, onClick, disabled = false, className }: NavLinkProps) {
  return (
    <a
      href={disabled ? '#' : href}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      aria-disabled={disabled}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm',
        active
          ? 'bg-primary-50 text-primary-700 font-medium'
          : 'text-cream-600 hover:bg-cream-50 hover:text-cream-900',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          active ? 'bg-primary-100 text-primary-600' : 'bg-cream-100 text-cream-400'
        )}
      >
        <Icon name={icon} size={18} />
      </div>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-error-500 text-white text-xs font-semibold">
          {badge}
        </span>
      )}
    </a>
  );
}
