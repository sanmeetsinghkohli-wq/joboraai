import { clsx } from 'clsx';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Container } from './container';
import { Spinner } from '../primitives/spinner';

export interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  darkMode?: boolean;
  sidebar?: {
    open: boolean;
    onClose: () => void;
  };
  header?: {
    onSearchChange?: (query: string) => void;
    searchQuery?: string;
    notifications?: { count: number };
    onNotificationsClick?: () => void;
  };
  loading?: boolean;
  footer?: React.ReactNode;
}

export function PageShell({
  children,
  title = 'Jobora AI',
  description,
  darkMode = false,
  sidebar,
  header,
  loading = false,
  footer,
}: PageShellProps) {
  return (
    <div
      className={clsx(
        'min-h-screen flex flex-col',
        darkMode ? 'bg-cream-900' : 'bg-cream-50'
      )}
    >
      {header && <Header {...header} />}

      <div className="flex-1 flex overflow-hidden">
        {sidebar && (
          <Sidebar
            open={sidebar.open}
            onClose={sidebar.onClose}
            activePath={window.location.pathname}
            darkMode={darkMode}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          <Container>
            <div
              className={clsx(
                'animate-fade-in',
                'px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10'
              )}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Spinner size="lg" />
                  <p className="mt-3 text-sm text-cream-500">Loading {title}...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 sm:mb-8">
                    <h1 className={clsx('text-xl sm:text-2xl font-bold tracking-tight', darkMode ? 'text-cream-100' : 'text-cream-900')}>
                      {title}
                    </h1>
                    {description && (
                      <p className={clsx('mt-1 text-sm', darkMode ? 'text-cream-400' : 'text-cream-500')}>
                        {description}
                      </p>
                    )}
                  </div>
                  {children}
                </>
              )}
            </div>
          </Container>
        </main>
      </div>

      {footer && (
        <footer
          className={clsx(
            'border-t border-cream-200/60 py-4 px-4 sm:px-6 lg:px-8',
            darkMode && 'border-cream-700/60 bg-cream-900/30'
          )}
        >
          <Container>
            <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-2 text-xs', darkMode ? 'text-cream-400' : 'text-cream-500')}>
              <p>&copy; 2026 Jobora AI. All rights reserved.</p>
              <p className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                {description && description.length > 0 ? 'Live' : 'Ready'}
              </p>
            </div>
          </Container>
        </footer>
      )}
    </div>
  );
}
