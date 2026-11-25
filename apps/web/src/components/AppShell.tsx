'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Mic,
  Search,
  Send,
  Settings,
  Sparkles,
  Briefcase,
  IdCard,
  BarChart3,
  Inbox,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { profileStrength } from '@/lib/profile';
import { useWorkspaceTheme } from '@/lib/theme';
import { cn } from '@/lib/cn';
import { Logo } from './ui/logo';
import { IconButton } from './ui/button';
import { Skeleton } from './ui/primitives';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Extra path prefixes that should also mark this item active. */
  also?: string[];
}

const NAV: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [
      { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
      { href: '/profile', label: 'My profile', icon: UserRound },
    ],
  },
  {
    title: 'Find',
    items: [
      { href: '/jobs', label: 'Jobs', icon: Search, also: ['/saved-jobs'] },
      { href: '/applications', label: 'Applications', icon: Send },
      { href: '/outbox', label: 'Outbox', icon: Inbox, also: ['/email-composer'] },
    ],
  },
  {
    title: 'Apply',
    items: [
      {
        href: '/cv-studio',
        label: 'CV & documents',
        icon: FileText,
        also: ['/documents', '/cover-letters', '/document-studio', '/resume-studio'],
      },
      { href: '/career-ops', label: 'Career Ops', icon: Briefcase },
    ],
  },
  {
    title: 'Grow',
    items: [
      { href: '/interview', label: 'Interview practice', icon: Mic },
      { href: '/career-growth', label: 'Learning roadmap', icon: TrendingUp, also: ['/career-insights'] },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/linkedin', label: 'LinkedIn', icon: IdCard },
      { href: '/ai-copilot', label: 'Copilot', icon: Sparkles },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  return [item.href, ...(item.also || [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV.map((group, i) => (
        <div key={group.title || i}>
          {group.title && (
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">
              {group.title}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center gap-3 rounded px-3 text-sm transition-colors duration-150',
                      active
                        ? 'bg-plum font-semibold text-paper shadow-card'
                        : 'font-medium text-ink-muted hover:bg-sand hover:text-plum'
                    )}
                  >
                    <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-coral')} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ProfileProgress({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useAppData();
  const { checks: steps, next } = profileStrength(profile);
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  return (
    <Link
      href={next ? `/profile#${next.anchor}` : '/profile'}
      onClick={onNavigate}
      className="block rounded-lg border border-line bg-paper p-3.5 transition-colors hover:border-plum-200"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-plum">Finish your profile</span>
        <span className="tabular-nums text-ink-subtle">
          {done}/{steps.length}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
        aria-label="Profile completeness"
      >
        <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      {next && <p className="mt-2 text-xs text-ink-muted">Next: add your {next.label.toLowerCase()}</p>}
    </Link>
  );
}

function UserMenu({ theme }: { theme: ReturnType<typeof useWorkspaceTheme> }) {
  const router = useRouter();
  const { profile, signOut } = useAppData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = profile.fullName || profile.email.split('@')[0] || 'Account';
  const initial = (name[0] || 'J').toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.replace('/auth?tab=login');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center gap-2.5 rounded pl-1.5 pr-2 transition-colors hover:bg-sand"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-plum text-sm font-semibold text-paper">
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink md:block">{name}</span>
        <ChevronDown className={cn('h-4 w-4 text-ink-subtle transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 animate-fade-up rounded-lg border border-line bg-paper p-1.5 shadow-raised"
        >
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-ink-subtle">{profile.email}</p>
          </div>
          <div className="pt-1.5">
            <MenuLink href="/settings" icon={Settings} onClick={() => setOpen(false)}>
              Account settings
            </MenuLink>
            <MenuLink href="/notifications" icon={Activity} onClick={() => setOpen(false)}>
              Activity
            </MenuLink>
            <div className="my-1 px-3 py-2" role="group" aria-label="Theme">
              <p className="mb-1.5 text-xs font-medium text-ink-subtle">Theme</p>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-sand p-0.5">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={theme.pref === t}
                    onClick={() => theme.choose(t)}
                    className={cn(
                      'h-8 rounded text-xs font-medium capitalize transition-colors',
                      theme.pref === t ? 'bg-paper text-plum shadow-card' : 'text-ink-muted hover:text-plum'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex h-10 w-full items-center gap-3 rounded px-3 text-sm text-ink-muted hover:bg-sand hover:text-plum"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex h-10 items-center gap-3 rounded px-3 text-sm text-ink-muted hover:bg-sand hover:text-plum"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your workspace">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function AppShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { authStatus } = useAppData();
  const theme = useWorkspaceTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (authStatus === 'anonymous') {
      router.replace(`/auth?tab=login&next=${encodeURIComponent(pathname)}`);
    }
  }, [authStatus, pathname, router]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs');
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-ivory px-3 py-5 lg:flex">
        <Link href="/dashboard" className="mb-6 px-3" aria-label="Jobora home">
          <Logo />
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavList pathname={pathname} />
        </div>
        <div className="pt-4">
          <ProfileProgress />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-plum-900/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ivory px-3 py-4 shadow-float"
          >
            <div className="mb-5 flex items-center justify-between px-3">
              <Logo />
              <IconButton label="Close menu" onClick={() => setDrawerOpen(false)} className="-mr-2">
                <X className="h-5 w-5" aria-hidden="true" />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="pt-4">
              <ProfileProgress onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-ivory/90 px-3 backdrop-blur sm:px-6">
          <IconButton label="Open menu" onClick={() => setDrawerOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <form onSubmit={onSearch} role="search" className="relative min-w-0 flex-1 sm:max-w-md">
            <label htmlFor="global-search" className="sr-only">
              Search jobs
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              id="global-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs"
              className="control h-10 pl-9"
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/ai-copilot"
              aria-label="Open Copilot"
              title="Copilot"
              className="hidden h-11 w-11 items-center justify-center rounded text-ink-muted hover:bg-sand hover:text-plum sm:inline-flex"
            >
              <MessagesSquare className="h-5 w-5" />
            </Link>
            <UserMenu theme={theme} />
          </div>
        </header>

        <main id="main" className={cn('mx-auto w-full px-4 py-6 sm:px-6 sm:py-8', wide ? 'max-w-[88rem]' : 'max-w-6xl')}>
          {authStatus === 'authenticated' ? children : <ShellSkeleton />}
        </main>
      </div>
    </div>
  );
}
