'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import { nebulaFBMVertex, nebulaFBMFragment } from '@/components/fx/shaders/nebulaFBM.glsl';

// --- Constants ---
const STAR_COUNT = 4500;
const DUST_COUNT = 60;
const STAR_SEED = 1337;
// Monochrome star palette (whites/greys, no hue) — sourced from lib/palette.ts
const STAR_COLORS = PALETTE.star.map((hex) => new THREE.Color(hex));

const logDebug = (message: string, data?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'production') return;
  console.debug('[SpaceScene]', message, data ?? {});
};

const mulberry32 = (a: number) => {
  return () => {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

// --- Nebula Component ---
interface NebulaCloudProps {
  position: [number, number, number];
  color: string;
  scale: [number, number, number];
  frozen: boolean;
}

function NebulaCloud({ position, color, scale }: NebulaCloudProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        args={[
          {
            uniforms,
            vertexShader: nebulaFBMVertex,
            fragmentShader: nebulaFBMFragment,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
          },
        ]}
      />
    </mesh>
  );
}

// --- Shooting Star Component ---
interface ShootingStarProps {
  frozen: boolean;
}

function ShootingStar({ frozen }: ShootingStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const { viewport } = useThree();

  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const timer = useRef(0);
  const nextSpawnTime = useRef(Math.random() * 5 + 3);

  useFrame((_state, delta) => {
    timer.current += delta;

    if (!active) {
      if (timer.current > nextSpawnTime.current) {
        setActive(true);
        timer.current = 0;

        const x = (Math.random() - 0.5) * viewport.width * 1.5;
        const y = (Math.random() - 0.5) * viewport.height * 1.5;
        startPos.current.set(x, y, -Math.random() * 20);

        if (meshRef.current) {
          meshRef.current.position.copy(startPos.current);
        }

        velocity.current.set(
          (Math.random() - 0.5) * 20,
          -Math.random() * 10 - 10,
          0
        );

        nextSpawnTime.current = Math.random() * 5 + 3;
      }
    } else {
      if (meshRef.current) {
        meshRef.current.position.addScaledVector(velocity.current, delta);

        if (
          Math.abs(meshRef.current.position.x) > viewport.width ||
          Math.abs(meshRef.current.position.y) > viewport.height
        ) {
          setActive(false);
        }
      }
    }
  });

  if (!active) return null;

  return (
    <Trail
      width={2}
      length={8}
      color={new THREE.Color(PALETTE.starGlow)}
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef} position={startPos.current}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={PALETTE.starGlow} toneMapped={false} />
      </mesh>
    </Trail>
  );
}

// --- Ambient Dust ---
interface DustFieldProps {
  frozen: boolean;
}

/**
 * Ambient floating dust: a sparse layer of additively-blended motes drifting near
 * the camera to seat the portrait/content in depth. Monochrome (steel grey), tiny,
 * and frozen under reduced motion.
 */
