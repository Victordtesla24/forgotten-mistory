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
 * beside it. Each stage is a mark, `data-stage` its id from `content/work.ts` and `data-label` its name,
 * in the order of the work; a route carries `data-lit`, the number of the stage that lights it (the one
 * it leads to, or the one it returns from). The page lights a stage by setting `data-active` on its
 * mark and on the routes that light with it (`behaviour.ts`).
 */
export function Schematic({ schematic, place }: { schematic: SchematicData; place: Place }) {
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
          data-label={schematic.stages[node.index].label}
          data-kind={node.kind}
          className={styles.node}
        >
          {node.prisms.map((prism) => (
            <Faces key={list(prism.top)} prism={prism} />
          ))}
          {node.lines.length > 0 ? <path d={path(node.lines)} className={styles.fine} /> : null}
        </g>
      ))}
      {layout.routes.map((route) => (
        <g
          key={`${route.kind}-${route.from}-${route.to}`}
          data-kind={route.kind}
          data-lit={(route.kind === 'forward' ? route.to : route.from) + 1}
          className={styles.route}
        >
          <polyline points={list(route.points)} className={styles.line} />
          <polygon points={list(arrowHead(route.points))} className={styles.arrow} />
        </g>
      ))}
    </svg>
  );
}
