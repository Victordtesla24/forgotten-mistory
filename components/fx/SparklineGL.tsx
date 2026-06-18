'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PALETTE } from '@/lib/palette';

interface SparklineGLProps {
  values: number[];
}

/**
 * SparklineGL — a subtle canvas-based glow overlay that sits above the SVG
 * sparkline in TelemetryPanel. It draws a soft luminous trace mirroring the
 * SVG stroke, giving the sparkline a \"live scan\" halo without altering
 * the existing SVG geometry.
 */
export default function SparklineGL({ values }: SparklineGLProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    ctx.clearRect(0, 0, width, height);
    if (values.length < 2) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = width / (values.length - 1);

    // Draw a soft glowing trace
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = PALETTE.white;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.35;

    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const x = i * stepX;
      const y = height - ((values[i] - min) / range) * (height - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }, [values, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="telemetry-spark-gl"
      aria-hidden="true"
    />
  );
}