function DustField({ frozen }: DustFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, basePositions, drift] = useMemo(() => {
    const rand = mulberry32(STAR_SEED + 7);
    const positions = new Float32Array(DUST_COUNT * 3);
    const drift = new Float32Array(DUST_COUNT * 2);
    for (let i = 0; i < DUST_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (rand() - 0.5) * 60;
      positions[i3 + 1] = (rand() - 0.5) * 40;
      positions[i3 + 2] = -10 - rand() * 30; // close-ish, in front of the starfield
      drift[i * 2] = 0.3 + rand() * 0.5; // speed
      drift[i * 2 + 1] = rand() * Math.PI * 2; // phase
    }
    return [positions, positions.slice(), drift];
  }, []);

  useFrame((state) => {
    // Reduced-motion: no drift — the dust holds a single static frame.
    if (frozen || !pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let i = 0; i < DUST_COUNT; i++) {
      const i3 = i * 3;
      a[i3] = basePositions[i3] + Math.sin(t * drift[i * 2] * 0.2 + drift[i * 2 + 1]) * 1.2;
      a[i3 + 1] = basePositions[i3 + 1] + Math.cos(t * drift[i * 2] * 0.15 + drift[i * 2 + 1]) * 1.2;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.13}
        sizeAttenuation
        color={PALETTE.steel}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

// --- Enhanced StarField ---
interface StarFieldProps {
  frozen: boolean;
}

function StarField({ frozen }: StarFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  const [colors, baseColors, sizes, twinklePhase, twinkleSpeed, initialPositions] = useMemo(() => {
    const rand = mulberry32(STAR_SEED);
    const initialPositions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const baseColors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const twinklePhase = new Float32Array(STAR_COUNT);
    const twinkleSpeed = new Float32Array(STAR_COUNT);

    const tempColor = new THREE.Color();

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const x = (rand() - 0.5) * 240;
      const y = (rand() - 0.5) * 240;
      const z = -40 - rand() * 180;

      initialPositions[i3] = x;
      initialPositions[i3 + 1] = y;
      initialPositions[i3 + 2] = z;

      const colorIndex = Math.floor(rand() * STAR_COLORS.length);
      tempColor.copy(STAR_COLORS[colorIndex]);
      const brightness = 0.4 + rand() * 0.6;

      baseColors[i3] = tempColor.r * brightness;
      baseColors[i3 + 1] = tempColor.g * brightness;
      baseColors[i3 + 2] = tempColor.b * brightness;

      colors[i3] = baseColors[i3];
      colors[i3 + 1] = baseColors[i3 + 1];
      colors[i3 + 2] = baseColors[i3 + 2];

      const depthFactor = 1 - Math.min(1, Math.abs(z) / 220);
      sizes[i] = 0.15 + rand() * 0.2 + depthFactor * 0.05;

      twinklePhase[i] = rand() * Math.PI * 2;
      twinkleSpeed[i] = 0.4 + rand() * 0.8;
    }

    return [colors, baseColors, sizes, twinklePhase, twinkleSpeed, initialPositions];
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mouseVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    // Reduced-motion: no twinkle, no drift, no mouse parallax — stars are static.
    if (frozen) return;
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const colorAttr = meshRef.current.geometry.getAttribute('color') as THREE.InstancedBufferAttribute;

    mouseVec.set(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    );

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const baseX = initialPositions[i3];
      const baseY = initialPositions[i3 + 1];
      const baseZ = initialPositions[i3 + 2];

      const depthFactor = 1 - Math.min(1, Math.abs(baseZ) / 220);
      const driftX = Math.sin(time * 0.12 + twinklePhase[i]) * 0.25 * depthFactor;
      const driftY = Math.cos(time * 0.15 + twinklePhase[i]) * 0.25 * depthFactor;
      const parallaxX = mouseVec.x * 0.12 * depthFactor;
      const parallaxY = mouseVec.y * 0.12 * depthFactor;

      const x = baseX + driftX + parallaxX;
      const y = baseY + driftY + parallaxY;
      const z = baseZ;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(sizes[i]);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const twinkle = 0.84 + Math.sin(time * twinkleSpeed[i] + twinklePhase[i]) * 0.3;
      if (colorAttr) {
        const array = colorAttr.array as Float32Array;
        array[i3] = baseColors[i3] * twinkle;
        array[i3 + 1] = baseColors[i3 + 1] * twinkle;
        array[i3 + 2] = baseColors[i3 + 2] * twinkle;
      }
    }

    if (colorAttr) {
      colorAttr.needsUpdate = true;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[0.15, 8, 8]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereGeometry>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.92}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/** Cinematic camera rig: eased elliptical camera drift. */
function CameraRig() {
  const { camera } = useThree();
  const { scrollYProgress } = useScroll();
  // Map full-page scroll progress to a bounded Y parallax offset.
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -2.4]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.05) * 1.1;
    camera.position.y = Math.cos(t * 0.04) * 0.7 + parallaxY.get();
    camera.lookAt(0, 0, -60);
  });

  return null;
}

