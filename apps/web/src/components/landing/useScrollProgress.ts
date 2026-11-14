'use client';

import { useEffect, useRef } from 'react';

/**
 * Writes how far a tall section has been scrolled through as a CSS variable
 * `--p` (0 when its top reaches the top of the screen, 1 when its bottom
 * reaches the bottom). Styles read `var(--p)`, so scrolling never re-renders.
 *
 * With reduced motion the value is pinned at 1 — the finished state.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1');
      el.dataset.step = '3';
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 1;
      el.style.setProperty('--p', p.toFixed(4));
      // Discrete steps let captions switch without React state.
      el.dataset.step = String(p < 0.3 ? 1 : p < 0.65 ? 2 : 3);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return ref;
}
