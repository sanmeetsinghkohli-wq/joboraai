import { forwardRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RESUME_H, RESUME_W } from './resumeMaterial';

interface Props {
  material: THREE.ShaderMaterial;
}

/** PlaneGeometry(2.1, 2.97, 64, 90) with the resume material. */
const ResumeMesh = forwardRef<THREE.Mesh, Props>(function ResumeMesh({ material }, ref) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(RESUME_W, RESUME_H, 64, 90), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
});

export default ResumeMesh;
