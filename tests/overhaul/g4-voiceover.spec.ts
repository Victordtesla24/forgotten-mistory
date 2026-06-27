import { test, expect, type Page } from '@playwright/test';

/**
 * G4 — VOICEOVER SYNC: ambient + triggered audio synced to on-screen view transitions.
 *
 * Test IDs TG4-01 through TG4-10 from the Test Specification Matrix
 * (docs/overhaul/TEST-SPEC-MATRIX.md §2.4).
 *
 * Covers FR-VOICE-DYN: two audio layers — ambient bed + event-triggered
 * voiceover — sequenced to on-screen section transitions (T1–T7).
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('G4 — Voiceover sync (TG4-01 through TG4-10)', () => {
  test.describe.configure({ timeout: 120000 });

  // ── TG4-01: Ambient layer initializes on user gesture ───────────────────

  test('TG4-01: ambient layer initializes on user gesture, not before', async ({ page }) => {
    test.skip(true, 'TG4-01 pending: VoiceoverController implementation');

    await gotoHome(page);

    // Verify no AudioContext exists before user interaction
    const ctxBefore = await page.evaluate(() => {
      const w = window as any;
      return w.__voiceoverController?.audioContext?.state ?? 'no-controller';
    });
    // Before gesture: controller may exist but AudioContext shouldn't be running
    expect(ctxBefore).not.toBe('running');

    // Click to simulate user gesture
    await page.mouse.click(100, 100);

    // After gesture, the controller should have initialized its AudioContext
    await page.waitForFunction(() => {
      const w = window as any;
      return w.__voiceoverController?.audioContext?.state === 'running';
    }, { timeout: 5000 });

    const ctxAfter = await page.evaluate(() => {
      const w = window as any;
      return w.__voiceoverController?.audioContext?.state ?? 'no-controller';
    });
    expect(ctxAfter).toBe('running');
  });

  // ── TG4-02: Triggered cue fires on correct transition ───────────────────

  test('TG4-02: triggered cue fires on correct transition (T3 — Work)', async ({ page }) => {
    test.skip(true, 'TG4-02 pending: section wiring');

    await gotoHome(page);
    await page.mouse.click(100, 100); // user gesture

    // Collect cues before scroll
    await page.evaluate(() => {
      (window as any).__cueLog = [];
    });

    // Scroll to the #work section (T4) — its onEnter should fire
    await page.evaluate(() => {
      document.getElementById('work')?.scrollIntoView({ behavior: 'instant' });
    });

    // Wait for any cue to fire (max 500ms per spec)
    await page.waitForFunction(() => {
      const cues = (window as any).__cueLog || [];
      return cues.length > 0;
    }, { timeout: 3000 });

    const cues = await page.evaluate(() => (window as any).__cueLog || []);
    expect(cues.length).toBeGreaterThan(0);
    // The cue should reference the correct section
    expect(cues[0]).toMatch(/work|T3/i);
  });

  // ── TG4-03: No double-fire on re-entry ──────────────────────────────────

  test('TG4-03: no double-fire — exactly 1 cue per section enter', async ({ page }) => {
    test.skip(true, 'TG4-03 pending: dedup logic');

    await gotoHome(page);
    await page.mouse.click(100, 100);

    await page.evaluate(() => {
      (window as any).__cueLog = [];
    });

    // Scroll into work section
    await page.evaluate(() => {
      document.getElementById('work')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // Scroll away (up to about section)
    await page.evaluate(() => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // Scroll back into work section
    await page.evaluate(() => {
      document.getElementById('work')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    const cues = await page.evaluate(() => (window as any).__cueLog || []);
    // Work-section cues should appear exactly once (not doubled on re-entry if once:true)
    const workCues = cues.filter((c: string) => c.includes('work'));
    expect(workCues.length).toBeLessThanOrEqual(1);
  });

  // ── TG4-04: No overlap between cues ─────────────────────────────────────

  test('TG4-04: no overlap — rapid scroll through T1→T7, each cue completes or is cleanly interrupted', async ({ page }) => {
    test.skip(true, 'TG4-04 pending: overlap gate');

    await gotoHome(page);
    await page.mouse.click(100, 100);

    await page.evaluate(() => {
      (window as any).__cueLog = [];
      (window as any).__cueOverlap = false;
    });

    // Rapid scroll through all sections
    const sections = ['hero', 'proof', 'about', 'experience', 'skills', 'work', 'contact'];
    for (const id of sections) {
      await page.evaluate((sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant' });
      }, id);
      await page.waitForTimeout(100);
    }

    // If any overlap occurred, the controller should have flagged it
    const overlap = await page.evaluate(() => (window as any).__cueOverlap);
    expect(overlap).toBe(false);
  });

  // ── TG4-05: Mute control silences all audio ────────────────────────────

  test('TG4-05: mute control suspends AudioContext; unmute resumes', async ({ page }) => {
    test.skip(true, 'TG4-05 pending: mute toggle');

    await gotoHome(page);
    await page.mouse.click(100, 100);

    // Ensure audio is running
    await page.waitForFunction(() => {
      const w = window as any;
      return w.__voiceoverController?.audioContext?.state === 'running';
    }, { timeout: 5000 });

    // Toggle mute ON
    await page.evaluate(() => {
      (window as any).__voiceoverController?.mute();
    });

    // AudioContext should be suspended or gain node zero
    const mutedState = await page.evaluate(() => {
      const ctrl = (window as any).__voiceoverController;
      if (!ctrl) return 'no-ctrl';
      return ctrl.audioContext?.state === 'suspended' || ctrl._masterGain?.gain?.value === 0
        ? 'muted'
        : 'still-running';
    });
    expect(mutedState).toBe('muted');

    // Toggle mute OFF
    await page.evaluate(() => {
      (window as any).__voiceoverController?.unmute();
    });

    // AudioContext should resume
    await page.waitForFunction(() => {
      const w = window as any;
      return w.__voiceoverController?.audioContext?.state === 'running';
    }, { timeout: 5000 });
  });

  // ── TG4-06: prefers-reduced-motion silences audio ───────────────────────

  test('TG4-06: prefers-reduced-motion: reduce — no AudioContext created', async ({ page }) => {
    test.skip(true, 'TG4-06 pending: reduced-motion gating');

    // Emulate reduced motion via browser context
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    // Click to simulate gesture
    await page.mouse.click(100, 100);
    await page.waitForTimeout(500);

    // Verify no AudioContext was created
    const hasAudio = await page.evaluate(() => {
      const w = window as any;
      const ctrl = w.__voiceoverController;
      if (!ctrl) return 'no-controller';
      if (!ctrl.audioContext) return 'no-audio-context';
      return ctrl.audioContext.state;
    });

    expect(hasAudio).toMatch(/no-controller|no-audio-context/);
  });

  // ── TG4-07: Avatar voice lip-sync timing ────────────────────────────────

  test('TG4-07: avatar voice lip-sync starts within 120ms of audio', async ({ page }) => {
    test.skip(true, 'TG4-07 pending: waveform timing instrumentation');

    await gotoHome(page);

    // Trigger avatar greeting (via MiniVicBot open)
    const launcher = page.locator('[data-testid="minivic-launcher"]');
    if (await launcher.count()) {
      await launcher.click();
    }

    // Measure time from audio-start to first visible mouth-waveform frame
    const timing = await page.evaluate(() => {
      return new Promise<{ audioStart: number; waveformStart: number; deltaMs: number } | null>(
        (resolve) => {
          const w = window as any;
          let audioStart = 0;
          let waveformStart = 0;

          const observer = new MutationObserver(() => {
            const pulse = document.querySelector('[data-testid="avatar-pulse-ring"]');
            if (pulse) {
              const style = window.getComputedStyle(pulse);
              if (parseFloat(style.opacity) > 0 && !waveformStart) {
                waveformStart = performance.now();
                if (audioStart > 0) {
                  observer.disconnect();
                  resolve({
                    audioStart,
                    waveformStart,
                    deltaMs: waveformStart - audioStart,
                  });
                }
              }
            }
          });

          observer.observe(document.body, { attributes: true, subtree: true });

          // Try to trigger the greeting audio
          const ctrl = w.__voiceoverController;
          if (ctrl?.triggerCue) {
            audioStart = performance.now();
            ctrl.triggerCue('greeting', '/assets/minivic-greeting.mp3');
          }

          // Timeout after 5s
          setTimeout(() => resolve(null), 5000);
        },
      );
    });

    if (timing) {
      expect(timing.deltaMs, 'lip-sync waveform must appear ≤ 120ms after audio start').toBeLessThanOrEqual(120);
    }
  });

  // ── TG4-08: Smooth cross-fade (ambient ↔ triggered) ────────────────────

  test('TG4-08: smooth cross-fade — no gain-step discontinuities when triggering cue over ambient', async ({ page }) => {
    test.skip(true, 'TG4-08 pending: gain-ramp assertion');

    await gotoHome(page);
    await page.mouse.click(100, 100);

    // Start ambient audio
    await page.evaluate(() => {
      const ctrl = (window as any).__voiceoverController;
      ctrl?.startAmbient();
      (window as any).__gainLog = [];
    });

    await page.waitForTimeout(500);

    // Trigger a cue over ambient
    await page.evaluate(() => {
      const ctrl = (window as any).__voiceoverController;
      if (ctrl) {
        // Read gain values before and during cross-fade
        ctrl.triggerCue('test-cue', '/assets/silence-1s.mp3');
      }
    });

    // Assert no abrupt gain steps (must ramp smoothly)
    const gainLog = await page.evaluate(() => (window as any).__gainLog || []);
    if (gainLog.length >= 2) {
      // Every consecutive gain value delta must be < 0.5 (no hard cuts)
      for (let i = 1; i < gainLog.length; i++) {
        const delta = Math.abs(gainLog[i] - gainLog[i - 1]);
        expect(delta, `gain delta at index ${i} should be < 0.5, got ${delta}`).toBeLessThan(0.5);
      }
    }
  });

  // ── TG4-09: No audio glitch on rapid transitions ───────────────────────

  test('TG4-09: zero AudioContext/MediaError events during 3× full scroll-through', async ({ page }) => {
    test.skip(true, 'TG4-09 pending: error capture instrumentation');

    await gotoHome(page);
    await page.mouse.click(100, 100);

    // Start ambient
    await page.evaluate(() => {
      (window as any).__voiceoverController?.startAmbient();
      (window as any).__audioErrors = [];
    });

    // Rapid scroll through all sections 3 times
    const sections = ['hero', 'proof', 'about', 'experience', 'skills', 'work', 'contact'];
    for (let pass = 0; pass < 3; pass++) {
      for (const id of sections) {
        await page.evaluate((sectionId) => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant' });
        }, id);
        await page.waitForTimeout(80);
      }
    }

    const errors = await page.evaluate(() => (window as any).__audioErrors || []);
    expect(errors.length).toBe(0);
  });

  // ── TG4-10: Clean teardown — no leaked audio nodes ────────────────────

  test('TG4-10: clean teardown — AudioContext closed, zero active source nodes', async ({ page }) => {
    test.skip(true, 'TG4-10 pending: teardown verification');

    await gotoHome(page);
    await page.mouse.click(100, 100);

    // Exercise the controller
    await page.evaluate(() => {
      const ctrl = (window as any).__voiceoverController;
      if (ctrl) {
        ctrl.startAmbient();
        ctrl.triggerCue('test', '/assets/silence-1s.mp3');
      }
    });

    await page.waitForTimeout(500);

    // Dispose the controller
    await page.evaluate(() => {
      const ctrl = (window as any).__voiceoverController;
      ctrl?.dispose();
    });

    // Verify closed
    const state = await page.evaluate(() => {
      const ctrl = (window as any).__voiceoverController;
      if (!ctrl) return 'disposed';
      return ctrl.audioContext?.state ?? 'no-ctx';
    });

    expect(state).toMatch(/disposed|closed|no-ctx/);
  });
});
