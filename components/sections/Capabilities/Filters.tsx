import { domains } from '@/content/capabilities';

import styles from './Capabilities.module.css';

/**
 * One row of domain filters: a native radio group, so it answers from the keyboard (arrow keys),
 * keeps one pressed state and needs no script. The map dims what is not in the chosen domain
 * (`Capabilities.module.css`).
 */
export function Filters() {
  const choices = [{ id: 'all', name: 'All' }, ...domains];
  return (
    <fieldset className={styles.filters}>
      <legend className="sr-only">Domain</legend>
      {choices.map((choice) => (
        <label key={choice.id} className={styles.choice}>
          <input
            type="radio"
            name="capability-domain"
            value={choice.id}
            defaultChecked={choice.id === 'all'}
            className={styles.radio}
          />
          <span className={styles.chip}>{choice.name}</span>
        </label>
      ))}
    </fieldset>
  );
}
