'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tilts its child in 3D toward the pointer.
 *
 * Writes two CSS variables on the element instead of React state, so pointer
 * movement never re-renders. Disabled for touch pointers and when the user
 * prefers reduced motion.
 */
export function Tilt({
  children,
  className,
  max = 8,
  lift = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  max?: number;
  /** translateZ in px applied while hovered. */
  lift?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const set = (rx: number, ry: number, z: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        el.style.setProperty('--tz', `${z}px`);
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      set(-py * max * 2, px * max * 2, lift);
    };
    const onLeave = () => set(0, 0, 0);

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max, lift]);

  return (
    <div className={cn('[perspective:1000px]', className)}>
      <div
        ref={ref}
        className="preserve-3d h-full transition-transform duration-200 ease-out will-change-transform [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_translateZ(var(--tz,0px))]"
      >
        {children}
      </div>
    </div>
  );
}
