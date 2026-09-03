'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';

const SPOKES = 10;
const RING_SEGMENTS = 160;
const OUTER_RADIUS = 1.55;
const INNER_RADIUS = 0.42;

interface CompassProps {
  /** Index of the dimension the reader is currently on, or -1 for none. */
  active: number;
}

function ringGeometry(radius: number, segments: number): THREE.BufferGeometry {
  const points: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

/** Angle of spoke `i`, measured from twelve o'clock, running clockwise. */
function spokeAngle(index: number): number {
  return Math.PI / 2 - (index / SPOKES) * Math.PI * 2;
}

/**
 * Compass — ten spokes, one per fit dimension, drawn as a navigational
 * instrument rather than a scorecard.
 *
 * Every spoke is exactly the same length, and that is the point. A radar chart
 * would need ten self-assigned scores to give it a shape, and the section's
 * whole argument is that a self-assigned number is not evidence. So the
 * instrument shows bearing, not magnitude: the spoke for whichever dimension
 * the reader is on lights up and the rose turns to bring it to top-centre.
 *
 * Renders inside the shared GL stage — see components/gl/GLStage.tsx.
 */
export default function Compass({ active }: CompassProps) {
  const group = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);

  const geometries = useMemo(() => {
    const outer = ringGeometry(OUTER_RADIUS, RING_SEGMENTS);
    const inner = ringGeometry(INNER_RADIUS, RING_SEGMENTS);

    // Ten spokes from the inner ring to the outer.
    const spokePoints: number[] = [];
    for (let i = 0; i < SPOKES; i++) {
      const theta = spokeAngle(i);
      spokePoints.push(
        Math.cos(theta) * INNER_RADIUS,
        Math.sin(theta) * INNER_RADIUS,
        0,
        Math.cos(theta) * OUTER_RADIUS,
        Math.sin(theta) * OUTER_RADIUS,
        0,
      );
    }
    const spokes = new THREE.BufferGeometry();
    spokes.setAttribute('position', new THREE.Float32BufferAttribute(spokePoints, 3));

    // Minor graduations between the spokes: the marks that make an instrument
    // read as measured rather than drawn.
    const tickPoints: number[] = [];
    for (let i = 0; i < SPOKES * 5; i++) {
      const theta = Math.PI / 2 - (i / (SPOKES * 5)) * Math.PI * 2;
      const r0 = OUTER_RADIUS + 0.035;
      const r1 = OUTER_RADIUS + (i % 5 === 0 ? 0.13 : 0.06);
      tickPoints.push(
        Math.cos(theta) * r0,
        Math.sin(theta) * r0,
        0,
        Math.cos(theta) * r1,
        Math.sin(theta) * r1,
        0,
      );
    }
    const ticks = new THREE.BufferGeometry();
    ticks.setAttribute('position', new THREE.Float32BufferAttribute(tickPoints, 3));

    return { outer, inner, spokes, ticks };
  }, []);

  // The lit spoke is its own two-point geometry so it can carry a brighter
  // material without a second pass over the whole instrument.
  const activeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Array(6).fill(0), 3));
    return geometry;
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;

    // Bring the active spoke to top-centre; with none selected, drift slowly.
    if (active >= 0) {
      targetRotation.current = -spokeAngle(active) + Math.PI / 2;
    } else {
      targetRotation.current -= delta * 0.045;
    }
    const current = group.current.rotation.z;
    let delta_ = targetRotation.current - current;
    // Take the short way round.
    while (delta_ > Math.PI) delta_ -= Math.PI * 2;
    while (delta_ < -Math.PI) delta_ += Math.PI * 2;
    group.current.rotation.z = current + delta_ * Math.min(delta * 2.4, 1);

    // A breath of tilt, tied to the pointer, so the instrument sits in space
    // rather than on the page.
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      state.pointer.y * 0.16,
      Math.min(delta * 1.5, 1),
    );
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      state.pointer.x * 0.2,
      Math.min(delta * 1.5, 1),
    );

    const position = activeGeometry.getAttribute('position') as THREE.BufferAttribute;
    if (active >= 0) {
      const theta = spokeAngle(active);
      position.setXYZ(0, Math.cos(theta) * INNER_RADIUS, Math.sin(theta) * INNER_RADIUS, 0.001);
      position.setXYZ(1, Math.cos(theta) * (OUTER_RADIUS + 0.13), Math.sin(theta) * (OUTER_RADIUS + 0.13), 0.001);
    } else {
      position.setXYZ(0, 0, 0, 0);
      position.setXYZ(1, 0, 0, 0);
    }
    position.needsUpdate = true;
  });

  return (
    <>
      {/* The instrument is line work only: no lighting, no materials to tune,
          nothing that can render differently between two GPUs. */}
      <group ref={group}>
        <lineLoop geometry={geometries.outer}>
          <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.42} />
        </lineLoop>
        <lineLoop geometry={geometries.inner}>
          <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.22} />
        </lineLoop>
        <lineSegments geometry={geometries.spokes}>
          <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.3} />
        </lineSegments>
        <lineSegments geometry={geometries.ticks}>
          <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.18} />
        </lineSegments>
        <lineSegments geometry={activeGeometry}>
          <lineBasicMaterial color={PALETTE.white} transparent opacity={0.95} />
        </lineSegments>
      </group>
    </>
  );
}
