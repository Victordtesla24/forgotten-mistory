import { ExternalLink } from '@/components/ui/ExternalLink';
import { Tag } from '@/components/ui/Tag';
import { STATS_AS_OF, type Project } from '@/content/work';

import styles from './Work.module.css';

const count = new Intl.NumberFormat('en-AU');
const day = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * What follows a project's schematic in its panel, in short blocks: what it does, the counts its
 * repository states (only Aether's), its stack, the engineering decisions, when it began and how
 * many commits it has, and the links `content/work.ts` holds for it.
 */
export function PanelBody({ project }: { project: Project }) {
  return (
    <div className={styles.blocks}>
      <p className="max-w-[62ch]">{project.does.join(' ')}</p>

      {project.figures.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {project.figures.map((figure) => (
            <div key={figure.label} className="flex flex-col-reverse gap-0.5">
              <dt className="type-meta text-muted">{figure.label}</dt>
              <dd className="type-figure text-[1.375rem] text-proof">{figure.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className={styles.block}>
        <h4 className="type-eyebrow">Stack</h4>
        <ul className="flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <li key={item}>
              <Tag>{item}</Tag>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.block}>
        <h4 className="type-eyebrow">Engineering decisions</h4>
        <ul className="grid list-disc gap-1.5 pl-5 text-[0.9375rem] leading-normal marker:text-muted">
          {project.decisions.map((decision) => (
            <li key={decision}>{decision}</li>
          ))}
        </ul>
      </div>

      <p className="type-meta">
        First commit {day.format(new Date(project.stats.firstCommit))}, {count.format(project.stats.commits)} commits as of{' '}
        {day.format(new Date(STATS_AS_OF))}
      </p>

      {project.repoHref || project.live ? (
        <div className="flex flex-wrap items-center gap-x-5">
          {project.repoHref ? (
            <ExternalLink href={project.repoHref} className="min-h-11 text-[0.9375rem]">
              Repository
            </ExternalLink>
          ) : null}
          {project.live ? (
            <ExternalLink href={project.live.href} className="min-h-11 text-[0.9375rem]">
              {project.live.label}
            </ExternalLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
