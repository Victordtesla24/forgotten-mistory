import type { WebGLRenderer } from 'three';

import type { PointerState } from '../pointer';
import type { LiveTier } from '../tier';

/** The rectangle a view is drawn into, in CSS pixels of the canvas, with y up from its bottom edge. */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Everything a view needs to draw one frame. */
export interface FrameInput {
  /** Milliseconds since this view first drew, on the stage clock. */
  time: number;
  /** Milliseconds since the previous frame, at most 50. */
  dt: number;
  viewport: Viewport;
  /** The placeholder's rectangle in client coordinates, for relating the pointer to the view. */
  client: { left: number; top: number; width: number; height: number };
  pixelRatio: number;
  pointer: PointerState;
}

export interface View {
  /** True when the view leans towards the pointer, so the stage wakes for pointer moves. */
  readonly pointer: boolean;
  /** Advances the view to `input.time`. Returns true while it still needs another frame. */
  update(input: FrameInput): boolean;
  /** Draws into the viewport and scissor the stage has already set. */
  render(renderer: WebGLRenderer): void;
  /** Switches between marks counts when the tier changes. */
  setTier(tier: LiveTier): void;
  dispose(): void;
}

export interface ViewContext {
  tier: LiveTier;
  element: HTMLElement;
}

export type ViewFactory = (context: ViewContext) => View;
