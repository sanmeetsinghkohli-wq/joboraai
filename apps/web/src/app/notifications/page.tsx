'use client';

import React from 'react';
import Link from 'next/link';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function NotificationsPage() {
  const { activities, applications } = useAppData();

  return (
    <StitchShell activeNav="home-dashboard">
      <div className="flex flex-col w-full py-6 gap-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary font-bold">
              Activity &amp; Alerts
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
              Notification Center
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Real-time log of your CV analyses, job matches, application updates, and follow-up reminders.
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 rounded-xl bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors"
          >
            Notification Preferences
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-3">
          {activities.length === 0 && applications.length === 0 ? (
            <div className="py-10 text-center text-on-surface-variant font-body-md">
              No notifications yet. Explore live jobs, tailor your CV, or prepare an application to see events here.
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">{act.icon || 'notifications'}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md text-primary font-bold">{act.title}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{act.subtitle}</div>
                  </div>
                </div>
                <span className="font-mono text-xs text-on-surface-variant">{act.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </StitchShell>
  );
}
