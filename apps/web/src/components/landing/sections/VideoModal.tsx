'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { scrollControl } from '../scroll-state';
import Link from 'next/link';

const STEPS = [
  ['Step 1 • Discover', 'Live Multi-Source Jobs', 'Match scores computed transparently against your skills.'],
  ['Step 2 • Tailor', 'CV & Cover Letter Studio', 'Upload PDF/DOCX, review diffs, and export clean documents.'],
  ['Step 3 • Execute', 'Application & Interview Prep', 'Track every stage on a Kanban board and run STAR mock sessions.'],
];

export function VideoModal({ onClose }: { onClose: () => void }) {
  const [videoError, setVideoError] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const node = root.current;
    // Everything else on the page is made inert and hidden from assistive tech while the dialog is open.
    const others = Array.from(document.body.children).filter((el) => el !== node?.parentElement && el !== node) as HTMLElement[];
    const prev = others.map((el) => [el.hasAttribute('inert'), el.getAttribute('aria-hidden')] as const);
    others.forEach((el) => {
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    });
    scrollControl.stop();
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])') ?? [],
      );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (!node?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      others.forEach((el, i) => {
        if (!prev[i][0]) el.removeAttribute('inert');
        if (prev[i][1] === null) el.removeAttribute('aria-hidden');
        else el.setAttribute('aria-hidden', prev[i][1] as string);
      });
      document.documentElement.style.overflow = prevOverflow;
      scrollControl.start();
      trigger?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={root}
      className="fixed inset-0 z-[60] bg-[#2A1728]/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
    >
      <div
        className="relative w-full max-w-4xl bg-[#2A1728] rounded-3xl overflow-hidden shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-[#E05347] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          type="button"
          aria-label="Close product tour modal"
          autoFocus
        >
          ✕
        </button>
        {!videoError ? (
          <video
            src="/Jobora_AI_Official_30s_Commercial.mp4"
            controls
            autoPlay
            onError={() => setVideoError(true)}
            className="w-full aspect-video"
          />
        ) : (
          <div className="p-8 sm:p-12 text-white flex flex-col justify-between min-h-[380px] bg-gradient-to-br from-[#2A1728] via-[#3D223B] to-[#1D0F1B]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#E05347]/20 text-[#F7CEBA] text-xs font-bold uppercase tracking-wider mb-4">
                Interactive Product Walkthrough
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">Experience Jobora AI Career Copilot</h3>
              <p className="text-white/80 text-sm sm:text-base max-w-2xl mb-6">
                Explore live job synchronization across Remotive &amp; Arbeitnow, tailor your CV with real-time keyword analysis, generate grounded cover letters, and practice technical interviews.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {STEPS.map(([k, t, d]) => (
                  <div key={k} className="p-4 rounded-2xl bg-white/10 border border-white/10">
                    <div className="text-xs font-bold uppercase text-[#F7CEBA] mb-1">{k}</div>
                    <div className="text-sm font-semibold">{t}</div>
                    <p className="text-xs text-white/70 mt-1">{d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard" onClick={onClose} className="px-6 py-3 rounded-full bg-[#C94136] hover:bg-[#B83A30] text-white text-sm font-semibold transition-all">
                Launch Live Workspace →
              </Link>
              <Link href="/jobs" onClick={onClose} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all">
                Browse Live Jobs
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default VideoModal;
