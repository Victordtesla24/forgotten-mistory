import { DetailSet, type DetailItem } from '@/components/ui/DetailPanel';
import { roles } from '@/content/experience';
import { careerBars } from '@/lib/timeline';

import { RoleBody } from '../Experience/RoleBody';
import { CareerTrack } from './CareerTrack';
import { RoleLead } from './RoleLead';

/** The achievements a panel keeps in view; the rest open under "More". */
const VISIBLE_ACHIEVEMENTS = 3;

/** One panel for each role, in the order of the axis, so Previous and Next walk the career. */
const items: readonly DetailItem[] = careerBars.flatMap((bar) => {
  const role = roles.find((entry) => entry.id === bar.id);
  if (!role) return [];
  return [
    {
      id: `career-${role.id}`,
      eyebrow: `${role.employer} · ${role.location} · ${role.dates}`,
      title: role.title,
      lead: <RoleLead role={role} />,
      children: (
        <>
          {role.additionalTitle ? <p className="type-small text-muted">{role.additionalTitle}</p> : null}
          <RoleBody role={role} headline={false} visible={VISIBLE_ACHIEVEMENTS} />
        </>
      ),
    },
  ];
});

/** The career scale with the panel set its bars open: the same role Experience shows. */
export function Career() {
  return (
    <DetailSet label="Career roles" items={items}>
      <CareerTrack />
    </DetailSet>
  );
}
