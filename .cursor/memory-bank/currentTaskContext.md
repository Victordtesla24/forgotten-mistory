# Current Task Context

## Symptom
Three.js animation in `FloatingDetailBox` was interrupted because the `useEffect` hook re-ran on every render of the parent component.

## Root Cause
The `useEffect` in `FloatingDetailBox` includes `onClose` in its dependency array. The parent component `app/page.tsx` passed a non-memoized `handleClose` function as `onClose`, which changed reference on every render, triggering the effect unnecessarily.

## Impacted Modules
- `app/page.tsx`: Parent component defining `handleClose`.
- `components/FloatingDetailBox.tsx`: Child component using `onClose` in `useEffect`.

## Fix Summary
Wrapped `handleClose` in `useCallback` in `app/page.tsx` to ensure stable function reference across renders.

## Files Touched
- `app/page.tsx`

## Verification Evidence
- `app/page.tsx` imports `useCallback`.
- `handleClose` uses `useCallback`.
- Linter checks passed.
