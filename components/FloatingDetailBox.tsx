'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { resumeContent } from '@/app/data/resumeContent';

declare global {
  interface Window {
    spaceApp: any;
    gsap: any;
  }
}

interface FloatingDetailBoxProps {
  activeKey: string | null;
  triggerRect: DOMRect | null;
  onClose: () => void;
  isLocked?: boolean;
}

const THEME_COLORS: Record<string, string> = {
  "Cloud Modernisation": "#ef4444", // Red
  "Realtime Reliability": "#f97316", // Orange
  "AI Quality & Risk": "#ef4444", // Red
  "Leadership Scale": "#f97316", // Orange
  "Strategic Alignment": "#06b6d4", // Cyan
  "Portfolio Value": "#10b981", // Emerald
};

const DEFAULT_COLOR = "#ff7350";

export default function FloatingDetailBox({ activeKey, triggerRect, onClose, isLocked = false }: FloatingDetailBoxProps) {
  const [displayKey, setDisplayKey] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  
  const threeObjectsRef = useRef<any[]>([]);
  const rafRef = useRef<number>();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  const content = useMemo(() => 
    displayKey ? resumeContent[displayKey as keyof typeof resumeContent] : null, 
    [displayKey]
  );

  const themeColor = useMemo(() => 
    displayKey ? (THEME_COLORS[displayKey] || DEFAULT_COLOR) : DEFAULT_COLOR,
    [displayKey]
  );

  useEffect(() => {
    if (activeKey) {
      setDisplayKey(activeKey);
      setIsExiting(false);
    } else if (displayKey && !activeKey) {
      setIsExiting(true);
    }
  }, [activeKey, displayKey]);

  // Three.js & Animation Logic
  useEffect(() => {
    if (!displayKey || !triggerRect || typeof window === 'undefined' || !window.spaceApp) return;

    const { scene, camera, THREE } = window.spaceApp;
    if (!scene || !camera || !THREE) return;

    // Use window.gsap if available (to share global instance/plugins), else fallback to imported
    const _gsap = window.gsap || gsap;

    const cleanup = () => {
      if (threeObjectsRef.current) {
        threeObjectsRef.current.forEach(obj => {
            if (scene) scene.remove(obj);
            
            // Dispose geometries and materials to prevent memory leaks
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m: any) => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            // Traverse children if any
            obj.traverse((child: any) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((m: any) => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
      }
    threeObjectsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timelineRef.current) timelineRef.current.kill();
    };

    cleanup(); 

    const ANIMATION_DURATION = 1.2;
    const BOX_W = 45;
    const BOX_H = 35;

    // --- Helper: Create Soft Glow Texture ---
    const createGlowTexture = () => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (context) {
            const gradient = context.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0,0, size, size);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    };
    const glowTexture = createGlowTexture();


    const getThreePos = (x: number, y: number, depth = -20) => {
      const vec = new THREE.Vector3();
      vec.set(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
        0.5
      );
      vec.unproject(camera);
      vec.sub(camera.position).normalize();
      const distance = (depth - camera.position.z) / vec.z;
      return new THREE.Vector3().copy(camera.position).add(vec.multiplyScalar(distance));
    };

    const startPos = getThreePos(
      triggerRect.left + triggerRect.width / 2,
      triggerRect.top + triggerRect.height / 2,
      -20
    );
    const endPos = getThreePos(window.innerWidth / 2, window.innerHeight / 2, -20);
    const midPos = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);

    // --- 1. Connection Line (Beam) ---
    const beamLen = startPos.distanceTo(endPos);
    
    // Inner White Core
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, beamLen, 8, 1, true); 
    beamGeo.rotateX(-Math.PI / 2); 
    const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.copy(midPos);
    beamMesh.lookAt(endPos);
    scene.add(beamMesh);
    threeObjectsRef.current.push(beamMesh);

    // Outer Colored Glow
    const beamGlowGeo = new THREE.CylinderGeometry(1.0, 1.0, beamLen, 12, 1, true);
    beamGlowGeo.rotateX(-Math.PI / 2);
    const beamGlowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(themeColor),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const beamGlowMesh = new THREE.Mesh(beamGlowGeo, beamGlowMat);
    beamGlowMesh.position.copy(midPos);
    beamGlowMesh.lookAt(endPos);
    scene.add(beamGlowMesh);
    threeObjectsRef.current.push(beamGlowMesh);

    // --- 2. Orbiting Star ---
    const starGroup = new THREE.Group();
    scene.add(starGroup);
    threeObjectsRef.current.push(starGroup);
    
    // Main orbiting star
    const starOrbiter = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    starGroup.add(starOrbiter);
    
    // Add a light to the star for effect
    const starLight = new THREE.PointLight(themeColor, 2, 20);
    starOrbiter.add(starLight);

    // Trail for Star
    const trailCount = 10;
    const trailMeshes: any[] = [];
    for(let i=0; i<trailCount; i++) {
        const t = new THREE.Mesh(
            new THREE.SphereGeometry(0.4 - (i*0.03), 8, 8),
            new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.6 - (i*0.06) })
        );
        starGroup.add(t);
        trailMeshes.push(t);
    }

    // --- 3. Floating Box Frame ---
    const frameGroup = new THREE.Group();
    frameGroup.position.copy(endPos);
    scene.add(frameGroup);
    threeObjectsRef.current.push(frameGroup);

    const edgeRadius = 0.25;
    const frameMat = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(themeColor),
        transparent: true, 
        opacity: 0 
    });
    
    // Construct Frame
    const topGeo = new THREE.CylinderGeometry(edgeRadius, edgeRadius, BOX_W, 8);
    topGeo.rotateZ(Math.PI / 2);
    const topMesh = new THREE.Mesh(topGeo, frameMat);
    topMesh.position.y = BOX_H / 2;
    frameGroup.add(topMesh);

    const botMesh = topMesh.clone();
    botMesh.position.y = -BOX_H / 2;
    frameGroup.add(botMesh);

    const sideGeo = new THREE.CylinderGeometry(edgeRadius, edgeRadius, BOX_H, 8);
    const leftMesh = new THREE.Mesh(sideGeo, frameMat);
    leftMesh.position.x = -BOX_W / 2;
    frameGroup.add(leftMesh);

    const rightMesh = leftMesh.clone();
    rightMesh.position.x = BOX_W / 2;
    frameGroup.add(rightMesh);
    
    // Corners
    const cornerGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const cornerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const corners = [
        new THREE.Vector3(-BOX_W/2, BOX_H/2, 0),
        new THREE.Vector3(BOX_W/2, BOX_H/2, 0),
        new THREE.Vector3(BOX_W/2, -BOX_H/2, 0),
        new THREE.Vector3(-BOX_W/2, -BOX_H/2, 0)
    ];
    corners.forEach(pos => {
        const c = new THREE.Mesh(cornerGeo, cornerMat);
        c.position.copy(pos);
        frameGroup.add(c);
    });

    frameGroup.scale.setScalar(0.8); 

    // --- 4. Particle Aggregation System ---
    const PARTICLE_COUNT = 600;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    const pOffsets = new Float32Array(PARTICLE_COUNT * 3); 
    const pSpeeds = new Float32Array(PARTICLE_COUNT);
    
    for(let i=0; i<PARTICLE_COUNT; i++) {
        const r = 40 * Math.cbrt(Math.random()); // Wider gathering radius
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const ox = r * Math.sin(phi) * Math.cos(theta);
        const oy = r * Math.sin(phi) * Math.sin(theta);
        const oz = r * Math.cos(phi);
        
        pOffsets[i*3] = ox;
        pOffsets[i*3+1] = oy;
        pOffsets[i*3+2] = oz;
        
        pPos[i*3] = startPos.x + ox;
        pPos[i*3+1] = startPos.y + oy;
        pPos[i*3+2] = startPos.z + oz;

        pSpeeds[i] = 0.5 + Math.random() * 0.8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    
    const pMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5, // Much larger particles for "Stardust" feel
        map: glowTexture, // Use soft texture
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);
    threeObjectsRef.current.push(particleSystem);

    // --- Animation Timeline ---
    const animState = { 
        gather: 0, 
        expand: 0,
        opacity: 0
    };
    
    const tl = _gsap.timeline({
      onComplete: () => {
        if (isExiting) {
          setDisplayKey(null);
          onClose();
        }
      }
    });
    timelineRef.current = tl;

    if (!isExiting) {
      tl.to(animState, { opacity: 1, duration: 0.2 })
        .to(animState, { gather: 1, duration: 0.5, ease: "power4.in" }, 0) // Fast implosion
        .to(animState, { expand: 1, duration: 1.0, ease: "elastic.out(1, 0.6)" }, "+=0.1"); // Materialize
    } else {
      animState.gather = 1;
      animState.expand = 1;
      animState.opacity = 1;
      tl.to(animState, { opacity: 0, duration: 0.3, ease: "power2.out" });
    }

    const startTime = Date.now();

    // --- Render Loop ---
    const loop = () => {
        const now = Date.now();
        const time = (now - startTime) * 0.001;
        const { gather, expand, opacity } = animState;
        
        // 1. Particles Update
        const positions = particleSystem.geometry.attributes.position.array;
        for(let i=0; i<PARTICLE_COUNT; i++) {
            const ox = pOffsets[i*3];
            const oy = pOffsets[i*3+1];
            const oz = pOffsets[i*3+2];
            
            // Implosion to startPos
            // Add a "swirl" effect during gather
            const swirl = gather * 2;
            const cx = Math.cos(swirl*pSpeeds[i]) * ox - Math.sin(swirl*pSpeeds[i]) * oy;
            const cy = Math.sin(swirl*pSpeeds[i]) * ox + Math.cos(swirl*pSpeeds[i]) * oy;
            
            let x = startPos.x + cx * (1 - gather);
            let y = startPos.y + cy * (1 - gather);
            let z = startPos.z + oz * (1 - gather);

            // Shoot along beam
            if (expand > 0.01) {
                const travel = expand * (1 + Math.sin(i*132)*0.3); // Randomize travel
                const beamPos = new THREE.Vector3(x,y,z).lerp(endPos, Math.min(1, travel));
                
                if (travel > 0.9) {
                    // Cloud around the box
                    const spreadFactor = (travel - 0.9) * 15;
                    beamPos.x += ox * 0.2 * spreadFactor;
                    beamPos.y += oy * 0.2 * spreadFactor;
                }
                
                x = beamPos.x;
                y = beamPos.y;
                z = beamPos.z;
            }
            
            positions[i*3] = x;
            positions[i*3+1] = y;
            positions[i*3+2] = z;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        pMat.opacity = opacity;

        // 2. Beam
        beamMat.opacity = opacity * expand * 0.9;
        beamGlowMat.opacity = opacity * expand * 0.5 + (Math.sin(time * 15) * 0.1);

        // 3. Orbiting Star
        if (expand > 0.1) {
            starGroup.visible = true;
            const loopTime = (time * 0.5) % 1;
            // Loop back and forth? No, just loop one way is cleaner
            const linePos = new THREE.Vector3().lerpVectors(startPos, endPos, loopTime);
            
            const orbitRadius = 3.0;
            const angle = time * 6;
            
            const vecSE = new THREE.Vector3().subVectors(endPos, startPos);
            const axis = vecSE.clone().normalize();
            let arbit = new THREE.Vector3(0,1,0);
            if (Math.abs(axis.dot(arbit)) > 0.9) arbit.set(1,0,0);
            const perp1 = new THREE.Vector3().crossVectors(axis, arbit).normalize();
            const perp2 = new THREE.Vector3().crossVectors(axis, perp1).normalize();
            
            const offset = new THREE.Vector3()
                .addScaledVector(perp1, Math.cos(angle) * orbitRadius)
                .addScaledVector(perp2, Math.sin(angle) * orbitRadius);
            
            const finalStarPos = linePos.add(offset);
            starOrbiter.position.copy(finalStarPos);
            
             for(let i=0; i<trailCount; i++) {
                const lagTime = time - (i+1)*0.04;
                const lLoop = (lagTime * 0.5) % 1;
                const lPos = new THREE.Vector3().lerpVectors(startPos, endPos, lLoop);
                const lAngle = lagTime * 6;
                const lOffset = new THREE.Vector3()
                    .addScaledVector(perp1, Math.cos(lAngle) * orbitRadius)
                    .addScaledVector(perp2, Math.sin(lAngle) * orbitRadius);
                trailMeshes[i].position.copy(lPos.add(lOffset));
             }
        } else {
            starGroup.visible = false;
        }

        // 4. Box
        if (expand > 0.01) {
            frameGroup.scale.setScalar(expand);
            frameMat.opacity = opacity * expand;
            cornerMat.opacity = opacity * expand;
            frameGroup.rotation.y = Math.sin(time * 0.3) * 0.08;
        } else {
            frameGroup.scale.setScalar(0.01);
        }

        rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return cleanup;
  }, [displayKey, isExiting, triggerRect, themeColor, onClose]); 

  const handleDismiss = () => { onClose(); };

  if (!displayKey || !content) return null;

  const pointerEventsClass = isLocked ? 'pointer-events-auto' : 'pointer-events-none';

  // FIXED CONTAINER: Solid glassmorphism to ensure readability
  const containerClasses = `
    p-0 rounded-2xl max-w-4xl w-full 
    ${pointerEventsClass} transition-all duration-700 transform
    ${!isExiting ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
  `;

  return (
    <div className={`fixed inset-0 z-[10002] flex items-center justify-center pointer-events-none`}>
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${!isExiting ? 'opacity-100' : 'opacity-0'} ${isLocked ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={handleDismiss}
        aria-label="Close detail view"
      ></div>

      <div 
        className={containerClasses}
      >
        {/* Main Card Body */}
        <div className="relative bg-[#050505]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        style={{ 
                 boxShadow: `0 0 50px ${themeColor}20`,
                 borderColor: `${themeColor}40`
             }}>
             
            {/* Color Accent Bar */}
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)` }}></div>

        {isLocked && (
            <button 
                onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-20"
            >
                    <i className="fas fa-times text-lg"></i>
            </button>
        )}

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[400px]">
                {/* Left Sidebar: Stats & Title */}
                <div className="p-8 bg-white/5 border-r border-white/5 flex flex-col justify-center relative overflow-hidden">
                    {/* Decorative massive number bg */}
                    <div className="absolute -right-4 -bottom-12 text-9xl font-black text-white/5 select-none z-0 pointer-events-none">
                        {content.stats.value.replace(/\D/g, '')}
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-xs font-mono tracking-[0.2em] uppercase mb-4 font-bold" style={{ color: themeColor }}>
                            {content.subtitle}
                        </p>
                        <h2 className="text-3xl font-bold text-white leading-tight mb-8">
                            {content.title}
                        </h2>
                        
                        <div>
                            <div className="text-5xl font-bold text-white tracking-tight" style={{ textShadow: `0 0 30px ${themeColor}60` }}>
                                {content.stats.value}
                            </div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider font-mono mt-2">
                                {content.stats.label}
                            </div>
                </div>
            </div>
        </div>

                {/* Right Content: Details */}
                <div className="p-10 flex flex-col justify-between bg-gradient-to-br from-white/5 to-transparent">
                    <div className="space-y-6 text-gray-200 text-lg font-light leading-relaxed">
            {content.details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-4 group animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-[0_0_10px_currentColor]" 
                                     style={{ color: themeColor, backgroundColor: themeColor }}></div>
                                <p className="group-hover:text-white transition-colors duration-200">{detail}</p>
                </div>
            ))}
        </div>
        
                    <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                             <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Source</span>
                             <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                <i className="fas fa-database text-[10px]"></i>
                                <span>VIKRAM_RESUME_V2.4.PDF</span>
                            </div>
                        </div>
                        
             <a href="/docs/Vik_Resume_Final.pdf" target="_blank" 
                            className="group flex items-center gap-3 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all"
                        >
                            <span className="text-sm font-medium text-white">View Full Document</span>
                            <i className="fas fa-arrow-right text-xs text-gray-400 group-hover:translate-x-1 transition-transform" style={{ color: themeColor }}></i>
             </a>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
