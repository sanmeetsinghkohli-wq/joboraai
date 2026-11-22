'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { SECTION_RANGES, scrollControl, setProgress, type SectionId } from './scroll-state';
import { useRenderTier } from './use-render-tier';

const ORDER: SectionId[] = ['hero', 'features', 'how', 'pricing', 'cta'];

export function ScrollDriver() {
  const tier = useRenderTier();

  useEffect(() => {
    if (tier === 'static') {
      setProgress(0, 0);
      return;
    }

    // knots: [scrollY, progress], piecewise linear
    let knots: [number, number][] = [[0, 0]];
    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const measure = () => {
      const y = window.scrollY;
      const k: [number, number][] = [[0, 0]];
      for (const id of ORDER) {
        const el = document.querySelector<HTMLElement>(`[data-scroll-section="${id}"]`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + y;
        if (top > k[k.length - 1][0]) k.push([top, SECTION_RANGES[id][0]]);
      }
      const end = maxScroll();
      if (end > k[k.length - 1][0]) k.push([end, 1]);
      knots = k.length >= 2 ? k : [[0, 0], [end, 1]];
    };

    const map = (y: number): number => {
      if (y <= 0) return 0;
      for (let i = 0; i < knots.length - 1; i++) {
        const [y0, p0] = knots[i];
        const [y1, p1] = knots[i + 1];
        if (y <= y1) return p0 + ((y - y0) / (y1 - y0)) * (p1 - p0);
      }
      return 1;
    };

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const onScroll = () => {
      setProgress(map(lenis.scroll), lenis.velocity ?? 0);
    };
    lenis.on('scroll', onScroll);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    scrollControl.stop = () => lenis.stop();
    scrollControl.start = () => lenis.start();

    measure();
    onScroll();
    const remeasure = () => {
      measure();
      onScroll();
    };
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    window.addEventListener('resize', remeasure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', remeasure);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // gsap defaults
      scrollControl.stop = () => {};
      scrollControl.start = () => {};
      lenis.destroy();
    };
  }, [tier]);

  return null;
}

export default ScrollDriver;
