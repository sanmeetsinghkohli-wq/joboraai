'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Icon, IconNames } from './icons';

export interface TooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
}

export function Tooltip({ content, placement = 'top', children, className, showArrow = true }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    setVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const container = document.body;

    let top = 0;
    let left = 0;

    if (placement === 'top') {
      top = rect.top - 8;
      left = rect.left + rect.width / 2 - 40;
    } else if (placement === 'bottom') {
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2 - 40;
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - 20;
      left = rect.left - 80;
    } else {
      top = rect.top + rect.height / 2 - 20;
      left = rect.right + 8;
    }

    setPosition({ top, left });
  }, [visible, placement]);

  return (
    <div
      ref={triggerRef}
      className={clsx('relative inline-flex cursor-default', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          className={clsx(
            'absolute z-50 px-3 py-2 rounded-lg text-xs font-medium text-white',
            'bg-cream-900 shadow-lg',
            'animate-fade-in',
            placement === 'top' && 'bottom-full mb-2',
            placement === 'bottom' && 'top-full mt-2',
            placement === 'left' && 'right-full mr-2',
            placement === 'right' && 'left-full ml-2'
          )}
          style={{
            top: placement === 'top' || placement === 'bottom' ? 0 : 'auto',
            left: placement === 'left' || placement === 'right' ? 0 : 'auto',
          }}
        >
          {showArrow && (
            <div
              className="absolute w-2 h-2 bg-cream-900 rotate-45"
              style={{
                bottom: placement === 'top' ? '-4px' : 'auto',
                top: placement === 'bottom' ? '-4px' : 'auto',
                left: placement === 'top' || placement === 'left' ? '50%' : 'auto',
                right: placement === 'right' || placement === 'left' ? '50%' : 'auto',
              }}
            />
          )}
          {content}
        </div>
      )}
    </div>
  );
}

export function TooltipContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('text-xs text-cream-500', className)}>{children}</div>;
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipArrow({ className }: { className?: string }) {
  return <div className={clsx('absolute w-2 h-2 bg-cream-900 rotate-45', className)} />;
}
