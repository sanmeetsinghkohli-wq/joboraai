import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, description, min = 0, max = 100, step = 1, value = 50, onChange, showValue = true, id, ...props }, ref) => {
    const inputId = id || (label ? `slider-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const numValue = typeof value === 'number' ? value : min;
    const percentage = Math.min(100, Math.max(0, ((numValue - min) / (max - min || 1)) * 100));

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-neutral-700"
            >
              {label}
            </label>
            {showValue && (
              <span className="text-xs font-semibold text-violet-700">{Math.round(numValue)}</span>
            )}
          </div>
        )}
        <div className="relative flex items-center py-1">
          <input
            ref={ref}
            id={inputId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={numValue}
            onChange={(e) => onChange?.(parseFloat(e.target.value))}
            className="w-full cursor-pointer appearance-none h-2 bg-neutral-200 rounded-full outline-none transition-all duration-200 accent-violet-600"
            {...props}
          />
        </div>
        {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      </div>
    );
  }
);
Slider.displayName = 'Slider';
