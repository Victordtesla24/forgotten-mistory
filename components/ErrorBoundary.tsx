'use client';

/**
 * ErrorBoundary — reusable React 18+ error boundary for component-level
 * crash isolation.
 *
 * Wraps any subtree. When an unhandled error propagates from a child
 * component, ErrorBoundary catches it, calls onError (if provided), and
 * renders the fallback UI instead of taking down the entire page.
 *
 * Usage:
 *   <ErrorBoundary fallback={<PosterFallback />}>
 *     <R3FCanvasComponent />
 *   </ErrorBoundary>
 *
 * Monochrome-styled fallback matches SPEC §3.1 (ink-900, steel, accent).
 */

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default monochrome fallback — compact, matches the HUD motif
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-fallback-inner">
            <p className="error-boundary-fallback-label">Component error</p>
            <p className="error-boundary-fallback-msg">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <style jsx>{`
            .error-boundary-fallback {
              width: 100%;
              max-width: 340px;
              aspect-ratio: 1 / 1;
              background: var(--ink-800, #121317);
              border: 1px solid rgba(174, 182, 194, 0.1);
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
            }
            .error-boundary-fallback-inner {
              text-align: center;
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }
            .error-boundary-fallback-label {
              font-family: var(--font-space-grotesk, sans-serif);
              font-size: 0.7rem;
              font-weight: 500;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--steel, #AEB6C2);
              margin: 0;
              opacity: 0.6;
            }
            .error-boundary-fallback-msg {
              font-family: var(--font-mono, monospace);
              font-size: 0.7rem;
              color: var(--steel, #AEB6C2);
              margin: 0;
              opacity: 0.5;
              max-width: 260px;
              word-break: break-word;
              line-height: 1.4;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
