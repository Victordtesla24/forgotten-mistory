import { expect, test } from '@playwright/test';

import { avatarContent } from '../../app/data/portfolio/avatar';
import { selectVideoRung, type RungConditions, type VideoRung } from '../../lib/videoRung';

/* -------------------------------------------------------------------------- */
/* lib/videoRung.ts — the rule that picks an encode (G-H5).                    */
/*                                                                            */
/* The ladder only earns its bytes if the choice between rungs is arithmetic   */
/* and predictable, so the rule is a pure function and this is where it is     */
/* pinned. No browser is launched here: the unit is `selectVideoRung`, and its */
/* four inputs — rendered height, DPR, Save-Data and codec support — are       */
/* passed in rather than read from a window.                                   */
/*                                                                            */
/* The contract, from docs/architecture/ASSET-LADDER.md:                       */
/*   need = rendered CSS height x devicePixelRatio                             */
/*   rung = the smallest published rung whose height >= need                   */
/*   · Save-Data pins the choice to the base rung;                             */
/*   · a rung the browser will not commit to is not a candidate;               */
/*   · nothing above the largest playable rung exists.                         */
/* -------------------------------------------------------------------------- */

const LADDER = avatarContent.loop.ladder;
const H264 = /video\/mp4/;

/** A browser that plays everything the site ships, including AV1 in WebM. */
const modern = (type: string) => type.length > 0;
/** Safari 16 on an Intel Mac: H.264 in MP4, no AV1 decoder. */
const noAv1 = (type: string) => H264.test(type);

function conditions(partial: Partial<RungConditions>): RungConditions {
  return {
    renderedHeight: 400,
    devicePixelRatio: 1,
    saveData: false,
    canPlay: modern,
    ...partial,
  };
}

function pick(partial: Partial<RungConditions>): VideoRung {
  return selectVideoRung(LADDER, conditions(partial));
}

test.describe('the ladder itself', () => {
  test('RUNG-01: three rungs, ascending, the critical-path 720p file first', () => {
    expect(LADDER.map((rung) => rung.height)).toEqual([720, 1080, 2160]);
    expect(LADDER[0].src).toBe('/assets/my-hero-avatar.mp4');
    for (const rung of LADDER.slice(1)) {
      expect(rung.src, 'every rung above the base is on the on-demand path').toContain('/assets/avatar/');
    }
    // 16:9 throughout — a rung that declared a different shape would letterbox
    // against the same box the still fills.
    for (const rung of LADDER) {
      expect(rung.width / rung.height).toBeCloseTo(16 / 9, 3);
    }
  });
});

test.describe('selectVideoRung', () => {
  test('RUNG-02: a 1x screen never leaves the base rung until the box is bigger than it', () => {
    expect(pick({ renderedHeight: 400, devicePixelRatio: 1 }).height).toBe(720);
    expect(pick({ renderedHeight: 719, devicePixelRatio: 1 }).height).toBe(720);
    expect(pick({ renderedHeight: 721, devicePixelRatio: 1 }).height).toBe(1080);
  });

  test('RUNG-03: DPR multiplies the need — 400 CSS px at 2x asks for 800 device px', () => {
    expect(pick({ renderedHeight: 400, devicePixelRatio: 2 }).height).toBe(1080);
    expect(pick({ renderedHeight: 360, devicePixelRatio: 2 }).height).toBe(720);
    expect(pick({ renderedHeight: 500, devicePixelRatio: 3 }).height).toBe(2160);
  });

  test('RUNG-04: nothing above the top rung exists — a wall display gets 2160p, not an error', () => {
    expect(pick({ renderedHeight: 2000, devicePixelRatio: 2 }).height).toBe(2160);
  });

  test('RUNG-05: Save-Data pins the choice to the base rung, whatever the screen', () => {
    expect(pick({ renderedHeight: 1200, devicePixelRatio: 3, saveData: true }).src).toBe(LADDER[0].src);
  });

  test('RUNG-06: a browser with no AV1 decoder lands on 1080p H.264, never on a file it cannot play', () => {
    const chosen = pick({ renderedHeight: 900, devicePixelRatio: 2, canPlay: noAv1 });
    expect(chosen.height).toBe(1080);
    expect(chosen.type).toMatch(H264);
  });

  test('RUNG-07: a browser that refuses everything still gets the base rung', () => {
    expect(pick({ renderedHeight: 1200, devicePixelRatio: 3, canPlay: () => false }).src).toBe(LADDER[0].src);
  });

  test('RUNG-08: an unmeasured or nonsense box falls back to the base rung', () => {
    expect(pick({ renderedHeight: 0, devicePixelRatio: 3 }).height).toBe(720);
    expect(pick({ renderedHeight: Number.NaN, devicePixelRatio: 2 }).height).toBe(720);
    expect(pick({ renderedHeight: -400, devicePixelRatio: 2 }).height).toBe(720);
    // A DPR below 1 is a reporting artefact, not an instruction to under-serve.
    expect(pick({ renderedHeight: 800, devicePixelRatio: 0 }).height).toBe(1080);
  });

  test('RUNG-09: an empty ladder is a programming error, not a silent fallback', () => {
    expect(() => selectVideoRung([], conditions({}))).toThrow(/empty/);
  });
});
