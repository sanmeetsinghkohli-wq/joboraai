'use client';
import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface AccordionItemProps {
  header: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function AccordionItem({ header, children, defaultOpen = false, className }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <div
      className={clsx(
        'border border-cream-200 rounded-lg overflow-hidden',
        className
      )}
    >
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-cream-900">{header}</span>
        <Icon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          className="text-cream-400 transition-transform duration-200"
        />
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-48' : 'max-h-0'
        )}
      >
        <div className="px-4 pb-4 text-sm text-cream-600">
          {children}
        </div>
      </div>
    </div>
  );
}

export interface AccordionProps {
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ className, children }: AccordionProps) {
  return <div className={clsx('space-y-2', className)}>{children}</div>;
}

export interface AccordionTriggerProps {
  children: React.ReactNode;
}

export function AccordionTrigger({ children }: AccordionTriggerProps) {
  return <div className="w-full cursor-pointer">{children}</div>;
}

export interface AccordionContentProps {
  children: React.ReactNode;
}

export function AccordionContent({ children }: AccordionContentProps) {
  return <div className="pt-2">{children}</div>;
}
