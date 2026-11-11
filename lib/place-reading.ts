/**
 * Puts a reading's DOM drawing where its layout says. Loaded by `ReadingTile` once the page is up,
 * so neither this nor the layout code is part of what the first screen waits for. It measures the
 * tile, asks `readingLayout` what the reading looks like at this size and this screen's pixel
 * ratio, and hands the answer to the drawing as custom properties in CSS pixels: the very layout
 * the stage's view draws, so the two coincide to the pixel.
 */

import { readingLayout, type ReadingId, type ReadingLayout, type ReadingPlace } from './readings';

/** Device pixels as CSS pixels of this screen, so a mark stands on a device pixel. */
const css = (device: number, ratio: number): string => `${device / ratio}px`;

/** What a layout gives the tile's drawing, as custom properties. */
function properties(layout: ReadingLayout): Record<string, string | number> {
  const { ratio, frame } = layout;
  const placed = {
    '--fx': css(frame.x, ratio),
    '--fy': css(frame.y, ratio),
    '--fw': css(frame.width, ratio),
    '--fh': css(frame.height, ratio),
    '--tx': '0px',
    '--ty': '0px',
  };
  if (layout.id === 'telemetry') {
    return {
      ...placed,
      '--side': layout.side === 0 ? 1000 : layout.side,
      '--pitch': css(layout.pitch, ratio),
      '--mark': css(layout.mark, ratio),
    };
  }
  if (layout.id === 'evidence') {
    return {
      ...placed,
      '--px': css(layout.pitchX, ratio),
      '--py': css(layout.pitchY, ratio),
      '--bx': css(layout.boxX, ratio),
      '--by': css(layout.boxY, ratio),
      '--ol': css(layout.outline, ratio),
      '--in': css(layout.inset, ratio),
      '--fl': css(layout.floor, ratio),
      '--cm': '0px',
    };
  }
  return {
    ...placed,
    '--pitch': css(layout.pitch, ratio),
    '--mark': css(layout.mark, ratio),
    '--over': css(Math.round(layout.pitch * 0.2), ratio),
    '--below': css(layout.baseline.y - layout.frame.y - layout.frame.height, ratio),
  };
}

/** Lays the drawing in `tile` out now and whenever the tile or the screen changes. Returns what stops it. */
export function placeReading(tile: HTMLElement, id: ReadingId, place: ReadingPlace): () => void {
  const apply = (): void => {
    // The drawing is placed from the tile's padding box, which is also what the stage's view covers. The borders are taken from the
    // style, not from the integers `offsetWidth` and `clientWidth` round to, so the size does not depend on where the tile falls on a pixel.
    const box = tile.getBoundingClientRect();
    const style = getComputedStyle(tile);
    const width = box.width - Number.parseFloat(style.borderLeftWidth) - Number.parseFloat(style.borderRightWidth);
    const height = box.height - Number.parseFloat(style.borderTopWidth) - Number.parseFloat(style.borderBottomWidth);
    if (width < 1 || height < 1) return;
    const layout = readingLayout(id, { width, height, ratio: window.devicePixelRatio }, place);
    for (const [name, value] of Object.entries(properties(layout))) tile.style.setProperty(name, String(value));
    tile.dataset.laid = '';
    // A panel's tile is as tall as its points and its key need; a card's is what the hero's grid says.
    if (layout.id === 'telemetry' && place === 'panel') tile.style.setProperty('--visual', `${layout.height}px`);
  };
  apply();
  const observer = new ResizeObserver(apply);
  observer.observe(tile);
  window.addEventListener('resize', apply);
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', apply);
  };
}
