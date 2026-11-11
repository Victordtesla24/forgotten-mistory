import type { RoleView } from './roles';
import styles from './RoleOutcome.module.css';

/** What a role is best known for, in one line: the figure the content states with what it measures, or, where it states none, the one result it does state. */
export function RoleOutcome({ role }: { role: Pick<RoleView, 'headline' | 'outcome'> }) {
  if (role.headline) {
    return (
      <p className={styles.outcome} data-figure-line="">
        <span className={`type-figure ${styles.value}`}>{role.headline.value}</span> {role.headline.label}
      </p>
    );
  }
  return <p className={styles.outcome}>{role.outcome}</p>;
}
