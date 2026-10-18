import { clsx } from 'clsx';

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxW?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Container({ children, className, maxW = 'xl' }: ContainerProps) {
  const maxWidthMap = {
    md: 'max-w-6xl',
    lg: 'max-w-7xl',
    xl: 'max-w-8xl',
    '2xl': 'max-w-9xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={clsx(
        'mx-auto w-full',
        maxWidthMap[maxW],
        'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}
