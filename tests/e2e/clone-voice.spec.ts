import { test, expect, type Page } from "@playwright/test";

/**
 * TC-FR-VOICE / TC-FR-VOICE-DYN — the voiceover controller's own contract.
 *
 * This file used to cover three subjects. Two of them no longer exist:
 *
 *   - The hero portrait (`HeroAvatar`, rendered into `.avatar-placeholder` with
 *     a pulse ring and a still→MP4 crossfade) was deleted with the hero
 *     rebuild. The front door is now type, a three-figure ledger and two links,
 *     with no image at all, so the CLS-reservation, crossfade, pulse-ring and
 *     speaking-state tests had nothing left to assert against. The avatar that
 *     does exist now lives at the end of the page in `#listen`, is a different
 *     component with a different contract, and belongs to
 *     tests/e2e/listen.spec.ts.
 *   - The D-ID/ElevenLabs viseme bridge and the `/api/avatar/*` and
 *     `/api/viseme/*` gateway routes belong to `services/`, which the static
 *     export does not host. The three tests aimed at them either swallowed
 *     their own failure in a `try`/`catch` and asserted nothing, or accepted
 *     any of four status codes — neither can fail, so neither was protecting
 *     anything.
 *
 * The third subject is untouched and is the whole of this file now.
 * `MotionProvider` still wraps the page from `app/layout.tsx` and still mounts
 * `VoiceoverProvider`, which attaches the controller to
 * `window.__voiceoverController`. Its guarantees — starts muted, initialises
 * only on a user gesture, dedupes a cue per section, ducks and restores the
 * ambient bed — are real invariants about audio never starting behind a
 * visitor's back, and they survive the page rebuild completely.
 *
 * One repair inside that subject: the ScrollTrigger bridge test used to
 * dispatch `gsap:proof:enter`, and `#proof` is one of the deleted sections. It
 * now dispatches `gsap:hero:enter`, so the wiring is proved against a section
 * that is actually on the page.
 */

// -- Helpers ---------------------------------------------------------------

async function gotoHome(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // No preloader to wait out: the hero is server-rendered, and app/page.tsx
  // raises `page-ready` on the frame after mount.
  await page
    .waitForFunction(() => document.body.classList.contains("page-ready"), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator("#hero").waitFor({ state: "visible", timeout: 15000 });
}

// -- TC-FR-VOICE: Voiceover system ----------------------------------------

test.describe("TC-FR-VOICE: Voiceover system", () => {
  test.describe.configure({ timeout: 60000 });

  test("voiceover controller is attached to window by the layout provider", async ({ page }) => {
    await gotoHome(page);

    const attached = await page.evaluate(
      () => !!(window as unknown as Record<string, unknown>).__voiceoverController,
    );
    expect(attached).toBe(true);
  });

  test("voiceover controller starts muted, before any gesture", async ({ page }) => {
    await gotoHome(page);

    // This is the invariant that matters most on a portfolio: a visitor who
    // lands and reads must not have audio start at them. Muted is the default
    // and stays the default until something they did says otherwise.
    const initialState = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | { state?: { muted?: boolean } }
        | undefined;
      return ctrl?.state?.muted;
    });
    expect(initialState).toBe(true);
  });

  test("voiceover controller respects the mute toggle once initialised", async ({ page }) => {
    await gotoHome(page);

    const afterUnmute = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | {
            init?: () => boolean;
            unmute?: () => void;
            state?: { muted?: boolean };
          }
        | undefined;
      if (ctrl?.init?.()) ctrl.unmute?.();
      return ctrl?.state?.muted;
    });
    expect(afterUnmute).toBe(false);

    const afterMute = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | { toggleMute?: () => boolean; state?: { muted?: boolean } }
        | undefined;
      ctrl?.toggleMute?.();
      return ctrl?.state?.muted;
    });
    expect(afterMute).toBe(true);
  });

  test("voiceover controller fires each section cue exactly once", async ({ page }) => {
    await gotoHome(page);

    const firedCount = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | {
            init?: () => boolean;
            triggerCue?: (id: string) => void;
            state?: { firedSections?: { size: number } };
          }
        | undefined;
      ctrl?.init?.();
      ctrl?.triggerCue?.("hero");
      ctrl?.triggerCue?.("hero"); // duplicate — must be a no-op
      return ctrl?.state?.firedSections?.size ?? 0;
    });

    expect(firedCount).toBe(1);
  });

  test("voiceover controller ambient bed starts and stops", async ({ page }) => {
    await gotoHome(page);

    const ambientActive = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | {
            init?: () => boolean;
            unmute?: () => void;
            startAmbient?: () => void;
            state?: { ambientActive?: boolean };
          }
        | undefined;
      ctrl?.init?.();
      ctrl?.unmute?.();
      ctrl?.startAmbient?.();
      return ctrl?.state?.ambientActive;
    });
    expect(ambientActive).toBe(true);

    const afterStop = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | { stopAmbient?: () => void; state?: { ambientActive?: boolean } }
        | undefined;
      ctrl?.stopAmbient?.();
      return ctrl?.state?.ambientActive;
    });
    expect(afterStop).toBe(false);
  });
});

