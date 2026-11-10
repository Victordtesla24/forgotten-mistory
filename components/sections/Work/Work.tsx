import { Card } from '@/components/ui/Card';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';
import { PUBLIC_REPO_COUNT, projects, type Project } from '@/content/work';

const count = new Intl.NumberFormat('en-AU');

function ProjectCard({ project }: { project: Project }) {
  const { schematic, stats } = project;
  const headingId = `project-${project.repo}`;
  return (
    <Card as="article" aria-labelledby={headingId} className="flex h-full flex-col gap-6">
      <header className="grid gap-2">
        <h3 id={headingId}>{project.title}</h3>
        <p className="type-small text-muted">{project.description}</p>
      </header>

      <div>
        <p className="type-eyebrow mb-3 text-muted">How it works</p>
        <ol
          aria-label={schematic.label}
          className="grid border-l border-line-strong pl-4"
        >
          {schematic.stages.map((stage) => (
            <li key={stage.id} title={stage.note} className="type-meta relative py-1">
              <span
                aria-hidden="true"
                className="absolute top-1/2 -left-[1.3125rem] size-2 -translate-y-1/2 rounded-full border border-line-strong bg-raised"
              />
              {stage.label}
            </li>
          ))}
        </ol>
        <p className="sr-only">{schematic.caption}</p>
      </div>

      <div className="border-l-2 border-line-strong pl-4">
        <p className="type-eyebrow text-muted">Known limits</p>
        <p className="type-small mt-1">{project.limits}</p>
      </div>

      <p className="type-meta text-muted">
        {count.format(stats.commits)} commits · {stats.languages.join(' · ')}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-5">
        <ExternalLink href={project.repoHref} className="type-small min-h-11">
          Repository
        </ExternalLink>
        {project.live ? (
          <ExternalLink href={project.live.href} className="type-small min-h-11">
            {project.live.label}
          </ExternalLink>
        ) : null}
      </div>
    </Card>
  );
}

export function Work() {
  return (
    <Section
      id="work"
      eyebrow="Work"
      title="Selected work"
      accent="work"
      lede={`${projects.length} of ${PUBLIC_REPO_COUNT} public repositories, each with its known limits printed beside what it does.`}
    >
      <ul className="reveal-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <li key={project.repo} className="grid">
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
