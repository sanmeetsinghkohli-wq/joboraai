import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={clsx(
            'h-4 w-4 rounded border-cream-300 text-primary-600 focus:ring-primary-500 transition-all duration-200',
            error && 'border-error-300 focus:ring-error-500',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-cream-700 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
