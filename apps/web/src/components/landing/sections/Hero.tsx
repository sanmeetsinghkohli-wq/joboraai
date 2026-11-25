'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowIcon, FOCUS, Line } from './shared';
import { useStaticLayout } from '../use-render-tier';
import { StaticResume } from '../ResumeCss';

const FACTS = ['No credit card required', 'Upload PDF or DOCX', 'Nothing sends without your OK'];

export function Hero({ onWatchTour }: { onWatchTour?: () => void }) {
  const isStatic = useStaticLayout();

  return (
    <section id="hero" data-scroll-section="hero" className="relative lg:min-h-[100svh] flex flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10 peach-hero-glow" aria-hidden="true" />
      {!isStatic && <div className="lg:hidden h-[48svh]" aria-hidden="true" />}
      <div className="flex-1 flex items-center max-w-7xl w-full mx-auto px-6 lg:px-10 pt-10 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
          <div className="lg:col-span-6 space-y-7">
            <div className="lp-fade inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#EDE5E1] bg-white/60 backdrop-blur text-[#63555F] text-xs font-semibold tracking-[0.14em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E05347]" aria-hidden="true" />
              AI career copilot
            </div>
            <h1 className="serif-title text-[clamp(2.75rem,7vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-[#2A1728]">
              <Line i={0}>Find your fit.</Line>
              <Line i={1} className="coral-gradient-text italic pb-[0.12em]">
                Make your move.
              </Line>
            </h1>
            <p className="lp-fade text-lg md:text-xl text-[#63555F] leading-relaxed max-w-xl" style={{ ['--d' as string]: '0.35s' }}>
              Jobora finds roles that fit you, tailors your CV and cover letter to each one, and sends it from your own Gmail once you approve it.
            </p>
            <div className="lp-fade flex flex-wrap items-center gap-4" style={{ ['--d' as string]: '0.45s' }}>
              <Link
                className={`lp-glow inline-flex items-center gap-2 bg-[#2A1728] hover:bg-[#3E1B3B] text-white text-base font-semibold px-7 py-3.5 rounded-full transition-all duration-200 ${FOCUS}`}
                href="/dashboard"
              >
                <span>Get started free</span>
                <ArrowIcon />
              </Link>
              {onWatchTour && (
              <button
                onClick={onWatchTour}
                className={`inline-flex items-center gap-2.5 bg-white/80 hover:bg-white text-[#2A1728] border border-[#EDE5E1] hover:border-[#E05347]/50 text-base font-semibold px-6 py-3.5 rounded-full transition-all duration-200 ${FOCUS}`}
                type="button"
              >
                <span className="w-6 h-6 rounded-full bg-[#2A1728] flex items-center justify-center text-white" aria-hidden="true">
                  <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </span>
                <span>Watch the 30-second tour</span>
              </button>
              )}
            </div>
            <ul className="lp-fade flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm font-medium text-[#63555F]" style={{ ['--d' as string]: '0.55s' }}>
              {FACTS.map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#E05347]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          {/* Right half belongs to the fixed resume layer. Static tier draws its own flat copy. */}
          <div className="lg:col-span-6 hidden lg:flex justify-center" data-hero-resume-slot>
            {isStatic && <StaticResume kind="front" className="w-[300px]" />}
          </div>
        </div>
      </div>
      <div className="lp-fade absolute bottom-6 left-0 right-0 hidden lg:flex flex-col items-center gap-2 text-xs font-medium tracking-wide text-[#63555F]" style={{ ['--d' as string]: '0.8s' }} data-scroll-cue>
        <span>Scroll to see your CV, decoded</span>
        <span className="lp-cue block w-px h-8 bg-gradient-to-b from-[#E05347] to-transparent" aria-hidden="true" />
      </div>
    </section>
  );
}

export default Hero;
