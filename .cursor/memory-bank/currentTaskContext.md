# Current Task Context

## Symptom
Legacy vanilla Three.js background script (`public/three-background.js`) is outdated and needs to be replaced with a modern, reactive React Three Fiber (R3F) system for better performance and interactivity.

## Root Cause
User request to upgrade the website to an "Awwwards" winning level using R3F.

## Impacted Modules
- `package.json`: Adding R3F dependencies.
- `app/components/SpaceScene.tsx`: New component for the 3D scene.
- `app/page.tsx`: Integrating the new component and removing legacy elements.
- `public/three-background.js`: File to be deleted.

## Fix Summary
- Install `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`.
- Create `SpaceScene` with `StarField`, `WarpEffect`, reactive camera, and post-processing.
- Replace legacy canvas and script in `app/page.tsx`.
- Delete obsolete script.

## Files Touched
- `package.json`
- `app/components/SpaceScene.tsx`
- `app/page.tsx`
- `public/three-background.js`

## Verification Evidence
- Successful build (`npm run build`).
- Visual verification of the new background.
- Git commit and push.
