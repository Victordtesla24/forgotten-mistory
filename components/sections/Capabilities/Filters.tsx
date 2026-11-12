import { domains } from '@/content/capabilities';

/**
 * One row of domain filters: a native radio group, so it answers from the keyboard (arrow keys),
 * keeps one pressed state and needs no script. The map dims what is not in the chosen domain
 * (`Capabilities.module.css`).
 */
export function Filters() {
  const choices = [{ id: 'all', name: 'All' }, ...domains];
  return (
    <fieldset>
      <legend className="sr-only">Domain</legend>
      {choices.map((choice) => (
        <label key={choice.id}>
          <input
            type="radio"
            name="capability-domain"
            value={choice.id}
            defaultChecked={choice.id === 'all'}
          />
          <span>{choice.name}</span>
        </label>
      ))}
    </fieldset>
  );
}
