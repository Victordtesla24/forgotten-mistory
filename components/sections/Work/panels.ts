import type { Project } from '@/content/work';

/** The URL fragment of a project's panel, and the id of its section: the one `content/work.ts` has always given it. */
export const projectPanel = (project: Project): string => `project-${project.repo}-detail`;
