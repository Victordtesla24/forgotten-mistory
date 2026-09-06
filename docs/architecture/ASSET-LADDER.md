# G2-H5 — Hero / video / raster asset ladder (honest inventory)

- **2026-09-06 changelog (rev-12cd9123-w1 F-5):** §1–2 rewritten to describe the
  live rungs shipped by §10 (`my-hero-avatar.mp4` 1280×720@24, 1,916,328 B as
  the base/default; `avatar/my-hero-avatar-1080.mp4` and
  `avatar/my-hero-avatar-2160.webm` as the on-demand rungs) instead of the
  retired 640×360/160,156 B orphan, which §1–2 had kept describing as the
  current live file after §8/§10 had already retired and replaced it. §10 is
  unchanged. See `t_w1_lad1`.

- **Task:** `t_g2_h5` · **Gap:** G-H5 · **Identity:** researcher / ADV-1556Z
- **Worktree branch:** `worktree-gh5r-1556` (from `origin/main`)
- **Base commit:** `b2ac21bef07c7ce62346961abbcdbd84027c5316` (`b2ac21b`)
- **Probed:** 2026-09-05T17:01–17:12Z on VPS srv1356245
- **Tools:** `ffprobe version 8.0.1-3ubuntu2` (FFmpeg) · `ImageMagick 7.1.2-18 Q16` (`identify`)
- **R5 pass rule (from GAP-BACKLOG):** a media asset PASSes R5 **only** if it is **≥ 3840×2160 @ 60 fps** *or* **resolution-independent** (a live GLSL/vector render). Everything below that is a FAIL for R5.
- **Scope note:** the HyperFrames / atmosphere pipeline (`t_x1_10`) renders the **atmosphere** scene, which is resolution-independent GLSL. It does **not** render the **portrait**. The portrait is a captured photograph + captured video loop; it has no resolution-independent path and needs a real higher-resolution capture or a paid generation (Higgsfield credits = 0, Owner-blocked). No fake upscale is presented as 4K anywhere in this document.

---

## 1. Full inventory — `public/assets/` on `origin/main` (as of §10, `12cd9123`)

Measured with `ffprobe`/`identify` against `public/assets/` in this worktree. "Where used" is from `grep -rn` across `app/ components/ public/ firebase.json`. This supersedes the inventory row-for-row published at `b2ac21b` (§8 below) — the loop's canonical name, bytes and grade all changed in §9–§10.

