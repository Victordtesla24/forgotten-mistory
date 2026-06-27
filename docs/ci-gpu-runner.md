# CI E2E on a GPU-capable runner

## Why this exists

The Playwright e2e suite asserts **GPU-only rendering**:

- **CSS `backdrop-filter` compositing** — the wave5/6/7/10 "glassmorphic" specs check
  `getComputedStyle(el).backdropFilter` contains `blur(`. On GitHub's GPU-less runners
  Chromium falls back to the SwiftShader software rasteriser, which **reports
  `backdrop-filter` as absent** (it is a GPU-compositing-only feature).
- **Heavy R3F / HUD WebGL frame rates** — `boot` (preloader reveals < 2.5 s),
  `floating-panels` (rAF loop > 5 frames / 500 ms), `reduced-motion` (the scene issues
  ≥ 200 draws with motion on), `hud`, `signature`. Under SwiftShader WebGL is ~10–40×
  too slow (observed: 11 draws vs 200 floor, rAF ≈ 4 fps, boot reveal 5–6 s).

These specs **pass on any real GPU** (locally and on the live site for real users); they
only fail on the GPU-less GitHub-hosted runners. Rather than weaken the assertions or
degrade the cinematic scenes, the `test` job runs on a **GPU-capable runner**.

Everything else (`lint`, `quality`/static-audit, `axe`, `lighthouse`, `build`, `deploy`)
stays on `ubuntu-latest`.

## What the workflow already does

`.github/workflows/deploy.yml` → `test` job:

```yaml
runs-on: ${{ fromJSON(vars.E2E_RUNNER_LABELS || '["self-hosted","gpu"]') }}
...
- run: xvfb-run -a --server-args="-screen 0 1920x1080x24" npx playwright test
```

- `runs-on` reads the **repo variable `E2E_RUNNER_LABELS`** (a JSON array of labels). If
  unset it defaults to `["self-hosted","gpu"]`. Set the variable to match whatever runner
  you provision — no workflow edit needed.
- `playwright.config.ts` launch args (`--ignore-gpu-blocklist`,
  `--enable-gpu-rasterization`) let Chromium use the runner's GPU;
  `--enable-unsafe-swiftshader` stays only as a safe fallback (ignored when a real GPU is
  present).
- `xvfb-run` gives headless Chromium a virtual display; the GPU is still reached through
  the driver (EGL). It is harmless if the runner already has a display.

## Option A — Self-hosted GPU runner (Ubuntu 22.04/24.04 + NVIDIA)

1. **Provision a machine/VM with an NVIDIA GPU** (e.g. a cloud GPU instance: AWS g4dn,
   GCP T4, Azure NC, or a local box).
2. **Install the NVIDIA driver** and verify:
   ```bash
   sudo ubuntu-drivers autoinstall   # or the vendor driver
   nvidia-smi                          # must list the GPU
   ```
3. **Install the bits Chromium/Playwright + xvfb need**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y xvfb mesa-utils libgl1 libglu1-mesa
   # Playwright system deps are installed by the job via `npx playwright install --with-deps`
   ```
4. **Register the runner** (Repo → Settings → Actions → Runners → New self-hosted runner →
   Linux x64). Follow the shown `./config.sh` command and **add the `gpu` label**:
   ```bash
   ./config.sh --url https://github.com/Victordtesla24/forgotten-mistory \
               --token <REG_TOKEN> --labels gpu --name fm-gpu-runner
   sudo ./svc.sh install && sudo ./svc.sh start   # run as a service
   ```
5. (If you used a different label) set the repo variable:
   `Settings → Secrets and variables → Actions → Variables → New variable`
   `E2E_RUNNER_LABELS = ["self-hosted","<your-label>"]`
6. Re-run the `test` job (or push). It now executes on the GPU runner.

> Security note: self-hosted runners execute repo workflow code. Keep this runner on a
> **private** repo or a dedicated, isolated host; do not expose it to untrusted PRs.

## Option B — GitHub-hosted GPU larger runner

1. Repo/Org → **Settings → Actions → Runners → New runner → New GitHub-hosted runner**,
   choose a **GPU** image (e.g. an NVIDIA T4 larger runner) and give it a **label**
   (e.g. `gpu-t4`). (Requires a plan that offers GPU larger runners; it is billed.)
2. Set the repo variable `E2E_RUNNER_LABELS = ["gpu-t4"]` (your label).
3. Push / re-run — the `test` job runs on the hosted GPU runner. `xvfb-run` + the GPU
   flags already in the workflow/config handle the display + hardware GL.

## Verifying the GPU is actually used

In a one-off debug run you can confirm hardware GL instead of SwiftShader:

```bash
xvfb-run -a glxinfo | grep -i "renderer"      # should NOT say "llvmpipe"/"softpipe"
```

In Chromium, `navigator.gpu` / `WEBGL_debug_renderer_info` should report the NVIDIA/ANGLE
renderer, not "Google SwiftShader". If specs still fail with SwiftShader symptoms, the
GPU/driver isn't being picked up — check `nvidia-smi`, the driver, and that the runner
process can access `/dev/dri` (or the NVIDIA devices).

## Once green

When the labelled GPU runner is online the `test` job goes green, which unblocks `build`
→ `deploy` (on push to `main`) → the live site updates automatically, and
`production-verification` runs against https://forgotten-mistory.web.app/.
