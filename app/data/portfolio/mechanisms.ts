import type { DrawingId } from './vitrine';

export interface MechanismStage {
  id: string;
  label: string;
  note: string;
}

export interface MechanismFact {
  drawing: DrawingId;
  label: string;
  provenance: string;
  schematic: string;
  source: string;
  limit: string;
  stages: readonly [MechanismStage, MechanismStage, MechanismStage];
}

export const mechanismFacts: Record<DrawingId, MechanismFact> = {
  'pipeline-gate': {
    drawing: 'pipeline-gate',
    label: 'Claim guard and revert gate',
    provenance: 'Plate 01 · aether-job-career-agent · drawing id pipeline-gate',
    schematic: 'Schematic · not live activity. Claim text passes through a résumé support guard; unsupported output returns to a revert path.',
    source: 'Source: plate description and limit for aether-job-career-agent.',
    limit: 'Limit: the public CI workflow is red on main; production deploys through a separate gated pipeline.',
    stages: [
      { id: 'claim', label: 'claim', note: 'A candidate claim enters the support check.' },
      { id: 'resume-guard', label: 'résumé guard', note: 'The guard only allows claims supported by the résumé.' },
      { id: 'revert', label: 'revert', note: 'Unsupported claims are returned, not published as evidence.' },
    ],
  },
  'rebuild-loop': {
    drawing: 'rebuild-loop',
    label: 'Push to container to site rebuild',
    provenance: 'Plate 02 · abentertainment · drawing id rebuild-loop',
    schematic: 'Schematic · not live activity. A push rebuilds the containerised site/admin path and returns to the published site.',
    source: 'Source: plate description and limit for abentertainment.',
    limit: 'Limit: content persists as flat JSON files, not a database — sized for one editor, not many.',
    stages: [
      { id: 'push', label: 'push', note: 'A repository push begins the rebuild path.' },
      { id: 'container', label: 'container', note: 'The site and admin portal are packaged as containers.' },
      { id: 'site', label: 'site', note: 'The public event-company site is the endpoint.' },
    ],
  },
  'verifier-loop': {
    drawing: 'verifier-loop',
    label: 'Work loop with signed verifier exit',
    provenance: 'Plate 03 · ralph-loop-infinite · drawing id verifier-loop',
    schematic: 'Schematic · not live activity. Work loops until the verifier signs an exit condition.',
    source: 'Source: plate description and limit for ralph-loop-infinite.',
    limit: 'Limit: a harness for his own machine, not a product; it assumes a trusted local environment.',
    stages: [
      { id: 'work', label: 'work', note: 'The local harness performs another work pass.' },
      { id: 'verifier', label: 'verifier', note: 'The verifier checks whether the pass actually passed.' },
      { id: 'exit', label: 'exit', note: 'Only a signed verifier result leaves the loop.' },
    ],
  },
  'reconstruction-bands': {
    drawing: 'reconstruction-bands',
    label: 'Prompt reconstruction bands',
    provenance: 'Plate 04 · prompt-reconstruction-engine · drawing id reconstruction-bands',
    schematic: 'Schematic · not live activity. A raw prompt is reconstructed into a specification, with provider failover when a model declines.',
    source: 'Source: plate description and limit for prompt-reconstruction-engine.',
    limit: 'Limit: reconstruction quality is judged by the operator; there is no automated benchmark yet.',
    stages: [
      { id: 'raw-prompt', label: 'raw prompt', note: 'The operator’s original prompt starts the reconstruction.' },
      { id: 'spec', label: 'specification', note: 'The engine reshapes the prompt into a specification.' },
      { id: 'provider-failover', label: 'provider failover', note: 'A model decline routes to provider failover.' },
    ],
  },
  'diamond-chart': {
    drawing: 'diamond-chart',
    label: 'Ephemeris accuracy gate',
    provenance: 'Plate 05 · jyotish-shastra · drawing id diamond-chart',
    schematic: 'Schematic · not live activity. The API computes positions and applies an ephemeris accuracy gate; this is not an astrological reading.',
    source: 'Source: plate description and limit for jyotish-shastra.',
    limit: 'Limit: an engine, not an interpretation: it computes positions and declines to tell fortunes.',
    stages: [
      { id: 'ephemeris', label: 'ephemeris', note: 'Ephemeris data is the accuracy reference.' },
      { id: 'gate', label: 'accuracy gate', note: 'The build fails on drift beyond the gate.' },
      { id: 'positions', label: 'positions', note: 'The output is computed positions, not fortune-telling.' },
    ],
  },
  'scroll-rail': {
    drawing: 'scroll-rail',
    label: 'Static six-section rail',
    provenance: 'Plate 06 · forgotten-mistory · drawing id scroll-rail',
    schematic: 'Schematic · not live activity. A static page rail holds six sections and quoted figures; nothing is computed live for the reader.',
    source: 'Source: plate description and limit for forgotten-mistory.',
    limit: 'Limit: every figure on it is quoted from a CV or a repository — none is computed live.',
    stages: [
      { id: 'static', label: 'static export', note: 'The page is shipped as a static export.' },
      { id: 'six-section', label: 'six sections', note: 'The rail represents the six flagship sections.' },
      { id: 'rail', label: 'quoted rail', note: 'The figures are quoted from source records, not live telemetry.' },
    ],
  },
} as const;
