import { clsx } from 'clsx';

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  error?: string;
}

export function Select({ value, onChange, options, placeholder, className, error }: SelectProps) {
  return (
    <div className={clsx('w-full', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full h-10 px-3 rounded-lg border border-cream-200 bg-white text-sm text-cream-900',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none',
          error && 'border-error-300 focus:ring-error-500',
          !error && 'hover:border-cream-300',
          className
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  return (
    <button
      className={clsx(
        'flex items-center justify-between w-full h-10 px-3 rounded-lg border border-cream-200 bg-white text-sm text-cream-900',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200',
        'hover:border-cream-300', className
      )}
    >
      {children}
      <svg className="h-4 w-4 ml-2 shrink-0 text-cream-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export interface SelectContentProps {
  children: React.ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  return <div className="relative">{children}</div>;
}

export interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  active?: boolean;
  onClick: () => void;
}

export function SelectItem({ children, value, active = false, onClick }: SelectItemProps) {
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        'px-3 py-2 text-sm cursor-pointer transition-colors',
        active ? 'bg-primary-50 text-primary-700' : 'text-cream-700 hover:bg-cream-50'
      )}
    >
      {children}
    </div>
  );
}

export interface SelectValueProps {
  children: React.ReactNode;
}

export function SelectValue({ children }: SelectValueProps) {
  return <span className="flex-1 text-left truncate">{children}</span>;
}
