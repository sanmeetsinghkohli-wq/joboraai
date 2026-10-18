import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  options: { value: string; label: string; description?: string }[];
  className?: string;
  error?: string;
}

export function RadioGroup({
  value,
  onChange,
  label,
  options,
  className,
  error,
}: RadioGroupProps) {
  return (
    <div className={clsx('w-full', className)}>
      {label && <label className="block text-sm font-medium text-cream-700 mb-1">{label}</label>}
      <div className="space-y-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <input
              type="radio"
              name={label || 'radio-group'}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 border-cream-300 text-primary-600 focus:ring-primary-500 transition-all duration-200"
            />
            <label className="text-sm text-cream-700 cursor-pointer select-none font-medium">
              {opt.label}
            </label>
            {opt.description && (
              <p className="text-xs text-cream-400">{opt.description}</p>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}

export interface RadioItemProps {
  children: React.ReactNode;
  value: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export function RadioItem({ children, value, checked, onChange, className }: RadioItemProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
        checked ? 'bg-primary-50' : 'hover:bg-cream-50',
        className
      )}
      onClick={onChange}
    >
      <input type="radio" name="radio-item" value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={clsx(
          'h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all duration-200',
          checked
            ? 'border-primary-600 bg-primary-600'
            : 'border-cream-300 bg-white'
        )}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className={clsx('text-sm', checked ? 'text-cream-900 font-medium' : 'text-cream-700')}>
        {children}
      </span>
    </div>
  );
}
