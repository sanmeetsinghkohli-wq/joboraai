import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EASE, samplePose } from '../keyframes';
import { scrollState } from '../scroll-state';
import Particles from './Particles';
import InkBackdrop from './InkBackdrop';
import ResumeMesh from './ResumeMesh';
import { createResumeMaterial, RESUME_H, RESUME_W } from './resumeMaterial';
import type { SceneShared } from './shared';
import {
  drawLayer,
  drawResumeBack,
  drawResumeFront,
  LAYER_DESIGN_H,
  LAYER_DESIGN_W,
  RESUME_DESIGN_H,
  RESUME_DESIGN_W,
  whenFontsReady,
} from './textures';

const D2R = Math.PI / 180;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type LayerKind = 'ats' | 'keywords' | 'bullets';
const LAYER_KINDS: LayerKind[] = ['ats', 'keywords', 'bullets'];

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, maxAniso: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAniso);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  const redraw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    draw(ctx);
    texture.needsUpdate = true;
  };
  return { texture, redraw };
}

function radialTexture(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** All scene content (rendered inside the Canvas). */
export default function ResumeScene() {
  const shared = useRef<SceneShared>({
    p: scrollState.progress,
    pose: samplePose(scrollState.progress),
    worldPos: new THREE.Vector3(),
    time: 0,
  });
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const layerRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const halo = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const ptr = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  const res = useMemo(() => {
    const max = 8;
    const front = canvasTexture(RESUME_DESIGN_W, RESUME_DESIGN_H, (c) => drawResumeFront(c, RESUME_DESIGN_W, RESUME_DESIGN_H), max);
    const back = canvasTexture(RESUME_DESIGN_W, RESUME_DESIGN_H, (c) => drawResumeBack(c, RESUME_DESIGN_W, RESUME_DESIGN_H), max);
    const layers = LAYER_KINDS.map((k) =>
      canvasTexture(LAYER_DESIGN_W, LAYER_DESIGN_H, (c) => drawLayer(c, LAYER_DESIGN_W, LAYER_DESIGN_H, k), max),
    );
    const resumeMat = createResumeMaterial(front.texture, back.texture);
    const layerMats = layers.map((l) => createResumeMaterial(l.texture, l.texture, { transparent: true }));
    const layerGeo = new THREE.PlaneGeometry(1.9, 1.0, 24, 40);
    const haloTex = radialTexture(256, [
      [0, 'rgba(224,83,71,0.35)'],
      [0.45, 'rgba(247,206,186,0.18)'],
      [1, 'rgba(247,206,186,0)'],
    ]);
    const haloGeo = new THREE.PlaneGeometry(RESUME_W * 1.8, RESUME_H * 1.8);
    const haloMat = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
    const shadowTex = radialTexture(128, [
      [0, 'rgba(42,23,40,1)'],
      [1, 'rgba(42,23,40,0)'],
    ]);
    const shadowGeo = new THREE.PlaneGeometry(2.4, 0.5);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
    return { front, back, layers, resumeMat, layerMats, layerGeo, haloTex, haloGeo, haloMat, shadowTex, shadowGeo, shadowMat };
  }, []);

  // Redraw once fonts are available, then upload again.
  useEffect(() => {
    let alive = true;
    whenFontsReady().then(() => {
      if (!alive) return;
      res.front.redraw();
      res.back.redraw();
      res.layers.forEach((l) => l.redraw());
    });
    return () => {
      alive = false;
    };
  }, [res]);

  useEffect(
    () => () => {
      res.front.texture.dispose();
      res.back.texture.dispose();
      res.layers.forEach((l) => l.texture.dispose());
      res.resumeMat.dispose();
      res.layerMats.forEach((m) => m.dispose());
      res.layerGeo.dispose();
      res.haloTex.dispose();
      res.haloGeo.dispose();
      res.haloMat.dispose();
      res.shadowTex.dispose();
      res.shadowGeo.dispose();
      res.shadowMat.dispose();
    },
    [res],
  );

  // Pointer tilt source (window listener; the canvas itself is pointer-events:none).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, dt) => {
    const sh = shared.current;
    const d = Math.min(dt, 0.1);
    const target = scrollState.progress;
    sh.p += (target - sh.p) * (1 - Math.exp(-d * 10));
    if (Math.abs(target - sh.p) < 1e-5) sh.p = target;
    const t = state.clock.elapsedTime;
    sh.time = t;
    const pose = samplePose(sh.p);
    sh.pose = pose;

    // pointer tilt: hero only
    const heroW = 1 - sstep(0.08, 0.12, sh.p);
    const k = 1 - Math.exp(-d * 6);
    ptr.current.sx += (ptr.current.x * heroW - ptr.current.sx) * k;
    ptr.current.sy += (ptr.current.y * heroW - ptr.current.sy) * k;

    const fl = 1 - pose.fold;
    const y = pose.pos[1] + pose.float * Math.sin(t * Math.PI * 2 * 0.25);
    const rz = pose.rot[2] + 1.5 * Math.sin(t * Math.PI * 2 * 0.17) * fl;
    const g = group.current;
    if (g) {
      g.position.set(pose.pos[0], y, pose.pos[2]);
      g.rotation.set(
        (pose.rot[0] + ptr.current.sy * 6) * D2R,
        (pose.rot[1] + ptr.current.sx * 6) * D2R,
        rz * D2R,
        'XYZ',
      );
      g.scale.setScalar(pose.scale);
      sh.worldPos.set(pose.pos[0], y, pose.pos[2]);
    }

    const m = res.resumeMat.uniforms;
    m.uTwist.value = pose.twist * D2R;
    m.uBend.value = pose.bend;
    m.uFold.value = pose.fold;
    m.uGlow.value = pose.glow;
    m.uTime.value = t;

    // peel layers
    for (let i = 0; i < 3; i++) {
      const lm = layerRefs.current[i];
      if (!lm) continue;
      const li = EASE.outCubic(clamp01((pose.peel - 0.15 * i) / 0.7));
      lm.visible = li > 0.001;
      if (!lm.visible) continue;
      const restY = 0.9 - 0.9 * i;
      lm.position.set(
        lerp(0, -(1.1 + 0.15 * i), li),
        lerp(restY, 1.0 - 1.0 * i, li),
        lerp(0.002, 0.35 + 0.3 * i, li),
      );
      lm.rotation.set(0, 0, (-4 + 4 * i) * D2R * li);
      const u = res.layerMats[i].uniforms;
      u.uCurl.value = Math.sin(Math.PI * li);
      u.uCurlC.value = -0.5 + li; // mix(-h/2, h/2, li), h = 1.0
      u.uAlpha.value = sstep(0, 0.15, li);
      u.uGlow.value = pose.glow;
      u.uTime.value = t;
    }

    if (halo.current) {
      const o = pose.glow * 0.6;
      halo.current.visible = o > 0.005;
      res.haloMat.opacity = o;
    }
    if (shadow.current) {
      const o = 0.16 * (1 - pose.fold);
      shadow.current.visible = o > 0.003;
      res.shadowMat.opacity = o;
      shadow.current.position.set(pose.pos[0], -1.9, pose.pos[2]);
      shadow.current.scale.setScalar(pose.scale);
    }
  });

  return (
    <>
      <InkBackdrop shared={shared} />
      <Particles shared={shared} />
      <mesh ref={shadow} geometry={res.shadowGeo} material={res.shadowMat} frustumCulled={false} />
      <group ref={group}>
        <mesh ref={halo} geometry={res.haloGeo} material={res.haloMat} position={[0, 0, -0.3]} frustumCulled={false} />
        <ResumeMesh ref={mesh} material={res.resumeMat} />
        {LAYER_KINDS.map((k, i) => (
          <mesh
            key={k}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            geometry={res.layerGeo}
            material={res.layerMats[i]}
            visible={false}
            frustumCulled={false}
          />
        ))}
      </group>
    </>
  );
}
