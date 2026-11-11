import type { ExperienceRole } from '@/content/experience';

import { RoleOutcome } from './RoleOutcome';
import { RoleVisual } from './RoleVisual';
import { roleViews } from './roles';
import styles from './RoleLead.module.css';

/**
 * What leads a role's panel: how long the role ran, in words, and the role's drawn figure, the
 * same one its card draws, at the size of the panel, with the line it is best known for.
 */
export function RoleLead({ role }: { role: ExperienceRole }) {
  const view = roleViews.find((entry) => entry.id === role.id);
  if (!view) return null;
  return (
    <div className={styles.lead}>
      <p className={styles.duration}>{view.duration}</p>
      <RoleOutcome role={view} />
      <RoleVisual role={view} place="panel" />
    </div>
  );
}