| Asset | Type | Dimensions | fps | Duration | Bytes | Codec/Fmt | Where used (source ref) | R5 |
|-------|------|-----------|-----|----------|-------|-----------|-------------------------|----|
| `my-hero-avatar.mp4` | video | **1280×720** | **24** | 12.29 s | **1,916,328** | H.264 High@3.1, greyscale | `app/data/portfolio/avatar.ts` `loop.src` / `ladder[0]` (hero portrait hover loop, base rung, default), `components/MiniVicBot.tsx` (bot talking-head) | **OPEN** (base rung; not the R5 claim) |
| `avatar/my-hero-avatar-1080.mp4` | video | **1920×1080** | 24 | 12.29 s | 3,690,721 | H.264 High@5.0, CRF 21, greyscale | `app/data/portfolio/avatar.ts` `loop.ladder[1]`, selected by `lib/videoRung.ts` on demand | **OPEN** (on-demand rung, not fetched by default) |
| `avatar/my-hero-avatar-2160.webm` | video | **3840×2160** | 24 | 12.29 s | 2,913,450 | AV1 Main@5.0 (SVT-AV1 CRF 40), greyscale | `app/data/portfolio/avatar.ts` `loop.ladder[2]`, selected by `lib/videoRung.ts` on demand | **OPEN** (resolution met, fps 24 ≠ 60 — see §10.4) |
| `my_avatar.avif` | still | **1480×826** | — | — | 36,551 | AVIF 8-bit, greyscale | `app/data/portfolio/avatar.ts` `still.avif` (portrait `<source>` #1) | FAIL (still, < 2160) |
| `my_avatar.webp` | still | **1480×826** | — | — | 51,028 | WebP 8-bit, greyscale | `app/data/portfolio/avatar.ts` `still.webp` (portrait `<source>` #2), `components/MiniVicBot.tsx` (bot still) | FAIL (still, < 2160) |
| `my_avatar.png` | still | **1480×826** | — | — | 483,145 | PNG 8-bit (256-entry palette), greyscale | `app/data/portfolio/avatar.ts` `still.png` + `HeroPortrait.tsx` `<img src>` fallback, `app/layout.tsx` (schema image) | FAIL (still, < 2160); dimension mismatch fixed — matches declared 1480×826 |
| `hero-atmosphere-poster.avif` | still | 3840×2160 | — | — | 12,935 | AVIF 8-bit | **none** found in source grep (atmosphere poster; scene is GLSL) | N/A to portrait; 4K still |
| `og-image.png` | still | 2400×1260 | — | — | 209,035 | PNG 8-bit | `app/layout.tsx` (OpenGraph/Twitter card) | N/A (social card) |
| `avatar-studio-voice.mp3` | audio | — | — | — | 600,961 | MP3 | **none** found in source grep (candidate orphan) | N/A (audio) |
| `minivic-greeting.mp3` | audio | — | — | — | 417,702 | MP3 | `components/MiniVicBot.tsx`, digest in `app/data/generated/greeting-asset.ts` | N/A (audio) |
| `minivic-greeting.txt` | text | — | — | — | 384 | text | greeting transcript | N/A |

**Retired (history, not current state):** `my-hero-avatar.mp4` at **640×360@24, 5.875 s, 160,156 B** was an unreferenced orphan under that same filename at `b2ac21b`; it was deleted by the §8 AP pass on 2026-09-05 (`git rm public/assets/my-hero-avatar.mp4`), and the filename was later re-used by §9–§10 for the current 1280×720 canonical loop — they are not the same bytes. `my-avatar.mp4` (the 1280×720@24, 1,096,301 B colour loop that shipped between §8 and §9) no longer exists in `public/assets/`; its old URL is a `firebase.json` **301** to `/assets/my-hero-avatar.mp4` (`{ "source": "/assets/my-avatar.mp4", "destination": "/assets/my-hero-avatar.mp4", "type": 301 }`).

Budget check: the base rung (1.83 MB) is under the 2.5 MB critical-path video budget and is `preload="none"` (fetched on hover/focus/press only); the two on-demand rungs are under the 5 MB on-demand budget and carry no `src` until a reader asks to play (`scripts/validate/overhaul_static_audit.mjs` TC-NFR-PERF). Every still is under the 500 kB image budget.

### Reproduce

```bash
cd public/assets
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size \
  -of default=noprint_wrappers=0 my-hero-avatar.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration,size \
  -of default=noprint_wrappers=0 avatar/my-hero-avatar-1080.mp4 avatar/my-hero-avatar-2160.webm
for f in my_avatar.avif my_avatar.webp my_avatar.png hero-atmosphere-poster.avif og-image.png; do
  identify -format '%f  %wx%h  %m  %B bytes\n' "$f"
done
```

---

## 2. The hero video ladder, as shipped

### `my-hero-avatar.mp4` — the live portrait loop, base rung (720p24)
- **1280×720, 24 fps, 12.29 s, 1,916,328 B, H.264 High@3.1, greyscale.**
- This is the canonical hero portrait hover loop (`avatarContent.loop.src`, `ladder[0]` in `app/data/portfolio/avatar.ts`) and the MiniVic bot talking-head. It is a downscale of the genuine 3840×2160@24 master (`artifacts/masters/minivic-greeting-2160p-master.mp4`, never committed) — never an upscale (§9–§10). It is the default and the fallback: the only rung on the critical-path 2.5 MB video budget, what a save-data reader or a browser with no AV1 decoder receives, and `preload="none"` (assigned on first hover/focus/press).
- The old URL `/assets/my-avatar.mp4` — a different, colour, 1,096,301 B encode that shipped between §8 and §9 — is now a `firebase.json` **301** to this path; one binary, one URL.
- **R5: OPEN** for this rung on its own (720p24 is neither 4K nor 60 fps); see the ladder as a whole in §2's next two entries and §10.4 for the overall R5 position.

### `avatar/my-hero-avatar-1080.mp4` and `avatar/my-hero-avatar-2160.webm` — the on-demand rungs
- **1080p:** 1920×1080, 24 fps, 12.29 s, 3,690,721 B, H.264 High@5.0 (CRF 21, `-preset slow`), greyscale.
- **2160p:** 3840×2160, 24 fps, 12.29 s, 2,913,450 B, AV1 Main@5.0 (SVT-AV1 CRF 40, `-preset 8`), greyscale — the master's own resolution, at less than the 1080p rung's bitrate.
- Both are `ladder[1]`/`ladder[2]` in `app/data/portfolio/avatar.ts`, chosen at play time by `lib/videoRung.ts` (rendered CSS height × devicePixelRatio, gated by Save-Data and `canPlayType`) and carry no `src` until a reader asks to play, which is why the audit gives them a 5 MB on-demand budget instead of the 2.5 MB critical-path one.
- **R5:** the 2160p rung meets the resolution half of R5 with a genuine downscale-free encode of the master, but the master itself is 24 fps, not 60 — R5 stays **OPEN** until a real ≥2160p60 capture or generation lands (§10.4).

### `my-hero-avatar.mp4` — the 640×360 orphan of `b2ac21b` → **RETIRED 2026-09-05**
- **History only, not the current file.** At `b2ac21b` this filename pointed to a 640×360, 24 fps, 5.875 s, 160,156 B, H.264 file that was **unreferenced by the shipped app** — `grep -rn "my-hero-avatar" app components public firebase.json` returned zero hits at that commit. Every match on the host was non-shipping: a kanban task-description string (`scripts/pm/board_bootstrap_v10.mjs`), a stale legacy Lighthouse snapshot of a pre-Next.js static page that is not in `public/` today, and documentation/evidence.
- **Retired by the §8 AP pass** (`git rm public/assets/my-hero-avatar.mp4`, `t_g2_h5`). The filename was subsequently re-assigned by §9–§10 to the current canonical 1280×720 loop described above — the two are different bytes at the same path, at different times, and the 640×360 orphan is **not** part of the live asset set.

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

`og-image.png` was outside this gap's scope when this section was written, but a same-wave sibling (G-OG1) has since replaced it: the live file is now **2400×1260, 209,035 B** (§1), not the 1200×630 card described here at the time.

---

## 10. 2026-09-06 — the ladder is published: on-demand 1080p and 2160p rungs (G-H5 correction)

- **Task:** `t_w1_h5b` · **Identity:** analyst-programmer / ap-w1-h5b · **Reviewer finding corrected:** `docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/08-adversarial-review.md` §G-H5
- **Worktree:** `worktree-w1-h5b` from `origin/main` (`ec53e2b`) · **Encoded:** 2026-09-06T01:17–01:22Z on VPS srv1356245 · `ffmpeg` 8.0.1 (libx264, SVT-AV1)
- **This section moved.** The file was `docs/delivery/evidence/v10-20260905T0515Z/G2-H5/asset-ladder.md`; it is now `docs/architecture/ASSET-LADDER.md`, because it is a standing architecture document rather than one run's evidence (`git mv`, history preserved).

### 10.1 What was wrong with §9

§9 shipped one rung, 720p, and justified it with the 2.5 MB critical-path video budget. That justification was true and insufficient. A genuine 3840×2160 master exists on this host and a 1080p variant of the same shot exists beside it, so "720p is what the source honestly carries" was **not** available as an escape hatch, and the larger URLs a reader (or a reviewer) would try — `my-hero-avatar-1080.mp4`, `my-hero-avatar-2160.*` — **all 404ed**. A ladder that is only a paragraph is not a ladder.

### 10.2 The rungs now published

All three are cut from `artifacts/masters/minivic-greeting-2160p-master.mp4` (3840×2160 @ 24 fps, 58,370,772 B, **never committed**), greyscale in the bytes (`format=gray,format=yuv420p`), no audio. Nothing is upscaled: the top rung is the master's own resolution.

| Rung | File | Dimensions | fps | Bytes | Codec | Budget | Measured chroma |
|------|------|-----------|-----|-------|-------|--------|-----------------|
| base (default, fallback) | `public/assets/my-hero-avatar.mp4` | 1280×720 | 24 | 1,916,328 (1.83 MB) | H.264 High@3.1 | 2.5 MB critical-path | 0/255 |
| on-demand | `public/assets/avatar/my-hero-avatar-1080.mp4` | 1920×1080 | 24 | 3,690,721 (3.52 MB) | H.264 High@5.0, CRF 21 `-preset slow` | 5 MB on-demand | 0/255 |
| on-demand | `public/assets/avatar/my-hero-avatar-2160.webm` | 3840×2160 | 24 | 2,913,450 (2.78 MB) | AV1 Main@5.0, SVT-AV1 CRF 40 `-preset 8` | 5 MB on-demand | 0/255 |

`scripts/validate/overhaul_static_audit.mjs` (TC-NFR-PERF) gives `assets/avatar/*` a 5 MB budget precisely because that `<video>` carries no `src` until a reader presses play; the base rung stays on the 2.5 MB budget and is the only file any reader fetches by default. Audit after the change: **10/10**.

**Measured quality of the top rung:** `ffmpeg -lavfi ssim` against the master's own greyscale, all 295 frames → **Y = 0.974979** (`U`/`V` = 1.000000, both planes flat by construction). Monochrome 24 fps compresses far better than the §9.2 estimate of "≈20 MB+": AV1 lands the master's full resolution at *less* than the 1080p H.264 rung.

```bash
ffmpeg -i artifacts/masters/minivic-greeting-2160p-master.mp4 \
  -vf 'scale=1920:1080:flags=lanczos,format=gray,format=yuv420p' \
  -c:v libx264 -preset slow -crf 21 -an -movflags +faststart public/assets/avatar/my-hero-avatar-1080.mp4
ffmpeg -i artifacts/masters/minivic-greeting-2160p-master.mp4 \
  -vf 'format=gray,format=yuv420p' -c:v libsvtav1 -preset 8 -crf 40 -g 48 -an \
  public/assets/avatar/my-hero-avatar-2160.webm
```

### 10.3 How a rung is chosen

`lib/videoRung.ts`, called at the moment a source is assigned (`components/sections/Hero/HeroPortrait.tsx`, `components/MiniVicBot.tsx`), never at load:

```
need = the video box's rendered CSS height × devicePixelRatio
rung = the smallest published rung whose height ≥ need
```

with three hard edges: `navigator.connection.saveData` pins the choice to the base rung; a rung whose container/codec the browser refuses (`canPlayType` → `''`) is not a candidate, so a browser with no AV1 decoder lands on 1080p H.264; and nothing above the largest playable rung exists. The rule is pure and pinned by `tests/unit/video-rung.spec.ts` (RUNG-01…09).

**What that means on this layout, measured on the static export** (`tests/e2e/hero-photo.spec.ts` TC-PHOTO-13…19):

| Screen | Portrait box | need | Rung served |
|--------|--------------|------|-------------|
| 1440 @ 1×/2× | 305 CSS px | 305 / 611 | 720p (base) |
| 390 @ 3× | 218 CSS px | 653 | 720p (base) |
| 1440 @ 3× | 305 CSS px | 916 | **1080p** |
| 1440 @ 3×, Save-Data | 305 CSS px | 916 | 720p (base) |
| 1440 @ 3×, no AV1 decoder | 305 CSS px | 916 | **1080p** H.264 |
| 4K window @ 2× (portrait box ≥ 540 CSS px) | — | > 1080 | **2160p** |

The hero's own media rect is capped by the column at **321 CSS px**, so on today's layout the 2160p rung is reached only by a display whose box × DPR exceeds 1080 device px — a 4K/5K desktop with the window wide, or any future full-bleed presentation of the same loop. It is published so the URL is real and the ladder genuinely reaches the master's resolution; it costs a normal reader **nothing**, because no rung is fetched until a reader asks (TC-PHOTO-19 asserts zero requests at rest).

### 10.4 R5, still honestly

**R5 (≥ 3840×2160 @ 60 fps, or resolution-independent) remains OPEN.** The ladder now reaches 3840×2160 — the resolution half of R5 is met by a real downscale-free encode of a real master — but **the master is 24 fps, not 60**, and 24 captured frames are not made into 60 by interpolation. No 60 fps portrait source exists on this host, so R5 stays OPEN until a genuine ≥ 2160p60 capture or a paid generation lands. Nothing in the shipped code or copy presents 24 fps as 60.

### 10.5 Verify

```bash
node --test tests/hero_assets_monochrome.test.mjs          # 20/20 — every rung: dims, fps, ≤5 MB, chroma 0
npx playwright test tests/unit/video-rung.spec.ts          # 9/9 — the selection rule
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5606 \
  npx playwright test tests/e2e/hero-photo.spec.ts         # TC-PHOTO-13…19 — the wiring, on the export
node scripts/validate/overhaul_static_audit.mjs            # 10/10 (budgets included)
```
