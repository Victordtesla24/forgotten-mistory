# V-R3: Real-Time Telemetry Verification

**Date:** 2026-06-28
**Live Site:** https://forgotten-mistory.web.app
**Task:** t_ea53f5c1

## Verdict: FAIL

The telemetry system partially satisfies R3 but fails on two critical criteria: genuine data sources and absence of simulation content.

## Evidence Summary

### PASS Criteria

| # | Criterion | Result | Detail |
|---|-----------|--------|--------|
| 1 | Telemetry panel visible on production site | **PASS** | Three panels visible: System Status, JARVIS System (Error-Management-System), Tesla App Dashboard (Live Vehicle Telemetry) |
| 2 | Values are real-time (change observably within 10s) | **PASS** | FPS: 25→53, Frame time: 40.2→16.5ms, Health: 90→84%, Errors: 5→13, Tesla speed: 63→139 km/h |
| 3 | No coffee cup or placeholder simulation content | **FAIL** | "Demo data" badge on System Status; "Simulated geo-feed" note on visitors; "simulates system under demand" on server load; "Deterministic simulated live feed" note on JARVIS |
| 4 | Telemetry uses genuine data sources | **FAIL** | Only FPS/frame-time are real (browser rAF delta). 75%+ of data is deterministic sine/saw wave simulation with ZERO real system connections |
| 5 | Before/after screenshots captured showing value changes | **PASS** | Captured: telemetry_before.png, telemetry_after_12s.png |

### What's Real vs. What's Simulated

| Telemetry Metric | Source | Verdict |
|-----------------|--------|---------|
| Browser render FPS | `performance.now()` rAF delta, rolling 60-frame window | **REAL** |
| Frame time | Same rAF delta source | **REAL** |
| Active visitors by region | `LOCATION_SETS` array rotated every 3.2s via `setInterval` | **SIMULATED** |
| Server load | `ScrollTrigger.progress` mapped to 22–85% range | **SIMULATED** |
| JARVIS system health/agents/errors/repairs | `generateJarvisTelemetry(t)` — sine-wave model | **SIMULATED** |
| JARVIS event stream | Deterministic cycle through 8 project names × 3 phases | **SIMULATED** |
| Tesla speed/charge/power/range/odometer | `generateTeslaTelemetry(t)` — sine/saw-wave models | **SIMULATED** |

### Source Code Confirmation

- `lib/telemetryFeed.ts` — data-source annotation at line 147: `'Deterministic simulated live feed (sine-based signal model, zero Math.random())'`
- `components/site/TelemetryPanel.tsx` line 307: explicit `<span className="pill soft">Demo data</span>` badge
- Lines 351-353: `'Simulated geo-feed rotates every few seconds.'`
- Lines 375-377: `'Load scrubbed by scroll progress — simulates system under demand.'`
- No WebSocket connections, no telemetry API calls observed in network tab

### What the Docs Say

- `T1-T4-FINDINGS.md`: "R3 — current telemetry panels are simulated/demo data (explicitly labeled). TelemetryHud.tsx with custom GLSL shaders — needs real data integration"
- `RESEARCH-DOSSIER.md`: "The existing TelemetryHud uses simulated-but-plausible telemetry … labelled honestly as a demo … acceptable — but the downstream implementation should wire real fake data"

## Recommended Fix

Replace the simulated telemetry with genuine data sources:

1. **Remove "Demo data" badge** from System Status
2. **Replace simulated geo-feed** with actual edge/CDN data or remove the section
3. **Replace simulated server load** with a removed section or connect to actual Firebase Hosting metrics API
4. **Replace JARVIS deterministic feed** with actual GitHub Actions CI data, or real repo commit/issue activity
5. **Replace Tesla deterministic feed** with real data (or remove and keep only real metrics)
6. **Keep real FPS/frame-time** — already satisfies the "real-time" requirement on its own if the simulated sections are either removed or wired to real sources

## Evidence Files

- `telemetry_before.png` — screenshot at T=0
- `telemetry_after_12s.png` — screenshot at T+12s
