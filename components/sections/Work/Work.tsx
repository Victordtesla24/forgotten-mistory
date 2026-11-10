import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Disclosure';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';
import { SnapRow } from '@/components/ui/SnapRow';
import { Tag } from '@/components/ui/Tag';
import {
  STATS_AS_OF,
  projects,
  type Project,
  type ProjectFigure,
  type ProjectStage,
  type RepoStats,
} from '@/content/work';

const count = new Intl.NumberFormat('en-AU');
const day = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function Stage({ stage }: { stage: ProjectStage }) {
  return (
    <li className="grid gap-0.5">
      <span className="font-medium">{stage.label}</span>
      <span className="type-small text-muted">{stage.note}</span>
    </li>
  );
}

function Count({ figure }: { figure: ProjectFigure }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="type-meta text-muted">{figure.label}</dt>
      <dd className="type-figure text-[1.375rem] text-proof">{figure.value}</dd>
    </div>
  );
}

function Activity({ stats }: { stats: RepoStats }) {
  return (
    <p className="type-meta text-muted">
      First commit {day.format(new Date(stats.firstCommit))} · {count.format(stats.commits)} commits
      as of {day.format(new Date(STATS_AS_OF))}
    </p>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { schematic } = project;
  const headingId = `project-${project.repo}`;
  return (
    <Card as="article" aria-labelledby={headingId} className="p-0">
      <Disclosure
        id={`project-${project.repo}-detail`}
        summaryClassName="p-5"
        panelClassName="grid gap-5 border-t border-line p-5"
        summary={
          <div className="grid gap-2">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
              <h3 id={headingId}>{project.name}</h3>
              <Tag tone="accent">{project.status}</Tag>
            </div>
            <p className="type-small text-muted">{project.value}</p>
          </div>
        }
      >
        <p className="type-small max-w-none">{project.does.join(' ')}</p>

        {project.figures.length > 0 ? (
          <dl className="grid grid-cols-3 gap-3">
            {project.figures.map((figure) => (
              <Count key={figure.label} figure={figure} />
            ))}
          </dl>
        ) : null}

        <div className="grid gap-2">
          <h4 className="type-eyebrow text-muted">How it works</h4>
          <ol aria-label={schematic.label} className="grid gap-3 border-l border-line-strong pl-4">
            {schematic.stages.map((stage) => (
              <Stage key={stage.id} stage={stage} />
            ))}
          </ol>
        </div>

        <div className="grid gap-2">
          <h4 className="type-eyebrow text-muted">Engineering decisions</h4>
          <ul className="type-small grid list-disc gap-1.5 pl-5 marker:text-muted">
            {project.decisions.map((decision) => (
              <li key={decision}>{decision}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2">
          <h4 className="type-eyebrow text-muted">Stack</h4>
          <ul className="flex flex-wrap gap-1.5">
            {project.stack.map((item) => (
              <li key={item}>
                <Tag>{item}</Tag>
              </li>
            ))}
          </ul>
        </div>

        <Activity stats={project.stats} />

        <div className="flex flex-wrap items-center gap-x-5">
          <ExternalLink href={project.repoHref} className="type-small min-h-11">
            Repository
          </ExternalLink>
          {project.live ? (
            <ExternalLink href={project.live.href} className="type-small min-h-11">
              {project.live.label}
            </ExternalLink>
          ) : null}
        </div>
      </Disclosure>
    </Card>
  );
}

export function Work() {
  return (
    <Section id="work" eyebrow="Work" title="Selected work" accent="work">
      <SnapRow columns={3} className="reveal">
        {projects.map((project) => (
          <li key={project.repo}>
            <ProjectCard project={project} />
          </li>
        ))}
      </SnapRow>
    </Section>
  );
}
