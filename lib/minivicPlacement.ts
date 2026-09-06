/**
 * Where the open MiniVic panel may sit, so that it never covers the hero name.
 *
 * REGRESSION rev-97e19d07-w1 F-2. The panel is anchored to its launcher in the
 * bottom-right corner, and at 1440x900 that put it at {l:984,t:360,r:1416,b:812}
 * while the h1's glyphs ran x 560→1215, y 480→660: 231px of "Vikram Deshpande"
 * was painted over, and the reader was left with "Vikram Deshpa". The earlier
 * fix capped the panel's height — a vertical clearance, asserted on one axis,
 * which is meaningless while the two boxes still overlap horizontally.
 *
 * The rule this module encodes is the two-axis one: the panel's box must be
 * separated from the union of the name's glyph rects by at least
 * `MINIVIC_CLEARANCE` px on at least one axis. Four placements can achieve
 * that without moving the name, and they are tried in this order, because each
 * one costs the reader more than the one before it:
 *
 *   1. narrow the panel against its right anchor, so it stands beside the name;
 *   2. shorten it, so it sits below the name;
 *   3. flip it to the free side of the viewport, left of the name;
 *   4. lift it above the name, into the band under the page chrome.
 *
 * A placement is only taken if what is left is still a usable dialog
 * (`MIN_USABLE_WIDTH` × `MIN_USABLE_HEIGHT`) — clearing the name by shrinking
 * the panel to a sliver is not a fix. If none of the four clears that bar, the
 * roomiest of them is used anyway: every candidate is non-overlapping by
 * construction, so the name stays legible whatever the viewport does.
 *
 * The numbers all come from the DOM at open time — the natural panel box and
 * the measured glyph run — so this keeps working when the hero's type scale
 * changes underneath it (the Hero S3 pass reduces the h1 to
 * clamp(3.25rem, 8vw, 7rem), which lets placement 1 win at 1440 again).
 */

/** A viewport-space box, in CSS px, as `getBoundingClientRect()` reports it. */
export type PlacementRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/**
 * The caps to apply to the panel. `null` means "leave the stylesheet's own
 * value alone"; `shift` and `lift` are how far left of, and above, its anchor
 * the panel is drawn.
 */
export type PanelPlacement = {
  widthCap: number | null;
  heightCap: number | null;
  /** How far left of its anchor the panel is drawn, in px. */
  shift: number;
  /** How far above its anchor the panel is drawn, in px. */
  lift: number;
};

/** The gap a reader needs between the panel's edge and the name's glyphs. */
export const MINIVIC_CLEARANCE = 16;

/** Below this the transcript, the composer and the prompts stop coexisting. */
export const MIN_USABLE_WIDTH = 320;

/** The dialog's own 19rem floor, in px — see `.minivic-panel` in globals.css. */
export const MIN_USABLE_HEIGHT = 304;

/** The page gutter the flipped panel keeps against the left viewport edge. */
export const VIEWPORT_EDGE = 24;

/**
 * One px of slack on top of the clearance, because the boxes this works from
 * are fractional and the caps are written back as whole px. Without it a
 * placement computed to exactly 16px measured 15.4px at 1440x900 — the panel
 * bottom landed on 464.6, the name's glyphs start at 480.05 — and the contract
 * failed on a rounding, not on a placement. `tightenPlacement` below is what
 * actually guarantees the contract; this only keeps it from being needed.
 */
export const PLACEMENT_MARGIN = 2;

/** The natural placement: whatever the stylesheet already says. */
export const NATURAL_PLACEMENT: PanelPlacement = {
  widthCap: null,
  heightCap: null,
  shift: 0,
  lift: 0,
};

/**
 * How far apart two boxes are on their best axis. Positive is a real gap;
 * zero is a shared edge; negative is an overlap.
 */
export function rectSeparation(panel: PlacementRect, run: PlacementRect): number {
  return Math.max(
    run.left - panel.right,
    panel.left - run.right,
    panel.top - run.bottom,
    run.top - panel.bottom,
  );
}

type Candidate = {
  placement: PanelPlacement;
  width: number;
  height: number;
};

/**
 * Choose the panel's placement for one open panel and one measured name.
 *
 * @param natural the panel's box with no caps applied, measured from the DOM
 * @param run the union of the hero name's glyph rects, or `null` when the name
 *   is not in the document (the panel then keeps its natural placement)
 * @param topLimit the highest viewport-space y the panel may reach when it is
 *   lifted above the name — the page chrome's bottom edge plus its clearance
 */
