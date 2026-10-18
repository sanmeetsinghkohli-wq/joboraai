'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';

export interface StitchShellProps {
  children: React.ReactNode;
  activeNav?: string;
}

export function StitchShell({ children, activeNav }: StitchShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, activities, jobs } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = profile.firstName || profile.fullName || (profile.email ? profile.email.split('@')[0] : 'Profile Setup');
  const compatibilityScore = profile.atsScore > 0 ? profile.atsScore : jobs.length > 0 ? 84 : 0;

  const navItems = [
    { id: 'home-dashboard', label: 'Home / Dashboard', icon: 'space_dashboard', href: '/dashboard' },
    { id: 'job-search', label: 'Job Search', icon: 'travel_explore', href: '/jobs' },
    { id: 'saved-jobs', label: 'Saved Jobs', icon: 'bookmark_border', href: '/saved-jobs' },
    { id: 'applications', label: 'Applications', icon: 'send', href: '/applications' },
    { id: 'cv-studio', label: 'CV Studio', icon: 'description', href: '/cv-studio' },
    { id: 'cover-letters', label: 'Cover Letters', icon: 'history_edu', href: '/cover-letters' },
    { id: 'interview-prep', label: 'Interview Prep', icon: 'psychology_alt', href: '/interview' },
    { id: 'career-insights', label: 'Career Insights', icon: 'insights', href: '/career-insights' },
    { id: 'documents', label: 'Documents', icon: 'folder_shared', href: '/documents' },
  ];

  const systemItems = [
    { id: 'email-integrations', label: 'Email Integrations', icon: 'mark_email_unread', href: '/settings/integrations' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' },
  ];

  const isActive = (item: { id: string; href: string }) => {
    if (activeNav) return activeNav === item.id;
    if (pathname === item.href) return true;
    if (item.href !== '/dashboard' && item.href !== '/settings' && pathname?.startsWith(item.href)) return true;
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low shadow-[0_1px_8px_rgba(53,27,50,0.03)] z-50 flex flex-col justify-between">
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5">
          <Link href="/" className="flex items-center gap-3 px-3 mb-6">
            <img
              alt="Jobora AI Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1UD0RQDL23COD4vvkGvPgLL6-sKCmE1485hqPsHnMByfJU_YPd5JVBuq57MN8vjXkzWM6OFUNV_3WdbRTnaM1HOMTHwFPN3hJwxRwUO_TKEOVc7VgH4u-1Pjby7L2fUY6iZdfWKut8N34Zo2Yw4qCZkL1GR58Rc8JI6Z4E4mvvmI8eozNUZ6iTwct8Gn7RrZCi2a6p1NR7ZPYgZSR-xXQ5FrJpJdOslDRrneh1HrFFC80iyRE253aFPAg"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight">Jobora AI</span>
              <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">Career Copilot</span>
            </div>
          </Link>
          <div className="px-3 pb-2">
            <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">Navigation</span>
          </div>
          <nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-bold shadow-sm">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-all duration-150'
                  }
                  data-path={item.id}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="px-3 pt-5 pb-2">
            <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">System</span>
          </div>
          <nav className="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-bold shadow-sm">
            {systemItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-all duration-150'
                  }
                  data-path={item.id}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 mx-4 mb-4 rounded-xl bg-surface-container shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-primary font-bold">AI Copilot Readiness</span>
            <span className="font-caption-caps text-caption-caps text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
            <div
              className="bg-secondary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${compatibilityScore}%` }}
            ></div>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {compatibilityScore}% job compatibility sync
          </p>
        </div>
      </aside>
      <div className="pl-64 flex flex-col min-h-screen">
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(53,27,50,0.04)] z-40 px-gutter flex items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative flex items-center bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04)] px-3 py-1.5 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[20px]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none"
                placeholder="Search jobs, companies or keywords..."
                type="text"
              />
              <kbd className="font-caption-caps text-caption-caps bg-surface-container text-on-surface-variant px-2 py-0.5 rounded ml-2 whitespace-nowrap">⌘K</kbd>
            </div>
          </form>
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {activities.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-surface"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-12 right-24 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-label-md text-label-md text-primary font-bold">Notifications</span>
                  <span className="font-caption-caps text-caption-caps text-secondary">
                    {activities.length} events
                  </span>
                </div>
                <div className="space-y-2.5 text-left max-h-60 overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="font-body-sm text-body-sm text-on-surface-variant py-3 text-center">
                      No new activity yet. Upload your CV or explore live jobs.
                    </div>
                  ) : (
                    activities.slice(0, 5).map((act) => (
                      <div key={act.id} className="p-2.5 rounded-xl bg-surface-container-low">
                        <div className="font-label-sm text-label-sm text-primary font-bold">{act.title}</div>
                        <div className="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
                          {act.subtitle} • {act.timestamp}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <Link
              href="/career-insights"
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[22px]">help_outline</span>
            </Link>
            <div className="h-6 w-px bg-surface-container-highest mx-1"></div>
            <Link
              href="/onboarding"
              className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-tertiary-fixed-dim rounded-full ring-2 ring-surface"></span>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight">{displayName}</span>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant leading-tight">
                  {profile.targetRole || 'Job Seeking • Active'}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
            </Link>
          </div>
        </header>
        <main className="w-full pt-16 bg-surface min-h-screen px-gutter pb-space-xl">{children}</main>
      </div>
    </div>
  );
}
