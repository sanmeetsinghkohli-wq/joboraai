'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { AppDataProvider } from '@/context/AppDataContext';
import { cn } from '@/lib/cn';

export interface ToastProps {
  type?: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface AppToast extends ToastProps {
  id: string;
}

interface ToastContextValue {
  addToast: (toast: ToastProps) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastIcon = {
  success: { Icon: CircleCheck, color: 'text-success' },
  error: { Icon: CircleAlert, color: 'text-danger' },
  info: { Icon: Info, color: 'text-plum' },
};

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: ToastProps) => {
      const id = `${Date.now()}-${Math.round(performance.now())}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      const duration = toast.duration ?? (toast.type === 'error' ? 7000 : 4000);
      if (duration > 0) setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => {
          const { Icon, color } = toastIcon[toast.type || 'success'];
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-lg border border-line bg-paper p-4 shadow-raised"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', color)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-sm text-ink-muted">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss"
                className="-m-1.5 rounded p-1.5 text-ink-subtle hover:bg-sand hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within Providers');
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppDataProvider>
      <ToastProvider>{children}</ToastProvider>
    </AppDataProvider>
  );
}
