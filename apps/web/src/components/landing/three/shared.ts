import * as THREE from 'three';
import type { ResumePose } from '../keyframes';

/** Per-frame values written by ResumeScene and read by Particles / InkBackdrop. No React state. */
export interface SceneShared {
  p: number; // smoothed progress
  pose: ResumePose;
  worldPos: THREE.Vector3; // resume centre in world space
  time: number;
}
