import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
        ghost: 'bg-transparent text-cream-900 hover:bg-cream-100 hover:text-cream-900',
        outline: 'border border-cream-200 text-cream-900 hover:bg-cream-50 hover:border-cream-300',
        destructive: 'bg-error-600 text-white hover:bg-error-700',
        neutral: 'bg-cream-800 text-cream-50 hover:bg-cream-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-lg',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const ButtonVariants = buttonVariants;
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

