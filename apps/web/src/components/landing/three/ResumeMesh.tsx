import { forwardRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RESUME_H, RESUME_W } from './resumeMaterial';

interface Props {
  material: THREE.ShaderMaterial;
}

/**
 * PlaneGeometry(2.1, 2.97, 70, 99): square 0.03 cells (13.9k triangles) so the 45 deg dart creases run exactly
 * along vertex rows. The triangulation diagonal is mirrored on the right half so both slanted creases
 * (slope +1 left, -1 right) coincide with cell diagonals and come out straight.
 */
const ResumeMesh = forwardRef<THREE.Mesh, Props>(function ResumeMesh({ material }, ref) {
  const geometry = useMemo(() => {
    const NX = 70;
    const NY = 99;
    const g = new THREE.PlaneGeometry(RESUME_W, RESUME_H, NX, NY);
    const idx: number[] = [];
    const row = NX + 1;
    for (let iy = 0; iy < NY; iy++) {
      for (let ix = 0; ix < NX; ix++) {
        const a = ix + row * iy;
        const b = ix + row * (iy + 1);
        const c = ix + 1 + row * (iy + 1);
        const d = ix + 1 + row * iy;
        if (ix < NX / 2) idx.push(a, b, d, b, c, d);
        else idx.push(a, b, c, a, c, d);
      }
    }
    g.setIndex(idx);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
});

export default ResumeMesh;
