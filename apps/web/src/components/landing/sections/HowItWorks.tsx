'use client';

import React from 'react';
import { Line } from './shared';
import { useSectionStep } from '../scroll-state';
import { useStaticLayout } from '../use-render-tier';
import { StaticResume } from '../ResumeCss';

const STEPS = [
  { t: 'Set your preferences', d: 'Tell us about your background and career goals.' },
  { t: 'Discover opportunities', d: 'Live roles from Remotive and Arbeitnow, scored against your skills.' },
  { t: 'Prepare your application', d: 'Tailor your CV and cover letter for each role.' },
  { t: 'Apply and track', d: 'Send from your own email and track your progress.' },
];

export function HowItWorks() {
  const isStatic = useStaticLayout();
  // The sticky track is 300vh, so the pinned part is ~2/3 of local progress.
  // Quantized to 40 rail steps so the section re-renders at most 40 times per pass, not every frame.
  const RAIL = 40;
  const railStep = useSectionStep('how', RAIL, 0.66);
  const prog = isStatic ? 1 : railStep / RAIL;
  const active = isStatic ? STEPS.length : Math.min(STEPS.length - 1, Math.floor(prog * STEPS.length));

  return (
    <section id="how-it-works" data-scroll-section="how" className="relative border-t border-[#EDE5E1] scroll-mt-20" data-purpose="workflow-steps">
      <div className={isStatic ? 'py-20' : 'min-h-[300vh]'}>
        <div className={isStatic ? '' : 'sticky top-0 min-h-screen flex items-center py-16 lg:py-20'}>
          <div className={`max-w-7xl mx-auto w-full px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 ${isStatic ? '' : 'max-lg:pt-[48svh]'}`}>
            <div className="lg:col-span-6 space-y-8">
              <h2 className="serif-title text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-[#2A1728]">
                <Line i={0}>From search to sent,</Line>
                <Line i={1}>in four steps.</Line>
              </h2>
              <div className="relative pl-8">
                {/* progress rail */}
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[#EDE5E1]" aria-hidden="true" />
                <div
                  className="absolute left-[7px] top-1 bottom-1 w-px bg-[#E05347] origin-top"
                  style={{ transform: `scaleY(${prog})` }}
                  data-how-rail
                  aria-hidden="true"
                />
                <ol className="space-y-6">
                  {STEPS.map((s, i) => {
                    const on = i <= active;
                    return (
                      <li key={s.t} data-step={i} data-active={on} className="relative">
                        <span
                          className={`absolute -left-8 top-1.5 w-[15px] h-[15px] rounded-full border-2 transition-colors duration-300 ${
                            on ? 'bg-[#E05347] border-[#E05347]' : 'bg-[#FAF6F2] border-[#EDE5E1]'
                          }`}
                          aria-hidden="true"
                        />
                        <h3 className={`text-base font-bold transition-colors ${on ? 'text-[#2A1728]' : 'text-[#63555F]'}`}>
                          {i + 1}. {s.t}
                        </h3>
                        <p className="text-sm text-[#63555F] mt-1 leading-relaxed max-w-md">{s.d}</p>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div className="lp-card rounded-2xl border border-[#EDE5E1] bg-white/70 backdrop-blur-xl p-5 max-w-md">
                <h3 className="serif-title text-lg font-semibold text-[#2A1728]">Built for students and professionals</h3>
                <p className="text-sm text-[#63555F] leading-relaxed mt-1">
                  Whether you&apos;re starting out or looking for your next big step, Jobora AI helps you take control of your career.
                </p>
              </div>
            </div>
            <div className="lg:col-span-6 flex justify-center">{isStatic && <StaticResume kind="back" className="w-full max-w-xs" />}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
