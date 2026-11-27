import { useEffect, useSyncExternalStore } from 'react';

export type RenderTier = 'webgl' | 'css' | 'static';

let override: RenderTier | null = null; // runtime downgrade
let resolved: RenderTier = 'static';
let ready = false; // true once the client has measured the environment
let narrow = false; // phones and tablets: normal-flow layout, 3D plays as a background
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

const RANK: Record<RenderTier, number> = { webgl: 2, css: 1, static: 0 };

let webglProbe: boolean | null = null;

function hasWebGL(): boolean {
  if (webglProbe !== null) return webglProbe;
  try {
    const c = document.createElement('canvas');
    const opts = { failIfMajorPerformanceCaveat: true };
    const gl = (c.getContext('webgl2', opts) || c.getContext('webgl', opts)) as WebGLRenderingContext | WebGL2RenderingContext | null;
    webglProbe = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}

function compute(): RenderTier {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static';
  if (!hasWebGL()) return 'css';
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return 'css';
  const cores = nav.hardwareConcurrency;
  const mem = nav.deviceMemory;
  // Phones usually report 6-8 cores and 4 GB; desktops need a little more headroom
  // because the scene is larger. The fps watchdog still downgrades a slow device.
  const phone = window.innerWidth < 1024;
  const minCores = phone ? 6 : 5;
  const minMem = phone ? 4 : 5;
  if ((cores && cores < minCores) || (mem !== undefined && mem < minMem)) return 'css';
  return 'webgl';
}

function apply(): void {
  const nowNarrow = window.innerWidth < 1024;
  if (nowNarrow !== narrow) {
    narrow = nowNarrow;
    emit();
  }
  let t = compute();
  if (override && RANK[override] < RANK[t]) t = override;
  if (t !== resolved) {
    resolved = t;
    emit();
  }
}

/** Lower the tier at runtime (fps drop, context loss). Never upgrades. */
export function downgradeTier(t: RenderTier): void {
  if (!override || RANK[t] < RANK[override]) override = t;
  apply();
}

let started = false;
function start(): void {
  if (started) return;
  started = true;
  ready = true;
  apply();
  emit(); // `ready` flipped even when the tier itself did not change
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener?.('change', apply);
  let wide = window.innerWidth >= 1024;
  window.addEventListener('resize', () => {
    const now = window.innerWidth >= 1024;
    if (now !== wide) {
      wide = now;
      apply();
    }
  });
}

const subscribeTier = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** 'static' on SSR and first client render, then resolves. */
export function useRenderTier(): RenderTier {
  useEffect(() => {
    start();
  }, []);
  return useSyncExternalStore(
    subscribeTier,
    () => resolved,
    () => 'static' as RenderTier,
  );
}

/**
 * True only when the reduced-motion 'static' tier has actually been resolved on the client.
 * SSR and the first client render are always false, so they use the scroll layout (no layout jump).
 */
export function useStaticLayout(): boolean {
  useEffect(() => {
    start();
  }, []);
  return useSyncExternalStore(
    subscribeTier,
    () => ready && (resolved === 'static' || narrow),
    () => false,
  );
}

/**
 * True on phones and tablets when the 3D CV and background are playing behind
 * the normal-flow layout. Sections then skip their inline CV pictures.
 */
export function useBackground3d(): boolean {
  useEffect(() => {
    start();
  }, []);
  return useSyncExternalStore(
    subscribeTier,
    () => ready && narrow && resolved !== 'static',
    () => false,
  );
}
