import type { Schematic as SchematicData } from '@/content/work';
import { arrowHead, schematicLayout, type Place, type Point, type Prism, type Segment } from '@/lib/schematic';

import styles from './Work.module.css';

const list = (points: readonly Point[]): string => points.map((point) => `${point.x},${point.y}`).join(' ');
const path = (segments: readonly Segment[]): string => segments.map(([a, b]) => `M${a.x} ${a.y}L${b.x} ${b.y}`).join('');

function Faces({ prism }: { prism: Prism }) {
  return (
    <>
      <polygon points={list(prism.left)} className={`${styles.face} ${styles.left}`} />
      <polygon points={list(prism.right)} className={`${styles.face} ${styles.right}`} />
      <polygon points={list(prism.top)} className={`${styles.face} ${styles.top}`} />
    </>
  );
}

/**
 * The isometric drawing of a project's three stages and the path the work takes between them,
 * from `schematicLayout`. The drawing has no text: the stages' names are in the page's HTML
 * beside it. Each stage is a mark, `data-stage` its id from `content/work.ts`, in the order of the
 * work; `lit` (1 to 3) is the stage that is lit, marked `data-active`, and with it the way that leads
 * to it, or the one that returns from it.
 */
export function Schematic({ schematic, place, lit = 0 }: { schematic: SchematicData; place: Place; lit?: number }) {
  const layout = schematicLayout(schematic, place);
  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      aria-hidden="true"
      focusable="false"
      data-schematic-id={layout.id}
      className={styles.drawing}
    >
      {layout.floor.map((shape) => (
        <polygon key={list(shape)} points={list(shape)} className={styles.ground} />
      ))}
      {layout.floorLines.length > 0 ? <path d={path(layout.floorLines)} className={styles.fine} /> : null}
      {layout.nodes.map((node) => (
        <g
          key={node.id}
          data-stage={node.id}
          data-kind={node.kind}
          data-active={lit === node.index + 1 ? 'true' : undefined}
          className={styles.node}
        >
          {node.prisms.map((prism) => (
            <Faces key={list(prism.top)} prism={prism} />
          ))}
          {node.lines.length > 0 ? <path d={path(node.lines)} className={styles.fine} /> : null}
        </g>
      ))}
      {layout.routes.map((route) => {
        const leads = (route.kind === 'forward' ? route.to : route.from) + 1;
        return (
          <g
            key={`${route.kind}-${route.from}-${route.to}`}
            data-kind={route.kind}
            data-active={lit === leads ? 'true' : undefined}
            className={styles.route}
          >
            <polyline points={list(route.points)} className={styles.line} />
            <polygon points={list(arrowHead(route.points))} className={styles.arrow} />
          </g>
        );
      })}
    </svg>
  );
}
