'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-rose-100 selection:text-rose-900 bg-[#FAF6F2] text-[#2A1728] font-sans overflow-x-hidden">
      {/* BEGIN: MainHeader */}
      <header className="sticky top-0 z-50 bg-[#FAF6F2]/90 backdrop-blur-md border-b border-[#EFE7E1]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link aria-label="Jobora AI Home" className="flex items-center gap-2.5 group" href="/">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E05347] via-[#942C52] to-[#2A1728] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-3.5 h-3.5 rounded-full bg-[#FAF6F2]"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#2A1728] font-sans">
              Jobora <span className="text-[#E05347]">AI</span>
            </span>
          </Link>
          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#574B53]">
            <a className="hover:text-[#E05347] transition-colors" href="#features">
              Features
            </a>
            <a className="hover:text-[#E05347] transition-colors" href="#how-it-works">
              How It Works
            </a>
            <a className="hover:text-[#E05347] transition-colors" href="#pricing">
              Pricing
            </a>
            <Link className="hover:text-[#E05347] transition-colors" href="/jobs">
              For Students
            </Link>
            <Link className="hover:text-[#E05347] transition-colors" href="/career-insights">
              For Universities
            </Link>
            <Link className="hover:text-[#E05347] transition-colors" href="/dashboard">
              About
            </Link>
          </nav>
          {/* CTA Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              className="text-sm font-semibold text-[#2A1728] hover:text-[#E05347] transition-colors hidden sm:inline-block"
              href="/auth?tab=login"
            >
              Log in
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 bg-[#2A1728] hover:bg-[#3D223B] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              href="/auth?tab=signup"
            >
              <span>Get started</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-lg text-[#2A1728] hover:bg-[#EFE7E1] transition-colors"
              aria-label="Toggle mobile navigation"
            >
              <span className="material-symbols-outlined text-[24px]">{mobileNavOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#EFE7E1] bg-[#FAF6F2] px-6 py-4 flex flex-col gap-3 text-sm font-medium text-[#2A1728]">
            <a onClick={() => setMobileNavOpen(false)} className="py-1.5 hover:text-[#E05347]" href="#features">
              Features
            </a>
            <a onClick={() => setMobileNavOpen(false)} className="py-1.5 hover:text-[#E05347]" href="#how-it-works">
              How It Works
            </a>
            <a onClick={() => setMobileNavOpen(false)} className="py-1.5 hover:text-[#E05347]" href="#pricing">
              Pricing
            </a>
            <Link onClick={() => setMobileNavOpen(false)} className="py-1.5 hover:text-[#E05347]" href="/jobs">
              For Students
            </Link>
            <Link onClick={() => setMobileNavOpen(false)} className="py-1.5 hover:text-[#E05347]" href="/career-insights">
              For Universities
            </Link>
            <Link onClick={() => setMobileNavOpen(false)} className="py-1.5 hover:text-[#E05347]" href="/auth?tab=login">
              Log in
            </Link>
          </div>
        )}
      </header>
      {/* END: MainHeader */}

      {/* BEGIN: MainContent */}
      <main className="flex-grow">
        {/* BEGIN: HeroSection */}
        <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden peach-hero-glow">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Hero Column: Copy & Actions */}
              <div className="lg:col-span-7 space-y-7 z-10">
                {/* Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FCE8E7] text-[#D84F48] text-xs font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E05347] animate-pulse"></span>
                  AI-POWERED JOB SEARCH &amp; APPLICATION COPILOT
                </div>
                {/* Main Headline */}
                <h1 className="serif-title text-5xl sm:text-6xl lg:text-[68px] font-bold leading-[1.08] tracking-tight text-[#2A1728]">
                  Find your fit.
                  <br />
                  <span className="coral-gradient-text italic font-serif">Make your move.</span>
                </h1>
                {/* Subtitle */}
                <p className="text-lg md:text-xl text-[#63555F] leading-relaxed max-w-xl font-normal">
                  Discover the right opportunities, create standout applications, and land your next role — faster with AI.
                </p>
                {/* 4 Interactive Feature Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 max-w-2xl">
                  {/* Pill 1 */}
                  <Link
                    href="/jobs"
                    className="flex flex-col items-start p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-[#EDE5E1] hover:border-[#E05347]/40 transition-all hover:-translate-y-0.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#FCE8E7] text-[#E05347] flex items-center justify-center mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2A1728] leading-snug">Find relevant jobs</span>
                  </Link>
                  {/* Pill 2 */}
                  <Link
                    href="/cv-studio"
                    className="flex flex-col items-start p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-[#EDE5E1] hover:border-[#E05347]/40 transition-all hover:-translate-y-0.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#FAEBEE] text-[#C83F67] flex items-center justify-center mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" x2="8" y1="13" y2="13"></line>
                        <line x1="16" x2="8" y1="17" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2A1728] leading-snug">Tailor CV &amp; cover letter</span>
                  </Link>
                  {/* Pill 3 */}
                  <Link
                    href="/email-composer"
                    className="flex flex-col items-start p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-[#EDE5E1] hover:border-[#E05347]/40 transition-all hover:-translate-y-0.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#FDE8DF] text-[#D3523B] flex items-center justify-center mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="16" rx="2" width="20" x="2" y="4"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2A1728] leading-snug">Apply from your own email</span>
                  </Link>
                  {/* Pill 4 */}
                  <Link
                    href="/applications"
                    className="flex flex-col items-start p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-[#EDE5E1] hover:border-[#E05347]/40 transition-all hover:-translate-y-0.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#EFE9F3] text-[#692E63] flex items-center justify-center mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="18" x2="18" y1="20" y2="10"></line>
                        <line x1="12" x2="12" y1="20" y2="4"></line>
                        <line x1="6" x2="6" y1="20" y2="14"></line>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2A1728] leading-snug">Track your progress</span>
                  </Link>
                </div>
                {/* Call to Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    className="inline-flex items-center gap-2 bg-[#2A1728] hover:bg-[#3E1B3B] text-white text-base font-semibold px-7 py-3.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02]"
                    href="/dashboard"
                  >
                    <span>Get started free</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </Link>
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="inline-flex items-center gap-2.5 bg-white/90 hover:bg-white text-[#2A1728] border border-[#E3D8D0] text-base font-semibold px-6 py-3.5 rounded-full transition-all duration-200 hover:border-[#C4B3A8]"
                    type="button"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#FCE8E7] flex items-center justify-center text-[#E05347]">
                      <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M5 3l14 9-14 9V3z"></path>
                      </svg>
                    </span>
                    <span>Watch video</span>
                  </button>
                </div>
                {/* Trust Badges List */}
                <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm font-medium text-[#675B64]">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#E05347]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#E05347]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>Works with Gmail &amp; Outlook</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#E05347]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>Trusted by students &amp; professionals</span>
                  </div>
                </div>
              </div>
              {/* Right Hero Column: Visual Mockup / Lifestyle Focus */}
              <div className="lg:col-span-5 relative flex justify-center">
                {/* Decorative Background Blob */}
                <div className="absolute -top-10 -right-10 w-96 h-96 bg-gradient-to-tr from-[#F8D2C2]/40 to-[#FAD4C0]/20 rounded-full blur-3xl -z-10"></div>
                <div className="relative w-full max-w-lg lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 bg-white">
                  <img
                    alt="Young professional working on laptop with a scenic sunset skyline"
                    className="w-full h-[460px] object-cover object-center"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoH92qfHJW1ZBYUFCBnqy-y1ZnKJ-CW6w6AfBf2yGwwJzliNYcDe9-EFk-i0BgnZtsSwcSIX7e_lNcXdmODFm9RxFEK45FUFylLQlodGOPGJhgrKs81joIasm5Zr9jUZqN9Dn0E_SEvmXk3i21yWna4hHQxZ1NR_FyNvPhrm5EatzKaDZK0YtDQE3qDFx-y2PMkN_BMKj792mp8IZrkQi20LWC9ix-jQDNuHDkVFNO94Fb4HTaNcx0"
                  />
                  {/* Floating Notification Card 1 */}
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-[#EFE7E1] flex items-center gap-3 max-w-[240px]">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2A1728]">Interview Invitation!</div>
                      <div className="text-[11px] text-gray-500">Google • AI Engineer Intern</div>
                    </div>
                  </div>
                  {/* Floating Notification Card 2 */}
                  <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-[#EFE7E1] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-[#E05347] flex items-center justify-center font-bold text-sm">
                      88%
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2A1728]">Tailored Match Score</div>
                      <div className="text-[11px] text-gray-500">Keywords matched perfectly</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: HeroSection */}

        {/* BEGIN: FeaturesSection */}
        <section className="py-20 bg-white/50 border-y border-[#EFE7E1]" data-purpose="core-features" id="features">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            {/* Section Header */}
            <div className="max-w-2xl mb-14">
              <h2 className="serif-title text-3xl sm:text-4xl font-bold text-[#2A1728] tracking-tight">
                Everything you need to move forward
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#6B5E67]">
                From discovering opportunities to sending tailored applications, Jobora AI helps you at every step.
              </p>
            </div>
            {/* 4-Column Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: AI Job Search */}
              <Link
                href="/jobs"
                className="bg-white p-7 rounded-2xl border border-[#EDE5E1] shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FCE8E7] text-[#E05347] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#2A1728] mb-2">AI Job Search</h3>
                  <p className="text-sm text-[#6C5F68] leading-relaxed">
                    Discover roles that match your skills, interests, and career goals with hyper-personalized recommendations.
                  </p>
                </div>
                <div className="pt-6 flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-[#FAF6F2] flex items-center justify-center text-[#2A1728] group-hover:bg-[#2A1728] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </Link>
              {/* Card 2: CV & Cover Letter Studio */}
              <Link
                href="/cv-studio"
                className="bg-white p-7 rounded-2xl border border-[#EDE5E1] shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FAEBEE] text-[#C83F67] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" x2="8" y1="13" y2="13"></line>
                      <line x1="16" x2="8" y1="17" y2="17"></line>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#2A1728] mb-2">CV &amp; Cover Letter Studio</h3>
                  <p className="text-sm text-[#6C5F68] leading-relaxed">
                    Create tailored, professional applications optimized for ATS and specific job descriptions in minutes.
                  </p>
                </div>
                <div className="pt-6 flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-[#FAF6F2] flex items-center justify-center text-[#2A1728] group-hover:bg-[#2A1728] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </Link>
              {/* Card 3: Apply with Your Email */}
              <Link
                href="/email-composer"
                className="bg-white p-7 rounded-2xl border border-[#EDE5E1] shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] text-[#D3523B] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect height="16" rx="2" width="20" x="2" y="4"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#2A1728] mb-2">Apply with Your Email</h3>
                  <p className="text-sm text-[#6C5F68] leading-relaxed">
                    Send applications directly from your connected Gmail or Outlook account so emails come straight from you.
                  </p>
                </div>
                <div className="pt-6 flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-[#FAF6F2] flex items-center justify-center text-[#2A1728] group-hover:bg-[#2A1728] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </Link>
              {/* Card 4: Application Tracker */}
              <Link
                href="/applications"
                className="bg-white p-7 rounded-2xl border border-[#EDE5E1] shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#EFE9F3] text-[#692E63] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="18" x2="18" y1="20" y2="10"></line>
                      <line x1="12" x2="12" y1="20" y2="4"></line>
                      <line x1="6" x2="6" y1="20" y2="14"></line>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#2A1728] mb-2">Application Tracker</h3>
                  <p className="text-sm text-[#6C5F68] leading-relaxed">
                    Stay organized, monitor review statuses in real-time, and never miss an interview follow-up or reply.
                  </p>
                </div>
                <div className="pt-6 flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-[#FAF6F2] flex items-center justify-center text-[#2A1728] group-hover:bg-[#2A1728] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
        {/* END: FeaturesSection */}

        {/* BEGIN: HowItWorksSection */}
        <section className="py-20 lg:py-28" data-purpose="workflow-steps" id="how-it-works">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left: 4 Step Indicators */}
              <div className="lg:col-span-8">
                <div className="mb-10">
                  <h2 className="serif-title text-3xl sm:text-4xl font-bold text-[#2A1728]">How It Works</h2>
                  <p className="mt-2 text-base sm:text-lg text-[#6B5E67]">Go from search to application in a few simple steps.</p>
                </div>
                {/* Steps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                  {/* Step 1 */}
                  <div className="flex flex-col space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#FCE8E7] text-[#E05347] flex items-center justify-center font-bold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2A1728]">1. Set your preferences</h4>
                      <p className="text-xs text-[#6C5F68] mt-1 leading-normal">Tell us about your background and career goals.</p>
                    </div>
                  </div>
                  {/* Step 2 */}
                  <div className="flex flex-col space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#FAEBEE] text-[#C83F67] flex items-center justify-center font-bold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2A1728]">2. Discover opportunities</h4>
                      <p className="text-xs text-[#6C5F68] mt-1 leading-normal">Get AI-powered job recommendations matched for you.</p>
                    </div>
                  </div>
                  {/* Step 3 */}
                  <div className="flex flex-col space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#FDE8DF] text-[#D3523B] flex items-center justify-center font-bold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" x2="8" y1="13" y2="13"></line>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2A1728]">3. Prepare your application</h4>
                      <p className="text-xs text-[#6C5F68] mt-1 leading-normal">Tailor your CV and cover letter for each role.</p>
                    </div>
                  </div>
                  {/* Step 4 */}
                  <div className="flex flex-col space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#EFE9F3] text-[#692E63] flex items-center justify-center font-bold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="22" x2="11" y1="2" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2A1728]">4. Apply and track</h4>
                      <p className="text-xs text-[#6C5F68] mt-1 leading-normal">Send from your own email and track your progress.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: Callout Card */}
              <div className="lg:col-span-4">
                <div className="relative bg-gradient-to-br from-[#FCECE5] via-[#FCE4DC] to-[#F8D2C2] rounded-3xl p-8 border border-[#EBD0C5] overflow-hidden shadow-sm">
                  <div className="relative z-10 space-y-4">
                    <h3 className="serif-title text-2xl font-bold text-[#2A1728] leading-tight">
                      Built for students
                      <br />
                      and professionals
                    </h3>
                    <p className="text-sm text-[#5D4E56] leading-relaxed">
                      Whether you&apos;re starting out or looking for your next big step, Jobora AI helps you take control of your career.
                    </p>
                  </div>
                  {/* Decorative Graduation Cap / Emblem */}
                  <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-white/40 rounded-2xl flex items-center justify-center backdrop-blur-sm transform rotate-12">
                    <svg className="w-14 h-14 text-[#E05347]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: HowItWorksSection */}

        {/* BEGIN: PricingPreviewSection */}
        <section className="py-20 bg-white/70 border-t border-[#EFE7E1]" id="pricing">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="serif-title text-3xl sm:text-4xl font-bold text-[#2A1728]">Simple, transparent pricing</h2>
              <p className="mt-3 text-base text-[#6B5E67]">Choose the plan that fits your career goals.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-white rounded-2xl p-8 border border-[#EDE5E1] shadow-soft flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#2A1728]">Free</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="serif-title text-4xl font-extrabold text-[#2A1728]">$0</span>
                  </div>
                  <p className="text-xs text-[#7A6E77] mt-1">Free forever for exploring roles.</p>
                  <ul className="mt-6 space-y-3 text-xs text-[#4E414B]">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Basic CV analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Limited AI job feeds
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Basic application tracking
                    </li>
                  </ul>
                </div>
                <Link
                  href="/auth?tab=signup"
                  className="mt-8 w-full py-2.5 rounded-full border border-[#2A1728] text-xs font-bold text-[#2A1728] hover:bg-[#2A1728] hover:text-white transition-colors text-center"
                >
                  Get started
                </Link>
              </div>
              {/* Plus Plan (Popular) */}
              <div className="bg-[#FAF6F2] rounded-2xl p-8 border-2 border-[#E05347] shadow-xl relative flex flex-col justify-between">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E05347] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                  Most Popular
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#2A1728]">Plus</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="serif-title text-4xl font-extrabold text-[#2A1728]">$9.99</span>
                    <span className="text-xs text-[#7A6E77] ml-1">/month</span>
                  </div>
                  <p className="text-xs text-[#7A6E77] mt-1">Accelerate your daily applications.</p>
                  <ul className="mt-6 space-y-3 text-xs text-[#4E414B]">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#E05347] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Everything in Free
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#E05347] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Unlimited AI tailored CVs
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#E05347] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Personal email sync (Gmail/Outlook)
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#E05347] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Interview simulation module
                    </li>
                  </ul>
                </div>
                <Link
                  href="/auth?tab=signup&plan=plus"
                  className="mt-8 w-full py-2.5 rounded-full bg-[#E05347] hover:bg-[#C94136] text-xs font-bold text-white transition-all shadow-md text-center"
                >
                  Start 7-day trial
                </Link>
              </div>
              {/* Pro Plan */}
              <div className="bg-white rounded-2xl p-8 border border-[#EDE5E1] shadow-soft flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#2A1728]">Pro</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="serif-title text-4xl font-extrabold text-[#2A1728]">$19.99</span>
                    <span className="text-xs text-[#7A6E77] ml-1">/month</span>
                  </div>
                  <p className="text-xs text-[#7A6E77] mt-1">Maximum advantage for intensive searches.</p>
                  <ul className="mt-6 space-y-3 text-xs text-[#4E414B]">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Everything in Plus
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Direct Recruiter Insights
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                      Priority 1-on-1 human review
                    </li>
                  </ul>
                </div>
                <Link
                  href="/auth?tab=signup&plan=pro"
                  className="mt-8 w-full py-2.5 rounded-full border border-[#2A1728] text-xs font-bold text-[#2A1728] hover:bg-[#2A1728] hover:text-white transition-colors text-center"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>
        {/* END: PricingPreviewSection */}

        {/* BEGIN: CTASection */}
        <section className="py-20 bg-gradient-to-br from-[#2A1728] via-[#3B1F37] to-[#1E0F1D] text-white relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#E05347]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
            <h2 className="serif-title text-4xl sm:text-5xl font-bold tracking-tight">Ready to make your next move?</h2>
            <p className="text-base sm:text-lg text-[#D5CBD3] max-w-xl mx-auto font-normal">
              Join thousands of university graduates and professionals finding their dream career opportunities with Jobora AI.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E05347] hover:bg-[#C94136] text-white text-base font-semibold px-8 py-3.5 rounded-full transition-all duration-200 shadow-lg hover:scale-105"
                href="/dashboard"
              >
                <span>Get started free today</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </Link>
              <Link
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-white/20 hover:bg-white/10 text-white text-base font-semibold transition-colors"
                href="/email-composer"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
        {/* END: CTASection */}
      </main>
      {/* END: MainContent */}

      {/* BEGIN: MainFooter */}
      <footer className="bg-[#FAF6F2] border-t border-[#EFE7E1] pt-16 pb-12 text-[#685B64]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12">
            {/* Brand Info */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E05347] via-[#942C52] to-[#2A1728] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#FAF6F2]"></div>
                </div>
                <span className="text-xl font-bold tracking-tight text-[#2A1728]">
                  Jobora <span className="text-[#E05347]">AI</span>
                </span>
              </div>
              <p className="text-sm max-w-sm text-[#7A6C76]">
                The AI-powered career copilot that matches your potential with opportunities worldwide.
              </p>
              <div className="pt-2 text-xs text-[#8F818B]">© {new Date().getFullYear()} Jobora AI Inc. All rights reserved.</div>
            </div>
            {/* Navigation Column 1: Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A1728] mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/jobs">
                    AI Job Search
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/cv-studio">
                    CV Studio
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/email-composer">
                    Email Dispatcher
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/interview">
                    Interview Prep
                  </Link>
                </li>
                <li>
                  <a className="hover:text-[#E05347] transition-colors" href="#pricing">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            {/* Navigation Column 2: Solutions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A1728] mb-4">Solutions</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/onboarding">
                    For Students
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/career-insights">
                    For Universities
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/career-insights">
                    For Career Changers
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/settings/integrations">
                    Enterprise
                  </Link>
                </li>
              </ul>
            </div>
            {/* Navigation Column 3: Legal & Support */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A1728] mb-4">Legal &amp; Help</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/settings">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/settings">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/settings/integrations">
                    Security
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#E05347] transition-colors" href="/email-composer">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          {/* Bottom Micro-Bar */}
          <div className="pt-8 border-t border-[#EDE5E1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8F818B] gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All AI services operating normally</span>
            </div>
            <div>
              <span>Designed with care for future leaders.</span>
            </div>
          </div>
        </div>
      </footer>
      {/* END: MainFooter */}

      {/* Video Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-[#2A1728]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#2A1728] rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-[#E05347] flex items-center justify-center transition-colors"
              type="button"
              aria-label="Close product tour modal"
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
                  <span className="inline-block px-3 py-1 rounded-full bg-[#E05347]/20 text-[#FF8A80] text-xs font-bold uppercase tracking-wider mb-4">
                    Interactive Product Walkthrough
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                    Experience Jobora AI Career Copilot
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base max-w-2xl mb-6">
                    Explore live job synchronization across Remotive &amp; Arbeitnow, tailor your CV with real-time keyword analysis, generate grounded cover letters, and practice technical interviews.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                      <div className="text-xs font-bold uppercase text-[#FF8A80] mb-1">Step 1 • Discover</div>
                      <div className="text-sm font-semibold">Live Multi-Source Jobs</div>
                      <p className="text-xs text-white/70 mt-1">Match scores computed transparently against your skills.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                      <div className="text-xs font-bold uppercase text-[#FF8A80] mb-1">Step 2 • Tailor</div>
                      <div className="text-sm font-semibold">CV &amp; Cover Letter Studio</div>
                      <p className="text-xs text-white/70 mt-1">Upload PDF/DOCX, review diffs, and export clean documents.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                      <div className="text-xs font-bold uppercase text-[#FF8A80] mb-1">Step 3 • Execute</div>
                      <div className="text-sm font-semibold">Application &amp; Interview Prep</div>
                      <p className="text-xs text-white/70 mt-1">Track every stage on a Kanban board and run STAR mock sessions.</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowVideoModal(false)}
                    className="px-6 py-3 rounded-full bg-[#E05347] hover:bg-[#D84F48] text-white text-sm font-semibold transition-all"
                  >
                    Launch Live Workspace →
                  </Link>
                  <Link
                    href="/jobs"
                    onClick={() => setShowVideoModal(false)}
                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
                  >
                    Browse Live Jobs
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
