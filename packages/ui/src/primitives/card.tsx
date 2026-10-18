import { clsx } from 'clsx';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
}

export function Card({ className, children, variant = 'default' }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-cream-200 bg-white/80 backdrop-blur-sm',
        variant === 'elevated' && 'shadow-md shadow-cream-900/5',
        variant === 'outline' && 'border-cream-300 bg-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return <div className={clsx('p-4 sm:p-5', className)}>{children}</div>;
}

export interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export function CardContent({ className, children }: CardContentProps) {
  return <div className={clsx('p-4 sm:p-5', className)}>{children}</div>;
}

export interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
  level?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function CardTitle({ className, children, level = 'h3' }: CardTitleProps) {
  const Tag = level;
  return (
    <Tag className={clsx('text-lg sm:text-xl font-semibold text-cream-900', className)}>
      {children}
    </Tag>
  );
}

export interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return <p className={clsx('text-sm text-cream-500 mt-1', className)}>{children}</p>;
}

export interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function CardFooter({ className, children }: CardFooterProps) {
  return <div className={clsx('flex items-center justify-end p-4 sm:p-5 border-t border-cream-200', className)}>{children}</div>;
}
