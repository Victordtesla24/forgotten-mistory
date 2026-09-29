import type { EvidenceStatus } from './skills';

export interface TraceStageLabel {
  id: 'capability' | 'evidence' | 'where' | 'status';
  label: string;
}

export const skillsVisual = {
  traceRegionLabel: 'Capability evidence trace',
  caption:
    'Every capability is wired to the programme, repository or issuing body its evidence came from. The selected trace below restates the same certificate as four connected stages.',
  sourcePathLabel: 'source CV path',
  cvPath: 'public/docs/Vik_Resume_Final.pdf',
  sourceKinds: {
    programme: 'Programmes',
    repository: 'Repositories',
    credential: 'Credentials',
  },
  sourceReadoutSuffix: 'take their evidence from here.',
  restReadout: 'Hover, tab, or click a node to trace its certificate.',
  stages: [
    { id: 'capability', label: 'Capability' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'where', label: 'Where' },
    { id: 'status', label: 'Status' },
  ] satisfies TraceStageLabel[],
  sourceStageLabels: {
    capability: 'Source',
    evidence: 'Linked capabilities',
    where: 'Registry',
    status: 'Trace status',
  },
  sourceStatus: 'source selected',
  emptyWhere: 'not issued yet; no source body named',
} as const;

export const statusTone: Record<EvidenceStatus, string> = {
  production: 'production evidence',
  'non-production': 'non-production evidence',
  pending: 'pending certificate',
};
