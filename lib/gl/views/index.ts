import type { ViewFactory } from './types';

/**
 * Every view by the id its placeholder carries in `data-stage-view`. Each loads on its own,
 * only when its placeholder is near the viewport.
 */
export const viewLoaders: Readonly<Record<string, () => Promise<ViewFactory>>> = {
  'hero-field': () => import('./hero-field').then((module) => module.createHeroField),
};
