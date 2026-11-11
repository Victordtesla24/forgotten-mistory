import { schematicIds, schematicView } from '../../schematic';
import { EXPERIENCE_VIEW } from '../ids';
import type { ViewFactory } from './types';

/**
 * Every view by the id its placeholder carries in `data-stage-view`. Each loads on its own,
 * only when its placeholder is near the viewport.
 */
export const viewLoaders: Readonly<Record<string, () => Promise<ViewFactory>>> = {
  [EXPERIENCE_VIEW]: () => import('./experience-timeline').then((module) => module.createExperienceTimeline),
  'hero-field': () => import('./hero-field').then((module) => module.createHeroField),
  'reading-evidence': () => import('./reading-evidence').then((module) => module.createReadingEvidence),
  'reading-portfolio': () => import('./reading-portfolio').then((module) => module.createReadingPortfolio),
  'reading-telemetry': () => import('./reading-telemetry').then((module) => module.createReadingTelemetry),
  // The light of each Work card; the enlarged schematic in a panel is drawn by the page alone.
  ...Object.fromEntries(schematicIds.map((id) => [schematicView(id, 'card'), () => import('./schematic').then((module) => module.createSchematicView(id))])),
};
