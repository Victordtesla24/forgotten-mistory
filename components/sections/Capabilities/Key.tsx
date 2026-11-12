import { KIND_NAME, MarkIcon } from './Mark';

/** The one-line key to the marks of the map. */
export function Key() {
  return (
    <ul aria-label="Key">
      {(['program', 'repository', 'credential'] as const).map((kind) => (
        <li key={kind}>
          <MarkIcon kind={kind} />
          {KIND_NAME[kind]}
        </li>
      ))}
      <li>
        <MarkIcon kind="pending" />
        In progress
      </li>
    </ul>
  );
}
