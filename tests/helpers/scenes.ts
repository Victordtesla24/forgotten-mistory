import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The single list of WebGL scenes on the page — discovered, not maintained.
 *
 * ## Why this is derived instead of typed out
 *
 * Two suites need the same list: `tests/overhaul/flagship-visibility.spec.ts`
 * (is the scene *visible*) and `tests/perf/scene-framerate.spec.ts` (does it
 * hold 60 fps). A hand-written array in either file is a list that goes stale
 * the moment a lane lands a new scene, and the failure mode is silent: the new
 * scene simply is not measured, and nobody finds out until production. That is
 * exactly how `#skills` shipped with no bench on it — every suite that could
 * have caught it was parameterised over a list that did not name it
 * (ADV-REVIEW-20260905, P0).
 *
 * So the list is read from the only place that cannot drift from the truth:
 * the components themselves. `components/gl/Scene.tsx` stamps its `sceneId`
 * prop onto the slot as `data-scene` (Scene.tsx:257), so every `sceneId="..."`
 * in `components/` is, by construction, a slot a test can locate and a visitor
 * can see. A lane adding `vitrine-field` or `listen-field` gets held to both
 * suites' bars the moment its `<Scene sceneId="...">` lands, with no second
 * file to remember and no coordination between lanes.
 *
 * ## Sharing this with flagship-visibility.spec.ts
 *
 * That spec currently carries its own `SCENES` array, because each of its
 * cases needs more than an id: a section, a label, and — for `#experience` —
 * a relaxed fallback-coverage floor justified against text contrast. It can
 * adopt this file by keying that per-scene metadata off `discoverSceneIds()`
 * and asserting the two sets agree, which turns "someone forgot to add the new
 * scene" from a silent omission into a red test. That change is deliberately
 * *not* made here: a parallel lane is editing that file to add `vitrine-field`
 * and `listen-field`, and a merge conflict in a gate is worse than a duplicated
 * array for one cycle. This spec's own list is already live and complete.
 *
 * ## Failure mode this guards
 *
 * A scene mounted with a computed id — `<Scene sceneId={someVariable}>` — is
 * invisible to a source scan, so `discoverSceneIds` throws and names the file
 * rather than quietly measuring one scene fewer. A harness that shrinks in
 * silence is worse than one that stops.
 */

/** Repo root. Playwright resolves `process.cwd()` to the package root. */
const ROOT = process.cwd();

/** Where `<Scene>` is mounted from. Nothing outside this tree mounts one. */
const COMPONENTS_DIR = join(ROOT, 'components');

/** `sceneId="hero-atmosphere"` — the literal form the scan can read. */
const LITERAL_SCENE_ID = /sceneId=["']([A-Za-z0-9_-]+)["']/g;

/** `sceneId={expr}` — the form it cannot, and must refuse to skip over. */
const COMPUTED_SCENE_ID = /sceneId=\{/;

/** Every `.tsx` under `dir`, depth-first, in a stable (sorted) order. */
function tsxFilesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...tsxFilesUnder(full));
    } else if (entry.endsWith('.tsx')) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Every `sceneId` mounted anywhere under `components/`, deduplicated, in a
 * deterministic order (sorted file path, then position within the file).
 *
 * The order carries no meaning — each scene is measured on its own — but it is
 * stable, so a test title does not move between runs.
 *
 * @throws if a `<Scene>` is mounted with a non-literal `sceneId`, naming the
 *   file, because such a scene would otherwise be dropped from every suite
 *   parameterised over this list without a word.
 */
export function discoverSceneIds(): string[] {
  const ids: string[] = [];
  const computed: string[] = [];

  for (const file of tsxFilesUnder(COMPONENTS_DIR)) {
    const source = readFileSync(file, 'utf8');

    // `Scene.tsx` itself declares the prop (`sceneId?: string`) and reads it;
    // it never mounts a scene, so it contributes no ids and no complaint.
    if (file.endsWith(join('gl', 'Scene.tsx'))) continue;

    if (COMPUTED_SCENE_ID.test(source)) computed.push(file.slice(ROOT.length + 1));

    for (const match of source.matchAll(LITERAL_SCENE_ID)) {
      if (!ids.includes(match[1])) ids.push(match[1]);
    }
  }

  if (computed.length > 0) {
    throw new Error(
      `Scene id discovery cannot read a computed sceneId, so these scenes would go ` +
        `unmeasured by every suite built on this list: ${computed.join(', ')}. ` +
        `Give <Scene> a string literal sceneId, or teach tests/helpers/scenes.ts to ` +
        `resolve the expression — do not let the list shrink in silence.`,
    );
  }

  if (ids.length === 0) {
    throw new Error(
      `No sceneId found under ${COMPONENTS_DIR}. Either every WebGL scene has been ` +
        `removed, or this scan is looking in the wrong place — both are worth stopping for.`,
    );
  }

  return ids;
}