// --- Main Scene ---
/**
 * @internal IPC bridge between SpaceScene and the modal FX layer (ModalFxCanvas /
 * FloatingDetailBox). Exposes the live three.js scene/camera/THREE handles on
 * `window.__portfolioSceneBridge__` for FX probes and the production audit. Renamed
 * from the generic, collision-prone `window.spaceApp` (OD-4).
 */
function PortfolioSceneBridge() {
  const { scene, camera } = useThree();
  const probeRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existing = (window as any).__portfolioSceneBridge__;
    const instance = { scene, camera, THREE };
    (window as any).__portfolioSceneBridge__ = instance;
    probeRef.current = instance;

    logDebug('Exposed __portfolioSceneBridge__ handle', {
      replacedExisting: Boolean(existing),
      sceneType: scene?.type ?? null,
      cameraType: camera?.type ?? null
    });

    return () => {
      if ((window as any).__portfolioSceneBridge__ === probeRef.current) {
        delete (window as any).__portfolioSceneBridge__;
      }
    };
  }, [scene, camera]);

  return null;
}

function SceneContent({ frozen = false }: { frozen?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame((_state, delta) => {
    if (frozen || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.05;
    groupRef.current.rotation.z += delta * 0.01;

    const targetTilt = Math.min(0.22, scrollRef.current * 0.00012);
    groupRef.current.rotation.x += (targetTilt - groupRef.current.rotation.x) * Math.min(1, delta * 2.5);
  });

  return (
    <group ref={groupRef}>
      <StarField />
      {/* Dark nebula colors — monochrome near-black palette (PALETTE.nebula), since mix-blend-mode: screen blows out brightness */}
      <NebulaCloud position={[0, 0, -50]} color={PALETTE.nebula[0]} scale={[100, 100, 1]} />
      <NebulaCloud position={[-30, 20, -80]} color={PALETTE.nebula[1]} scale={[120, 120, 1]} />
      <NebulaCloud position={[30, -20, -60]} color={PALETTE.nebula[2]} scale={[90, 90, 1]} />
      <ShootingStar />
      <ShootingStar />
    </group>
  );
}

export default function SpaceScene() {
  const [enablePostFx, setEnablePostFx] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const [hidden, setHidden] = useState(false);
  // DPR cap: full devices get [1, 1.5] for crisper bloom; low-power/reduced-motion
  // devices stay pinned at [1, 1] to protect the mobile FPS budget (NFR-FPS).
  const [maxDpr, setMaxDpr] = useState<[number, number]>([1, 1.5]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPowerDevice =
      (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) ||
      (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4);

    setFrozen(prefersReduced);
    setEnablePostFx(!(prefersReduced || lowPowerDevice));
    setMaxDpr(prefersReduced || lowPowerDevice ? [1, 1] : [1, 1.5]);
  }, []);

  // Pause the render loop while the tab is backgrounded (VFX-2 / NFR-FPS): a hidden
  // tab should never burn GPU/CPU on an invisible starfield.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Halt = reduced-motion freeze OR backgrounded tab. Both stop every useFrame loop
  // and drop the canvas to frameloop="demand" so no idle frames are scheduled.
  const halt = frozen || hidden;

  return (
    <div className="space-scene-layer" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ antialias: false, alpha: false }}
        dpr={maxDpr}
        frameloop={halt ? 'demand' : 'always'}
      >
        <PortfolioSceneBridge />
        <color attach="background" args={[PALETTE.black]} />

        {!halt && <CameraRig />}
        <SceneContent frozen={halt} />

        {enablePostFx && !frozen ? (
          <EffectComposer>
            {/* Strictly achromatic lens stack — no RGB-shift effects (e.g. ChromaticAberration),
                which would manufacture red/cyan hue on bloomed star edges and break monochrome (NN-4). */}
            <Bloom intensity={0.3} luminanceThreshold={0.22} luminanceSmoothing={0.25} mipmapBlur />
            <Noise opacity={0.015} />
            <Vignette eskil={false} offset={0.18} darkness={0.78} />
          </EffectComposer>
        ) : null}
      </Canvas>
    </div>
  );
}
