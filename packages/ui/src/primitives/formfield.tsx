import { clsx } from 'clsx';

export interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, helperText, required = false, className, children }: FormFieldProps) {
  return (
    <div className={clsx('w-full', className)}>
      <label className="block text-sm font-medium text-cream-700 mb-1">
        {label}
        {required && <span className="ml-1 text-error-500">*</span>}
      </label>
      <div className="relative">
        {children}
      </div>
      {helperText && !error && <p className="mt-1 text-xs text-cream-400">{helperText}</p>}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}

export interface FormItemProps {
  children: React.ReactNode;
  className?: string;
}

export function FormItem({ children, className }: FormItemProps) {
  return <div className={clsx('w-full', className)}>{children}</div>;
}

export interface FormLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function FormLabel({ children, className }: FormLabelProps) {
  return <span className={clsx('text-sm font-medium text-cream-700', className)}>{children}</span>;
}

export interface FormControlProps {
  children: React.ReactNode;
  className?: string;
}

export function FormControl({ children, className }: FormControlProps) {
  return <div className={clsx('relative', className)}>{children}</div>;
}

export interface FormMessageProps {
  children: React.ReactNode;
  className?: string;
}

export function FormMessage({ children, className }: FormMessageProps) {
  return <p className={clsx('text-xs text-error-600', className)}>{children}</p>;
}