export function placeMiniVicPanel(
  natural: PlacementRect,
  run: PlacementRect | null,
  topLimit = 0,
): PanelPlacement {
  if (!run) return NATURAL_PLACEMENT;
  if (rectSeparation(natural, run) >= MINIVIC_CLEARANCE) return NATURAL_PLACEMENT;

  const naturalWidth = natural.right - natural.left;
  const naturalHeight = natural.bottom - natural.top;
  const usableWidth = Math.min(MIN_USABLE_WIDTH, naturalWidth);
  const usableHeight = Math.min(MIN_USABLE_HEIGHT, naturalHeight);

  const clearance = MINIVIC_CLEARANCE + PLACEMENT_MARGIN;
  const candidates: Candidate[] = [];

  // 1. Beside the name: keep the right anchor, give up width.
  const besideWidth = natural.right - (run.right + clearance);
  if (besideWidth > 0) {
    candidates.push({
      placement: { widthCap: besideWidth, heightCap: null, shift: 0, lift: 0 },
      width: Math.min(besideWidth, naturalWidth),
      height: naturalHeight,
    });
  }

  // 2. Below the name: keep the width, give up height. The panel is anchored to
  //    the bottom of the dock, so a shorter panel starts lower.
  const belowHeight = natural.bottom - (run.bottom + clearance);
  if (belowHeight > 0) {
    candidates.push({
      placement: { widthCap: null, heightCap: belowHeight, shift: 0, lift: 0 },
      width: naturalWidth,
      height: Math.min(belowHeight, naturalHeight),
    });
  }

  // 3. Left of the name: the panel keeps its size and leaves its anchor, which
  //    is the only placement left when the name is wide enough to own both the
  //    right gutter and the height of the fold.
  const flippedRight = run.left - clearance;
  const flippedWidth = Math.min(naturalWidth, flippedRight - VIEWPORT_EDGE);
  if (flippedWidth > 0) {
    candidates.push({
      placement: {
        widthCap: flippedWidth,
        heightCap: null,
        shift: natural.right - flippedRight,
        lift: 0,
      },
      width: flippedWidth,
      height: naturalHeight,
    });
  }

  // 4. Above the name: the panel leaves its bottom anchor and takes the band
  //    between the page chrome and the top of the name. This is the only
  //    placement left when the name runs the width of the fold — as it does at
  //    1440x900 today, where its glyphs span x 96→1215 across two lines and
  //    neither gutter is wide enough for a dialog.
  const aboveBottom = run.top - clearance;
  const aboveHeight = Math.min(naturalHeight, aboveBottom - topLimit);
  if (aboveHeight > 0) {
    candidates.push({
      placement: {
        widthCap: null,
        heightCap: aboveHeight,
        shift: 0,
        lift: natural.bottom - aboveBottom,
      },
      width: naturalWidth,
      height: aboveHeight,
    });
  }

  if (candidates.length === 0) return NATURAL_PLACEMENT;

  const usable = candidates.find(
    (candidate) => candidate.width >= usableWidth && candidate.height >= usableHeight,
  );
  if (usable) return usable.placement;

  // Nothing clears the name and stays a comfortable dialog. Every candidate
  // still clears the name, so take the roomiest one: the name is what a reader
  // came for, and the panel says the rest itself.
  return candidates.reduce((best, candidate) =>
    candidate.width * candidate.height > best.width * best.height ? candidate : best,
  ).placement;
}

/**
 * Pull an applied placement back by `deficit` px along the axis it cleared on.
 *
 * The caps are computed from a box measured before they are applied, and the
 * applied box is not always exactly the one that was predicted — at 1366x768 it
 * came back 2px lower than the arithmetic said, which left 15px of clearance
 * where the contract asks for 16. Rather than trusting the prediction, the
 * component measures the panel again a frame after applying and, when it is
 * short, hands the shortfall here. The panel gives up that much of the axis it
 * is already giving up, so the correction can never introduce an overlap on
 * the other one.
 */
export function tightenPlacement(
  placement: PanelPlacement,
  deficit: number,
  naturalWidth: number,
  naturalHeight: number,
): PanelPlacement {
  if (deficit <= 0) return placement;
  const step = deficit + PLACEMENT_MARGIN;
  if (placement.lift > 0) {
    const height = (placement.heightCap ?? naturalHeight) - step;
    if (height <= 0) return placement;
    return { ...placement, lift: placement.lift + step, heightCap: height };
  }
  if (placement.shift > 0) {
    const width = (placement.widthCap ?? naturalWidth) - step;
    if (width <= 0) return placement;
    return { ...placement, shift: placement.shift + step, widthCap: width };
  }
  if (placement.heightCap !== null) {
    const height = placement.heightCap - step;
    if (height <= 0) return placement;
    return { ...placement, heightCap: height };
  }
  if (placement.widthCap !== null) {
    const width = placement.widthCap - step;
    if (width <= 0) return placement;
    return { ...placement, widthCap: width };
  }
  return placement;
}
