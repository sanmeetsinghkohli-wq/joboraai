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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="badge-coral uppercase tracking-wider text-[11px] font-bold">
              Activity &amp; Alerts
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#351B32] tracking-tight mt-1">
              Notification Center
            </h1>
            <p className="text-sm text-[#7D747D] mt-1 font-sans">
              Real-time log of your CV analyses, job matches, application updates, and follow-up reminders.
            </p>
          </div>
          <Link
            href="/settings"
            className="btn-editorial-secondary text-xs self-start sm:self-auto"
          >
            Notification Preferences
          </Link>
        </div>

        <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3">
          {activities.length === 0 && applications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#E76F72]">
                <span className="material-symbols-outlined text-2xl">notifications_off</span>
              </div>
              <h2 className="font-serif text-lg font-bold text-[#351B32]">No notifications yet</h2>
              <p className="text-xs text-[#7D747D] max-w-sm">
                Explore live jobs, tailor your CV in CV Studio, or prepare an application to see real-time events logged here.
              </p>
              <Link
                href="/jobs"
                className="btn-editorial-primary text-xs mt-2"
              >
                Browse Live Jobs
              </Link>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-xl bg-[#F8F5F0]/60 border border-[#EDE5E1] flex items-center justify-between gap-4 hover:bg-[#F8F5F0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EDE5E1] flex items-center justify-center text-[#E76F72] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{act.icon || 'notifications'}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#351B32]">{act.title}</div>
                    <div className="text-xs text-[#7D747D] mt-0.5">{act.subtitle}</div>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-[#7D747D] shrink-0">{act.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </StitchShell>
  );
}
