# Progress Tracking

## Status
- [x] **Memory Bank Update**: Complete.
- [x] **Three.js Exposure**: verified (existing).
- [x] **Resume Content**: verified (existing).
- [x] **FloatingDetailBox Component**: Implemented.
- [x] **Integration**: Implemented in `page.tsx`.

## Decisions
-   **Reuse Canvas**: Reused existing `#webgl` canvas via `window.spaceApp`.
-   **Interaction Model**: Implemented "Preview" (Hover) vs "Locked" (Click) modes to resolve ambiguity in "Un-hover dismisses" vs "Click outside dismisses".
-   **Particle Logic**: Used "Scattered Start Positions" to simulate background stars gathering, rather than modifying the persistent background star buffer, to ensure stability and performance.
