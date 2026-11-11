import { CAREER_VIEW } from '../ids';
import type { ViewFactory } from './types';

/**
 * Every view by the id its placeholder carries in `data-stage-view`. Each loads on its own,
 * only when its placeholder is near the viewport.
 */
export const viewLoaders: Readonly<Record<string, () => Promise<ViewFactory>>> = {
  [CAREER_VIEW]: () => import('./career-scale').then((module) => module.createCareerScale),
  'hero-field': () => import('./hero-field').then((module) => module.createHeroField),
  'reading-evidence': () => import('./reading-evidence').then((module) => module.createReadingEvidence),
  'reading-portfolio': () => import('./reading-portfolio').then((module) => module.createReadingPortfolio),
  'reading-telemetry': () => import('./reading-telemetry').then((module) => module.createReadingTelemetry),
};
