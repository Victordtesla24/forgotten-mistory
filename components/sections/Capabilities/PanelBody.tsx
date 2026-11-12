import type { Capability, Source } from '@/content/capabilities';
import { sourcesOf } from '@/lib/capability-field';

import { KIND_NAME, MarkIcon } from './Mark';

/** The fragment of the panel a source's role or project opens, in Experience or Work. */
function target(source: Source): { href: string; name: string } | null {
  if (!source.link) return null;
  return source.link.type === 'role'
    ? { href: `#role-${source.link.id}-detail`, name: 'Role' }
    : { href: `#project-${source.link.id}-detail`, name: 'Project' };
}

/**
 * What follows a capability's drawing: where it was applied and the outcome, then the sources it
 * names. A source that has a role or a project in the page is a link that closes this panel and
 * opens that one (the fragment is the whole mechanism); a source without one is plain text.
 */
export function PanelBody({ capability }: { capability: Capability }) {
  const named = sourcesOf(capability);
  return (
    <>
      <p className="max-w-[62ch]">{capability.detail}</p>
      {named.length > 0 ? (
        <div data-part="block">
          <h4 className="type-eyebrow">Applied at</h4>
          <ul className="grid gap-1">
            {named.map((source) => {
              const link = target(source);
              const row = (
                <>
                  <MarkIcon kind={source.kind} />
                  <span className="text-text">{source.label}</span>
                  <span className="type-meta text-muted">{link ? `${KIND_NAME[source.kind]} · open the ${link.name.toLowerCase()}` : KIND_NAME[source.kind]}</span>
                </>
              );
              return (
                <li key={source.id} data-source={source.id}>
                  {link ? (
                    <a href={link.href} data-part="row">
                      {row}
                    </a>
                  ) : (
                    <span data-part="row">{row}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
