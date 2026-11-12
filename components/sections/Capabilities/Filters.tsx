import { SnapRow } from '@/components/ui/SnapRow';
import { domains } from '@/content/capabilities';

/** The choice before any script has run: every domain from 1024 px, the first domain below it. */
const FIRST = domains[0]?.id;

/**
 * The domain filters, in two forms the stylesheet chooses between. From 1024 px a row of buttons,
 * All first, that dims what is outside the chosen domain; below it a snapping row of the five
 * domains with no All, for the field shows one domain at a time there. Each is a set of buttons
 * with `aria-pressed`, exactly one pressed, and `behaviour.ts` keeps both in step. Without script
 * they have nothing to do, so the stylesheet leaves them out.
 */
export function Filters() {
  return (
    <>
      <div role="group" aria-label="Domain" data-filters="wide">
        {[{ id: 'all', name: 'All' }, ...domains].map((choice) => (
          <button key={choice.id} type="button" data-filter={choice.id} aria-pressed={choice.id === 'all'}>
            {choice.name}
          </button>
        ))}
      </div>
      <SnapRow aria-label="Domain" data-filters="narrow" strip>
        {domains.map((domain) => (
          <li key={domain.id}>
            <button type="button" data-filter={domain.id} aria-pressed={domain.id === FIRST}>
              {domain.name}
            </button>
          </li>
        ))}
      </SnapRow>
    </>
  );
}
