'use client';

import React, { useState } from 'react';
import { ScrollDriver } from '@/components/landing/ScrollDriver';
import { ResumeStage } from '@/components/landing/ResumeStage';
import { Header } from '@/components/landing/sections/Header';
import { Hero } from '@/components/landing/sections/Hero';
import { Features } from '@/components/landing/sections/Features';
import { HowItWorks } from '@/components/landing/sections/HowItWorks';
import { Pricing } from '@/components/landing/sections/Pricing';
import { Cta } from '@/components/landing/sections/Cta';
import { Footer } from '@/components/landing/sections/Footer';
import { VideoModal } from '@/components/landing/sections/VideoModal';

export default function LandingPage() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-rose-100 selection:text-rose-900 bg-[#FAF6F2] text-[#2A1728] font-sans overflow-x-clip">
      <ScrollDriver />
      <ResumeStage />
      <Header />
      <main className="relative z-10">
        <Hero onWatchTour={() => setShowVideoModal(true)} />
        <Features />
        <HowItWorks />
        <Pricing />
        <Cta />
      </main>
      <Footer />
      {showVideoModal && <VideoModal onClose={() => setShowVideoModal(false)} />}
    </div>
  );
}
