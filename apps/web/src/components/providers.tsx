'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AppDataProvider } from '@/context/AppDataContext';

export interface ToastProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  description?: string;
  duration?: number;
}

interface AppToast extends ToastProps {
  id: string;
}

interface ToastContextValue {
  toasts: AppToast[];
  addToast: (toast: Omit<AppToast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProviderWrapper({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const addToast = useCallback((toast: Omit<AppToast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className="bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 cursor-pointer"
            >
              <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
                check_circle
              </span>
              <div className="flex flex-col">
                {toast.title && <span className="font-label-md text-label-md font-bold">{toast.title}</span>}
                {toast.description && <span className="font-body-sm text-body-sm">{toast.description}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProviderWrapper');
  }
  return ctx;
}

interface ThemeContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <ToastProviderWrapper>{children}</ToastProviderWrapper>
    </AppDataProvider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
