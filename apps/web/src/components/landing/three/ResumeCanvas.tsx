'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { downgradeTier } from '../use-render-tier';
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
  const lowFps = onLowFps ?? (() => downgradeTier('css'));
  const ctxLost = onContextLost ?? (() => downgradeTier('css'));

  // The plane now stays on screen, parked beside the CTA button, so the loop keeps running (only hidden tabs pause).
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <Canvas
      aria-hidden="true"
      frameloop={hidden ? 'never' : 'always'}
      dpr={lowDpr ? 1 : [1, 1.75]}
      camera={{ fov: 30, position: [0, 0, 9], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            // r3f calls forceContextLoss() when the Canvas unmounts (React strict-mode double mount in dev):
            // that is not a real loss, and the element is already detached by the time the event fires.
            if (!gl.domElement.isConnected) return;
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
