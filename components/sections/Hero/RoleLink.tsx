'use client';

import type { AnchorHTMLAttributes } from 'react';

import { viewMarks } from '@/components/visuals/ViewTrigger';
import { requestRole } from '@/lib/experience-select';
import { CAREER_VIEW } from '@/lib/gl/ids';

type RoleLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  /** The id of the role it selects in Experience. */
  role: string;
};

/**
 * A bar or chip of the career scale. It is a link to the Experience section, so it works without
 * script; with script it also selects its role there before the page scrolls, and it lights the
 * scale's own bar for the reader who is on it, as every control of the scale does.
 */
export function RoleLink({ role, ...rest }: RoleLinkProps) {
  return <a {...rest} href="#experience" onClick={() => requestRole(role)} {...viewMarks(CAREER_VIEW, role)} />;
}
