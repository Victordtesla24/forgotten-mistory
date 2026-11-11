import type { ExperienceRole } from '@/content/experience';

/** What a role says about itself once it is open: the one-line summary and its achievements, one to a line. */
export function RoleBody({ role }: { role: ExperienceRole }) {
  return (
    <>
      <p className="type-small max-w-none">{role.summary}</p>
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
