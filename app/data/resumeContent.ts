/**
 * resumeContent.ts — outcome cards rendered in the hero section and expanded
 * by FloatingDetailBox. Kept in strict parity with the standalone CV
 * (public/docs/Vik_Resume_Final.pdf).
 */

export interface OutcomeDetail {
  title: string;
  subtitle: string;
  stats: { value: string; label: string };
  themeColor: string;
  details: string[];
}

export const resumeContent: Record<string, OutcomeDetail> = {
  'Test Automation at Scale': {
    title: 'Test Automation at Scale',
    subtitle: '-92% Evidence Effort',
    stats: { value: '-92%', label: 'Effort' },
    themeColor: 'rgb(0 242 254)', // Cyan
    details: [
      'Architected the ATO Payday Super program’s COBOL/mainframe test-evidence automation covering 200+ SIT/E2E scenarios across eight squads.',
      'Cut evidence effort from ~3 hours to ~15 minutes per scenario using REXX, SMF, SDSF, PCOMM, PowerShell, and VBA — zero new InfoSec approvals.',
      'Converted an infeasible 8-day SIT window into an achievable plan via a six-day tiered harness build with go/no-go gating.',
      'War room produced a binding automation recommendation in under three hours.',
    ],
  },
  'Cloud Modernisation': {
    title: 'Cloud Modernisation',
    subtitle: '-30% Delivery',
    stats: { value: '-30%', label: 'Delivery' },
    themeColor: 'rgb(255 77 77)', // Red
    details: [
      'Guided the transition of core banking platforms to cloud-native architectures (.NET/Azure).',
      'Improved delivery efficiency by >30% and reduced infrastructure costs by >15%.',
      'Implemented rigorous compliance checks for regulated programs.',
      'Architected scalable solutions for high-volume transaction processing.',
    ],
  },
  'Realtime Reliability': {
    title: 'Realtime Reliability',
    subtitle: '10k+ Devices',
    stats: { value: '10k+', label: 'Devices' },
    themeColor: 'rgb(255 115 80)', // Orange (Site Accent)
    details: [
      'Led delivery of AI/ML solutions including real-time WebSocket telemetry.',
      'Achieved P95 < 200ms latency across 10k+ concurrent devices (ANZ).',
      'Designed resilient CX & telemetry pipelines for critical banking services.',
      'Optimized edge latency and geo-distributed caching strategies.',
    ],
  },
  'AI Quality & Risk': {
    title: 'AI Quality & Risk',
    subtitle: '-38% Breaches',
    stats: { value: '-38%', label: 'Breaches' },
    themeColor: 'rgb(255 77 77)', // Red
    details: [
      'Implemented Langfuse + Phoenix evaluation stack reducing simulated LLM error-budget breaches by 38%.',
      'Built Node.js/Express public-key server with 100% test coverage for API signing.',
      'Ensured safer AI rollouts with automated risk assessment pipelines.',
      'Aligned AI delivery with enterprise compliance and risk models.',
    ],
  },
  'Leadership Scale': {
    title: 'Leadership Scale',
    subtitle: '40+ Resources',
    stats: { value: '40+', label: 'Resources' },
    themeColor: 'rgb(255 115 80)', // Orange
    details: [
      'Leading the Agile Kookaburras squad at the ATO within an eight-team SIT program.',
      'Led 5+ cross-functional squads including onsite & offshore teams (40+ practitioners).',
      'Certified Scrum Master (CSM) fostering agile culture and steady cadence.',
      'Managed program portfolios valued at over $5M; exec workshops improved decision clarity by ~55%.',
    ],
  },
  'Portfolio Value': {
    title: 'Portfolio Value',
    subtitle: '$5M+ Budget',
    stats: { value: '$5M+', label: 'Budget' },
    themeColor: 'rgb(39 201 63)', // Green
    details: [
      'Stewardship of multi-million programs with full compliance.',
      'Authored executive change requests with costed options analysis and full delivery traceability (Azure DevOps).',
      'Risk & budget management for large-scale enterprise transformations.',
      'Oversight of critical risk and compliance programs.',
    ],
  },
};
