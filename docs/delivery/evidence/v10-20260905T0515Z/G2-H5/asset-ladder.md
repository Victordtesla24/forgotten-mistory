# G2-H5 — Hero / video / raster asset ladder (honest inventory)

- **Task:** `t_g2_h5` · **Gap:** G-H5 · **Identity:** researcher / ADV-1556Z
- **Worktree branch:** `worktree-gh5r-1556` (from `origin/main`)
- **Base commit:** `b2ac21bef07c7ce62346961abbcdbd84027c5316` (`b2ac21b`)
- **Probed:** 2026-09-05T17:01–17:12Z on VPS srv1356245
- **Tools:** `ffprobe version 8.0.1-3ubuntu2` (FFmpeg) · `ImageMagick 7.1.2-18 Q16` (`identify`)
- **R5 pass rule (from GAP-BACKLOG):** a media asset PASSes R5 **only** if it is **≥ 3840×2160 @ 60 fps** *or* **resolution-independent** (a live GLSL/vector render). Everything below that is a FAIL for R5.
- **Scope note:** the HyperFrames / atmosphere pipeline (`t_x1_10`) renders the **atmosphere** scene, which is resolution-independent GLSL. It does **not** render the **portrait**. The portrait is a captured photograph + captured video loop; it has no resolution-independent path and needs a real higher-resolution capture or a paid generation (Higgsfield credits = 0, Owner-blocked). No fake upscale is presented as 4K anywhere in this document.

---

## 1. Full inventory — `public/assets/` on `origin/main`

Measured with `ffprobe`/`identify` against `public/assets/` in this worktree. "Where used" is from `grep -rn` across `app/ components/ public/ firebase.json`.

