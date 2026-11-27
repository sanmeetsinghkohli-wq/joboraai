import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bez, headingOf } from '../flight';
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
const AX_X = new THREE.Vector3(1, 0, 0);
const AX_Y = new THREE.Vector3(0, 1, 0);
const AX_Z = new THREE.Vector3(0, 0, 1);

const _e = new THREE.Euler();
const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _o = [0, 0, 0, 0];
const _o1 = [0, 0, 0, 0];
const _o2 = [0, 0, 0, 0];

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
    fly: 0,
  });
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const layerRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const halo = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const ptr = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const targetEl = useRef<Element | null>(null);

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
    // Responsive layout: derive world-space extents at the resume's depth from the live camera.
    const cam = state.camera as THREE.PerspectiveCamera;
    const tanH = Math.tan((cam.fov * D2R) / 2);
    const aspect = state.size.width / Math.max(1, state.size.height);
    const dist = Math.max(1, cam.position.z - pose.pos[2]);
    const vw = 2 * tanH * dist * aspect; // visible width at the resume's depth
    const respScale = Math.min(1, aspect / 1.6); // visible width relative to 1440x900
    // peel amount (0..1) widens the left extent of the group
    let peelAmt = 0;
    for (let i = 0; i < 3; i++) peelAmt = Math.max(peelAmt, EASE.outCubic(clamp01((pose.peel - 0.15 * i) / 0.7)));
    const leftExt = lerp(RESUME_W / 2, 1.71, peelAmt);
    const rightExt = RESUME_W / 2;
    let S = pose.scale * respScale;
    let px: number;
    if (aspect < 0.9) {
      // Portrait phones: the scene is a background behind the text, so centre the
      // resume and size it to about 70% of the screen width.
      S = Math.min(pose.scale, (0.7 * vw) / (leftExt + rightExt));
      px = 0;
    } else if (pose.pos[0] > 0) {
      // right-hand slot: 57%..95% of screen width (offsets from centre, as fractions of vw)
      const slotL = 0.07 * vw;
      const slotR = 0.45 * vw;
      S = Math.min(S, (slotR - slotL) / (leftExt + rightExt));
      const desired = (pose.pos[0] * 0.26) / 1.6 * vw;
      px = Math.min(slotR - rightExt * S, Math.max(slotL + leftExt * S, desired));
    } else {
      // left-column pose (pricing): keep the same fraction of the visible width
      px = (pose.pos[0] / (2 * tanH * dist * 1.6)) * vw;
    }
    const y = pose.pos[1] + pose.float * Math.sin(t * Math.PI * 2 * 0.25);
    const rz = pose.rot[2] + 1.5 * Math.sin(t * Math.PI * 2 * 0.17) * fl;
    const g = group.current;
    const fly = pose.fly;
    sh.fly = fly;
    if (g) {
      let gx = px;
      let gy = y;
      let gs = S;
      // Roll about the nose axis: swings out wide while the sheet is folded in half (so the fin reads instead of
      // being seen edge-on), then settles to a 3/4 view where the print on the wings and the fin both show.
      const foldT = sstep(0.4, 0.95, pose.fold);
      const bankBase = -0.35 * foldT - 0.75 * Math.sin(Math.PI * foldT) * Math.sin(Math.PI * foldT);
      if (fly <= 1e-4) {
        _e.set((pose.rot[0] + ptr.current.sy * 6) * D2R, (pose.rot[1] + ptr.current.sx * 6) * D2R, rz * D2R, 'XYZ');
        g.quaternion.setFromEuler(_e);
        g.quaternion.multiply(_qa.setFromAxisAngle(AX_Y, bankBase));
      } else {
        // Flight: cubic bezier in screen px from the slot to just right of the [data-plane-target] button.
        // Up first, then a long sweep in from the right, so it never crosses the left text column.
        const Wp = state.size.width;
        const Hp = state.size.height;
        const pxw = (2 * tanH * dist) / Hp; // world units per css px at the resume's depth
        const lenPx = Math.min(170, Math.max(110, 0.16 * Hp));
        const S1 = (lenPx * pxw) / RESUME_H;
        if (!targetEl.current || !targetEl.current.isConnected) targetEl.current = document.querySelector('[data-plane-target]');
        let tx = Wp * 0.4;
        let ty = Hp * 0.7;
        if (targetEl.current) {
          const r = targetEl.current.getBoundingClientRect();
          tx = r.right + 26 + lenPx * 0.48;
          ty = r.top + r.height / 2 + 2;
        }
        tx = Math.min(tx, Wp - 12 - lenPx * 0.5);
        const P0 = [Wp / 2 + px / pxw, Hp / 2 - y / pxw];
        const P1 = [P0[0], P0[1] - 0.3 * Hp];
        const P3 = [tx, ty];
        const P2 = [tx + 0.28 * Wp, ty + 0.02 * Hp];
        const u = fly;
        bez(P0, P1, P2, P3, u, _o);
        const th = headingOf(_o[2], _o[3]);
        const u1 = Math.max(0, u - 0.03);
        const u2 = Math.min(1, u + 0.03);
        bez(P0, P1, P2, P3, u1, _o1);
        bez(P0, P1, P2, P3, u2, _o2);
        const rate = (headingOf(_o2[2], _o2[3]) - headingOf(_o1[2], _o1[3])) / Math.max(1e-4, u2 - u1);
        const env = sstep(0, 0.12, u) * (1 - sstep(0.85, 1, u));
        const land = sstep(0.96, 1, u);
        const bank = bankBase - Math.min(0.45, Math.max(-0.45, rate * 0.2)) * env + 0.05 * Math.sin(t * 1.3) * land;
        const tilt = (-20 - 8 * Math.sin(Math.PI * u) + 5 * sstep(0.7, 1, u)) * D2R;
        g.quaternion.setFromAxisAngle(AX_Z, th);
        g.quaternion.multiply(_qa.setFromAxisAngle(AX_X, tilt));
        g.quaternion.multiply(_qb.setFromAxisAngle(AX_Y, bank));
        gx = (_o[0] - Wp / 2) * pxw;
        gy = -(_o[1] - Hp / 2) * pxw + 0.02 * land * Math.sin(t * 1.8);
        gs = lerp(S, S1, sstep(0, 1, u));
      }
      g.position.set(gx, gy, pose.pos[2]);
      g.scale.setScalar(gs);
      sh.worldPos.set(gx, gy, pose.pos[2]);
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
      lm.scale.setScalar(lerp(1, 0.8, li));
      lm.position.set(
        lerp(0, -(0.75 + 0.1 * i), li),
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
      shadow.current.position.set(sh.worldPos.x, -1.9, pose.pos[2]);
      shadow.current.scale.setScalar(group.current ? group.current.scale.x : pose.scale);
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
