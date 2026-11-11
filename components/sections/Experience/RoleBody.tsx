import type { ExperienceRole, RoleHeadline } from '@/content/experience';
import { Disclosure } from '@/components/ui/Disclosure';

function Headline({ headline }: { headline: RoleHeadline }) {
  return (
    <p className="flex items-baseline gap-3">
      <span className="type-figure text-[1.75rem] text-proof">{headline.value}</span>
      <span className="type-small text-muted">{headline.label}</span>
    </p>
  );
}

function Achievements({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="type-small grid list-disc gap-3 pl-5 marker:text-muted">
      {lines.map((achievement) => (
        <li key={achievement} className="pl-1">
          {achievement}
        </li>
      ))}
    </ul>
  );
}

interface RoleBodyProps {
  role: ExperienceRole;
  /** Show the headline figure here. Off where something else, an infographic, has already led with it. */
  headline?: boolean;
  /** How many achievements stay in view: the strongest, in the order the content gives them. The rest open under "More". */
  visible?: number;
}

/**
 * What a role says about itself once it is open: the one-line summary, the figure it is best
 * known for and its achievements, one to a line. Experience's cards and the hero's detail
 * panels show the same role through this, so they can never tell it differently.
 */
export function RoleBody({ role, headline = true, visible = role.achievements.length }: RoleBodyProps) {
  const shown = role.achievements.slice(0, visible);
  const rest = role.achievements.slice(visible);
  return (
    <>
      <p className="type-small max-w-none">{role.summary}</p>
      {headline && role.headline ? <Headline headline={role.headline} /> : null}
      <Achievements lines={shown} />
      {rest.length > 0 ? (
        <Disclosure summary="More" summaryClassName="type-small items-center text-muted" panelClassName="pt-1 pb-2">
          <Achievements lines={rest} />
        </Disclosure>
      ) : null}
    </>
  );
}
