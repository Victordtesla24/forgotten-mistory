import type { ExperienceRole, RoleHeadline } from '@/content/experience';

function Headline({ headline }: { headline: RoleHeadline }) {
  return (
    <p className="flex items-baseline gap-3">
      <span className="type-figure text-[1.75rem] text-proof">{headline.value}</span>
      <span className="type-small text-muted">{headline.label}</span>
    </p>
  );
}

/**
 * What a role says about itself once it is open: the one-line summary, the figure it is best
 * known for and its achievements, one to a line. Experience's cards and the hero's detail
 * panels show the same role through this, so they can never tell it differently.
 */
export function RoleBody({ role }: { role: ExperienceRole }) {
  return (
    <>
      <p className="type-small max-w-none">{role.summary}</p>
      {role.headline ? <Headline headline={role.headline} /> : null}
      <ul className="type-small grid list-disc gap-3 pl-5 marker:text-muted">
        {role.achievements.map((achievement) => (
          <li key={achievement} className="pl-1">
            {achievement}
          </li>
        ))}
      </ul>
    </>
  );
}