// -- TC-FR-VOICE-DYN: Dynamic voiceover cues ------------------------------

test.describe("TC-FR-VOICE-DYN: Dynamic voiceover cues", () => {
  test.describe.configure({ timeout: 60000 });

  test("a gsap:<section>:enter event reaches the controller as a cue", async ({ page }) => {
    await gotoHome(page);

    // The bridge in lib/voiceoverContext.tsx listens for the CustomEvents a
    // scroll trigger dispatches and turns them into cues, so a section can gain
    // a voiceover without being rewritten. `#hero` is used deliberately: it is a
    // section that still exists, unlike the `#proof` this test used to name.
    const cueFired = await page.evaluate(async () => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | { init?: () => boolean; state?: { firedSections?: Set<string> } }
        | undefined;
      ctrl?.init?.();
      document.dispatchEvent(new CustomEvent("gsap:hero:enter"));
      await new Promise((resolve) => setTimeout(resolve, 100));
      return ctrl?.state?.firedSections?.has("hero") ?? false;
    });

    expect(cueFired).toBe(true);
  });

  test("the cue log records triggered sections in order", async ({ page }) => {
    await gotoHome(page);

    const cueLog = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | {
            init?: () => boolean;
            triggerCue?: (id: string) => void;
            cueLog?: Array<{ sectionId: string }>;
          }
        | undefined;
      ctrl?.init?.();
      ctrl?.triggerCue?.("hero");
      ctrl?.triggerCue?.("experience");
      ctrl?.triggerCue?.("listen");
      return (ctrl?.cueLog ?? []).map((entry) => entry.sectionId);
    });

    // The section ids are the page's own, so a renamed section shows up here
    // rather than silently logging a cue nobody can trace back to a screen.
    expect(cueLog).toEqual(["hero", "experience", "listen"]);
  });

  test("under reduced motion the controller refuses to initialise audio at all", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await gotoHome(page);

    // Reduced motion is not only about movement — a reader who has asked for it
    // should not be handed an ambient bed either. `init()` returns false and the
    // AudioContext is never constructed, so nothing can play later by accident.
    const result = await page.evaluate(() => {
      const ctrl = (window as unknown as Record<string, unknown>).__voiceoverController as
        | { init?: (reduced?: boolean) => boolean; state?: { initialised?: boolean; muted?: boolean } }
        | undefined;
      const ok = ctrl?.init?.(true);
      return { ok, initialised: ctrl?.state?.initialised, muted: ctrl?.state?.muted };
    });

    expect(result.ok).toBe(false);
    expect(result.initialised).toBe(false);
    expect(result.muted).toBe(true);
    await context.close();
  });
});