| Asset | Type | Dimensions | fps | Duration | Bytes | Codec/Fmt | Where used (source ref) | R5 |
|-------|------|-----------|-----|----------|-------|-----------|-------------------------|----|
| `my-avatar.mp4` | video | **1280×720** | **24** | 12.29 s | 1,096,301 | H.264 | `app/data/portfolio/avatar.ts:31` (hero portrait hover loop), `components/MiniVicBot.tsx:247` (bot talking-head) | **FAIL** (720p24) |
| `my-hero-avatar.mp4` | video | **640×360** | 24 | 5.875 s | 160,156 | H.264 | **none** — unreferenced in app/components/public/firebase.json | **FAIL** + **ORPHAN** |
| `my_avatar.avif` | still | **1480×826** | — | — | 41,343 | AVIF 8-bit | `app/data/portfolio/avatar.ts:17` (portrait `<source>` #1) | FAIL (still, < 2160) |
| `my_avatar.webp` | still | **1480×826** | — | — | 66,470 | WebP 8-bit | `app/data/portfolio/avatar.ts:18` (portrait `<source>` #2), `components/MiniVicBot.tsx:250` (bot still) | FAIL (still, < 2160) |
| `my_avatar.png` | still | **900×502** | — | — | 178,777 | PNG 8-bit | `app/data/portfolio/avatar.ts:19` + `HeroPortrait.tsx` `<img src>` fallback, `app/layout.tsx:111` (schema image) | **FAIL** + **dimension mismatch** (declared 1480×826) |
| `hero-atmosphere-poster.avif` | still | 3840×2160 | — | — | 12,935 | AVIF 8-bit | **none** found in source grep (atmosphere poster; scene is GLSL) | N/A to portrait; 4K still |
| `og-image.png` | still | 1200×630 | — | — | 182,547 | PNG 8-bit | `app/layout.tsx:81,89` (OpenGraph/Twitter card) | N/A (social card) |
| `avatar-studio-voice.mp3` | audio | — | — | — | 600,961 | MP3 | **none** found in source grep (candidate orphan) | N/A (audio) |
| `minivic-greeting.mp3` | audio | — | — | — | 417,702 | MP3 | `components/MiniVicBot.tsx:276`, digest in `app/data/generated/greeting-asset.ts` | N/A (audio) |
| `minivic-greeting.txt` | text | — | — | — | 368 | text | greeting transcript | N/A |

Budget check: every asset is **under** the 500 kB image / 5 MB video budgets. `my-avatar.mp4` (1.05 MB) is the largest and is `preload="none"` (fetched on hover only).

### Reproduce

```bash
cd public/assets
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size \
  -of default=noprint_wrappers=0 my-avatar.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration,size \
  -of default=noprint_wrappers=0 my-hero-avatar.mp4
for f in my_avatar.avif my_avatar.webp my_avatar.png hero-atmosphere-poster.avif og-image.png; do
  identify -format '%f  %wx%h  %m  %B bytes\n' "$f"
done
```

---

## 2. The two hero videos

### `my-avatar.mp4` — the live portrait loop (720p24)
- **1280×720, 24 fps, 12.29 s, 1,096,301 B, H.264.**
- This is the current hero portrait hover loop (`avatar.ts.loop.src`) and the MiniVic bot talking-head. It replaced the 360p file already in `HeroPortrait.tsx` (which now reads `avatarContent.loop.src`, not the old `LOOP_SRC = '/assets/my-hero-avatar.mp4'` seen in `docs/.../C21-hero-photo/01-baseline.log:38`).
- **R5: FAIL.** 720p24 is neither 4K@60 nor resolution-independent.

### `my-hero-avatar.mp4` — the 360p orphan → **RETIRE**
- **640×360, 24 fps, 5.875 s, 160,156 B, H.264.**
- **Unreferenced by the shipped app.** `grep -rn "my-hero-avatar" app components public firebase.json` returns **zero** hits. Every remaining match on the host is non-shipping:
  - `scripts/pm/board_bootstrap_v10.mjs:246` — a kanban task-description string.
  - `reports/post-prod/lighthouse-production.json` — a **stale legacy** Lighthouse snapshot of the old `script.js`/`index.html` static site (`<video data-src="/assets/my-hero-avatar.mp4" id="profile-image">`). That legacy static page is **not** in `public/` today (`public/index.html`, `public/script.js` do not exist), and it is not what Next.js emits.
  - `docs/prompt.md`, `docs/adversarial/*`, `docs/delivery/evidence/*` — documentation/evidence.
- **Decision: RETIRE (delete).** It is a true orphan; deleting the binary and (if present) any preload/link is safe. This is an AP action (asset/code change) — see §6.

---

## 3. The portrait still — PNG dimension mismatch

- `app/data/portfolio/avatar.ts:20-21` declares `width: 1480, height: 826`, and `HeroPortrait.tsx` renders the `<img>` with `width={1480} height={826}`.
- The `<picture>` sources resolve at the **declared** master resolution:
  - `my_avatar.avif` = **1480×826** ✅
  - `my_avatar.webp` = **1480×826** ✅
  - `my_avatar.png` (the `<img src>` fallback + schema image) = **900×502** ❌
- **Finding:** the PNG fallback is **900×502**, i.e. **0.61×** the declared 1480×826. A browser without AVIF/WebP support (and any consumer of the `app/layout.tsx:111` schema image) receives a 900×502 raster stretched into a 1480×826 box — a soft/under-resolution image and a declared-vs-actual mismatch. The `avatar.ts:16` comment ("1480x826, measured with ffprobe … PNG 179 kB") is **inaccurate for the PNG**.
- **Fix (AP, §6):** regenerate `my_avatar.png` at **1480×826** from the existing 1480×826 master (the AVIF/WebP are already at that resolution — this is a format match at the *same* master resolution, **not** an upscale). Keep it under the 500 kB image budget.

---

## 4. Higher-resolution SOURCE search (host)

Goal: find any original of the portrait (still or video) at ≥ 1080p that would enable an honest ≥1080p → 4K ladder.

```bash
# a) mission-specified sweep
find / -iname "*avatar*" -size +5M 2>/dev/null            # → (empty)
find / -iname "*hero*"   -size +5M 2>/dev/null             # → only unrelated tenant asset (below)
# b) large hero/avatar/portrait media, pruning node_modules/.git
find / \( -path '*/node_modules' -o -path '*/.git' -o -path /proc -o -path /sys \) -prune -o \
  -type f \( -iname "*avatar*" -o -iname "*portrait*" -o -iname "*hero*" \) -size +2M -printf '%s\t%p\n' 2>/dev/null | sort -rn
# c) every my_avatar/my-avatar original by name, any size
find /root /tmp /home /opt -path '*/node_modules' -prune -o -type f \
  \( -iname "*my_avatar*" -o -iname "*my-avatar*" \) -printf '%s\t%p\n' 2>/dev/null | sort -rn
```

**Results — no higher-resolution portrait source exists anywhere on the host:**

- `find -iname "*avatar*" -size +5M` → **empty**.
- Only >2 MB "hero/avatar" hit unrelated to this project: `…/community-hero.png` (10 MB) belongs to a **different Docker tenant** (`/docker/abentertainment/...`, `/var/lib/docker/...`). Not our portrait.
- Every other >2 MB "hero" hit is a Playwright **audit screenshot** `.audit-v7/shots/01-hero-1440.png` (3.74 MB) — a rendered page capture, not a portrait source.
- **Every** copy of `my-avatar.mp4` on the host is **byte-identical** (size 1,096,301, `md5 = 5ceec5ae2339f94b100eb5e81bc7f6e5`) across `/tmp`, `/tmp/fm-assets`, `/tmp/adv-hero-minivic-20260906/assets`, `out/`, and all worktrees. `ffprobe` on the `/tmp` copy confirms **1280×720, 24 fps** — not a same-size 4K master.
- No portrait still anywhere exceeds **1480×826** (the shipped AVIF/WebP resolution). `find … identify` over `/root /tmp /home /opt` returns only 1480×826 (avif) and 900×502 (png).

**Conclusion:** there is **no ≥1080p source** of the portrait — neither video (max = 720p24) nor still (max = 1480×826, whose *height* 826 is itself below 1080). `has_1080p_source = false`.

---

## 5. The ladder — what exists vs. what a 4K render needs

| Rung | Target | Portrait video | Portrait still |
|------|--------|----------------|----------------|
| Shipped today | — | `my-avatar.mp4` 1280×720@24 (1.05 MB, H.264) | `my_avatar.{avif,webp}` 1480×826; `my_avatar.png` **900×502** (bug) |
| Honest max from existing sources | — | **720p24** (no higher master exists) | **1480×826** (no higher master exists) |
| Rung 1 — 1080p | 1920×1080 | ❌ **no source** — cannot produce honestly | ❌ **no source** (826 < 1080) |
| Rung 2 — 4K@60 (R5) | 3840×2160 @ 60 | ❌ **needs a real capture/generation** | ❌ **needs a real capture/generation** |

**What a 4K portrait render actually requires (none available now, all Owner-blocked):**
1. A genuine ≥ 2160p portrait **capture** (re-shoot / high-res photo), **or**
2. Higgsfield (or equivalent) **generation credits** — currently **0**; the Owner must top up. Do **not** ask, do **not** fake.
3. The portrait is **not** covered by the atmosphere GLSL pipeline (`t_x1_10`), which renders the resolution-independent *atmosphere*, not the face.

Because neither exists, the only honest moves inside this gap are: (a) keep the 720p24 loop as the best available portrait video, (b) fix the PNG to the 1480×826 master, (c) retire the 360p orphan, and (d) **stop claiming R5 for the portrait**.

---

## 6. Honest R5 status + hand-off to AP

**R5 status for the portrait: `FAIL`.** The portrait loop is 720p24 and the portrait still tops out at 1480×826. There is no 4K@60 source and no resolution-independent portrait path. **Any R5 = PASS claim for the hero portrait is unsupported and must be retracted** (the R5 register `t_x1_09` referencing this ladder should record R5 portrait = FAIL / OPEN until a real 4K@60 source or Higgsfield credits land). The 3840×2160 `hero-atmosphere-poster.avif` belongs to the atmosphere scene (R2/atmosphere), not the portrait, and must not be cited as portrait R5 evidence.

**AP follow-up (code/asset changes — outside this researcher doc):**

```bash
# (1) Retire the 360p orphan (unreferenced — safe delete)
git rm public/assets/my-hero-avatar.mp4
# grep first to be certain nothing new references it before commit:
grep -rn "my-hero-avatar" app components public firebase.json   # must be empty

# (2) Fix the PNG fallback to the DECLARED 1480x826 master (format match, NOT an upscale;
#     the AVIF/WebP are already 1480x826). Re-derive from the highest-fidelity master available.
ffmpeg -y -i public/assets/my_avatar.webp -vf scale=1480:826 -pix_fmt rgb24 /tmp/my_avatar_1480.png
# or: magick public/assets/my_avatar.webp -resize 1480x826 public/assets/my_avatar.png
identify -format '%wx%h\n' public/assets/my_avatar.png   # must print 1480x826, stay < 500 kB
# then correct the avatar.ts:16 comment so it describes the PNG at 1480x826.
```

Do **not** synthesise a 1920×1080 or 3840×2160 portrait by upscaling; that would be a fake 4K and is explicitly forbidden.

---

## 7. Answer keys

- `has_1080p_source`: **false** (portrait max = 720p24 video / 1480×826 still).
- `retire_360p`: **true** (`my-hero-avatar.mp4` is a true orphan).
- `png_mismatch`: **true** (`my_avatar.png` 900×502 vs declared 1480×826 — fix to master resolution).
- `portrait_r5`: **FAIL** — stop claiming R5 for the portrait until a real 4K@60 source or Higgsfield credits exist.

---

## 8. AP execution log — changes actually made (identity: analyst-programmer / t_g2_h5 / ADV-1556Z)

Executed on a fresh worktree `worktree-gh5-1556` cut from `origin/main` (`2806ede`, "consolidate: merge worktree-rev1556-base into main"). No new generation, no upscale, no Higgsfield, OAuth only.

**(1) Retired the 360p orphan.** `grep -rn "my-hero-avatar" app components public firebase.json` returned zero shipping hits, so:

```bash
git rm public/assets/my-hero-avatar.mp4        # 640×360@24, 160,156 B — unreferenced
```

No test referenced it (`grep -rn my-hero-avatar tests/` → empty; `tests/content/asset-resolution.spec.ts` from `t_x1_09` is not yet on `main`), so the delete breaks nothing.

**(2) Fixed the PNG fallback to the declared 1480×826 master — format match, NOT an upscale.** The WebP master is already 1480×826, so re-deriving the PNG from it is a same-resolution format conversion, not a synthesized higher resolution:

```bash
magick public/assets/my_avatar.webp -resize 1480x826 -dither FloydSteinberg \
  -colors 176 -strip -define png:compression-level=9 PNG8:public/assets/my_avatar.png
identify -format '%f %wx%h %m %B bytes\n' public/assets/my_avatar.png
# → my_avatar.png 1480x826 PNG 496176 bytes   (was 900×502 / 178,777 B)
```

- New PNG: **1480×826**, **496,176 B** — matches the declared master and the AVIF/WebP siblings; **under the 500 kB image budget** (a 176-colour palette was the max that stays < 500,000 B for this portrait). The 900×502 declared-vs-actual mismatch is resolved.
- This is a fallback/schema raster only (browsers with AVIF/WebP never fetch it); the palette PNG is an acceptable-fidelity fallback at the honest master resolution.

**(3) Kept the 720p24 loop as the best honest portrait video.** `my-avatar.mp4` (1280×720@24) is unchanged — it is the honest ceiling; no ≥1080p source exists (§4).

**(4) Retracted the portrait R5 claim in shipped code.** `app/data/portfolio/avatar.ts` comments now state R5 = FAIL for the portrait (still and loop) and point here. The R5 register `t_x1_09` already scores the portrait assets as FAIL/waiver (never PASS); nothing claimed portrait R5 = PASS, and this doc keeps `portrait_r5 = FAIL` until a real ≥4K@60 capture or generation credits land.

**Files changed by AP:** `public/assets/my-hero-avatar.mp4` (deleted), `public/assets/my_avatar.png` (regenerated 1480×826), `app/data/portfolio/avatar.ts` (comments corrected), this file (§8).

---

## 9. 2026-09-06 re-measure — canonical name, monochrome grade, and the source ceiling corrected

- **Task:** `t_w1_h6h5` (G-H5 + G-H6) · **Identity:** analyst-programmer / ADV-2315Z
- **Worktree:** `worktree-w1-h6h5` from `origin/main` (`9136bc5`)
- **Probed:** 2026-09-06T00:10–00:25Z on VPS srv1356245 · `ffprobe`/`ffmpeg` 8.0.1 · ImageMagick 7.1.2-18 · sharp 0.35.3
- **Search log (raw):** `docs/delivery/evidence/v10-20260905T0515Z/W1-H6H5/01-source-search.log`

### 9.1 Source search — §7 of this document was WRONG, and this section corrects it

§4/§7 concluded `has_1080p_source = false`. A wider sweep (every `*.mp4|mov|mkv|webm` over 1 MB on the root filesystem, not only files whose *name* contains "avatar"/"hero") found the real masters, which live under `artifacts/masters/` and are named after the bot, not the portrait:

| Candidate | Dimensions | fps | Duration | Bytes | Same subject? |
|-----------|-----------|-----|----------|-------|---------------|
| `artifacts/masters/minivic-greeting-2160p-master.mp4` | **3840×2160** | **24** | 12.325 s | 58,370,772 | **yes** — frame-for-frame the same shot as the shipped loop (compared at t = 2 s) |
| `artifacts/masters/minivic-greeting-1080p-voiced.mp4` | 1920×1080 | 25 | 12.320 s | 4,754,189 | yes (voiced variant of the same shot) |
| `artifacts/masters/minivic-idle-720p.mp4` | 1280×720 | 24 | 12.292 s | 1,096,301 | yes — **md5 `5ceec5ae2339f94b100eb5e81bc7f6e5`, byte-identical to the shipped `public/assets/my-avatar.mp4`** |
| `/root/.claude/jobs/7aa4036e/tmp/av/h264-hq.mp4` | 1080×1080 | 25 | 29.96 s | 5,225,507 | no — square explainer render, different composition |
| `/docker/abentertainment/**`, containerd snapshots, gradio sample clips | various | — | — | — | no — other tenants' media |
| Stills anywhere on host | max **1480×826** (`my_avatar.webp`) | — | — | — | no larger portrait still exists |

**So a genuinely higher-resolution original of the same subject DOES exist: 3840×2160 @ 24 fps.** The shipped 720p loop was a downscale of it all along; the earlier "no ≥1080p source" finding was an artefact of searching by filename.

### 9.2 What ships now, and why that rung

| | Before (`9136bc5`) | Now |
|---|---|---|
| Loop path | `/assets/my-avatar.mp4` (§0.3-3's name 404ed) | **`/assets/my-hero-avatar.mp4`** — the name `docs/prompt.md` §0.3-3 gives it; old name → **301** in `firebase.json` |
| Loop source | a 720p transcode | the **3840×2160@24 master**, downscaled with lanczos |
| Loop grade | colour | **greyscale in the bytes** (`format=gray,format=yuv420p`; every decoded frame measures chroma 0/255) |
| Loop | 1280×720@24, 12.29 s, 1,096,301 B | 1280×720@24, 12.29 s, **1,916,328 B** |
| Stills | colour, 1480×826 (PNG 496,176 B) | **greyscale**, 1480×826 — AVIF 36,551 B · WebP 51,028 B · PNG 483,145 B |
| Binaries for the loop | 1 (wrong name) | 1 (right name) — R4 holds, no duplicate |

**Why 720p and not the 2160p master:** the static audit's `TC-NFR-PERF` caps a non-click-to-play video at **2.5 MB**. Measured re-encodes of this clip: 1280×720 = **1.83 MB** (ships), 1920×1080 = **4.36 MB** (over cap), 3840×2160 ≈ 20 MB+ (far over, and ~30× the pixels the figure ever paints — the portrait renders ≈ 600 CSS px wide at 1440). The master stays in `artifacts/masters/` as the source of record; the shipped rung is a downscale of it, never an upscale.

### 9.3 R5, honestly

**R5 (≥ 3840×2160 @ 60 fps, or resolution-independent) is NOT met by any captured portrait asset.** The one 4K master on this host is **24 fps**, not 60, and the largest portrait still is 1480×826; the shipped loop is a 1280×720 downscale chosen against the 2.5 MB video budget. No higher-frame-rate or resolution-independent portrait source exists on this host — a genuine ≥ 2160p60 capture or a paid generation is still required, and **720p24 is never presented as 4K anywhere in the shipped code or copy**. R5 for the portrait stays **OPEN**.

### 9.4 Reproduce

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
  -of csv=p=0 artifacts/masters/minivic-greeting-2160p-master.mp4   # → 3840,2160,24/1
md5sum artifacts/masters/minivic-idle-720p.mp4 public/assets/my-hero-avatar.mp4  # first == the retired shipped file
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
  -of csv=p=0 public/assets/my-hero-avatar.mp4                       # → 1280,720,24/1
node --test tests/hero_assets_monochrome.test.mjs                    # chroma ≤ 2 on every still + 3 loop frames
```

`og-image.png` (1200×630 social card) is deliberately **untouched** — it is the OpenGraph/Twitter card, outside this gap's scope.
