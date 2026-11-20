'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { downgradeTier } from '../use-render-tier';
import { subscribe } from '../scroll-state';
import ResumeScene from './ResumeScene';

interface Props {
  /** Called on webglcontextlost. Defaults to downgradeTier('css'). */
  onContextLost?: () => void;
  /** Called after fps stays below 45 for more than 3 s. Defaults to downgradeTier('css'). */
  onLowFps?: () => void;
}

/** Counts fps once per second; sustained < 45 fps for 3 s (after dpr is already 1) triggers onLowFps. */
function FpsWatch({ lowDpr, onLowFps }: { lowDpr: boolean; onLowFps: () => void }) {
  const s = useRef({ frames: 0, t: 0, low: 0 });
  useFrame((_, dt) => {
    const w = s.current;
    w.frames++;
    w.t += dt;
    if (w.t >= 1) {
      const fps = w.frames / w.t;
      w.frames = 0;
      w.t = 0;
      if (lowDpr && fps < 45) {
        w.low++;
        if (w.low > 3) onLowFps();
      } else w.low = 0;
    }
  });
  return null;
}

export default function ResumeCanvas({ onContextLost, onLowFps }: Props) {
  const [lowDpr, setLowDpr] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lowFps = onLowFps ?? (() => downgradeTier('css'));
  const ctxLost = onContextLost ?? (() => downgradeTier('css'));

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    const unsub = subscribe((p) => {
      const atEnd = p >= 0.999;
      if (atEnd && !doneRef.current && !timer.current) {
        timer.current = setTimeout(() => {
          timer.current = null;
          doneRef.current = true;
          setDone(true);
        }, 1500);
      } else if (!atEnd) {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
        if (doneRef.current) {
          doneRef.current = false;
          setDone(false);
        }
      }
    });
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <Canvas
      aria-hidden="true"
      frameloop={hidden || done ? 'never' : 'always'}
      dpr={lowDpr ? 1 : [1, 1.75]}
      camera={{ fov: 30, position: [0, 0, 9], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault();
            ctxLost();
          },
          { once: true },
        );
      }}
    >
      <PerformanceMonitor onDecline={() => setLowDpr(true)} />
      <FpsWatch lowDpr={lowDpr} onLowFps={lowFps} />
      <ResumeScene />
    </Canvas>
  );
}
