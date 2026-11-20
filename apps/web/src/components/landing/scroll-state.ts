import { useEffect, useRef, useState } from 'react';

export type SectionId = 'hero' | 'features' | 'how' | 'pricing' | 'cta';

export const SECTION_RANGES: Record<SectionId, [number, number]> = {
  hero: [0, 0.12],
  features: [0.12, 0.4],
  how: [0.4, 0.66],
  pricing: [0.66, 0.84],
  cta: [0.84, 1],
};

export const scrollState: { progress: number; velocity: number } = { progress: 0, velocity: 0 };

/** Set by ScrollDriver so overlays (the video modal) can pause smooth scrolling. */
export const scrollControl: { stop: () => void; start: () => void } = { stop: () => {}, start: () => {} };

const listeners = new Set<(p: number) => void>();

/** Only ScrollDriver calls this. */
export function setProgress(p: number, v: number): void {
  scrollState.progress = p;
  scrollState.velocity = v;
  listeners.forEach((fn) => fn(p));
}

export function subscribe(fn: (p: number) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function local(id: SectionId, p: number = scrollState.progress): number {
  const [a, b] = SECTION_RANGES[id];
  const t = (p - a) / (b - a);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * Section progress quantized to an integer step in 0..steps (floor(local/scale * steps), clamped).
 * State only changes when the step changes, so consumers re-render a handful of times, not every frame.
 */
export function useSectionStep(id: SectionId, steps: number, scale = 1): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const calc = () => Math.min(steps, Math.floor(Math.min(1, local(id) / scale) * steps));
    setValue(calc());
    return subscribe(() => setValue(calc()));
  }, [id, steps, scale]);
  return value;
}

/** rAF-throttled section progress for DOM consumers. */
export function useSectionProgress(id: SectionId): number {
  const [value, setValue] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const update = () => {
      raf.current = 0;
      setValue(local(id));
    };
    update();
    const unsub = subscribe(() => {
      if (!raf.current) raf.current = requestAnimationFrame(update);
    });
    return () => {
      unsub();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [id]);
  return value;
}
