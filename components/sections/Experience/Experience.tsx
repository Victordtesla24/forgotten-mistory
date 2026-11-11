import { DetailSet, type DetailItem } from '@/components/ui/DetailPanel';
import { Container } from '@/components/ui/Container';
import { roles } from '@/content/experience';
import { laneLayouts } from '@/lib/timeline-lanes';

import { Axis } from './Axis';
import { RoleBody } from './RoleBody';
import { RoleLead } from './RoleLead';
import { roleViews } from './roles';
import { Timeline } from './Timeline';

/** One panel for each role, in the order of the axis, so Previous and Next walk the career. */
const items: readonly DetailItem[] = roleViews.flatMap((view) => {
  const role = roles.find((entry) => entry.id === view.id);
  if (!role) return [];
  return [
    {
      id: view.panel,
      eyebrow: `${role.employer} · ${role.location} · ${role.dates}`,
      title: role.title,
      attributes: { 'data-role-item': role.id },
      lead: <RoleLead role={role} />,
      children: (
        <>
          {role.additionalTitle ? <p className="type-small text-muted">{role.additionalTitle}</p> : null}
          <RoleBody role={role} />
        </>
      ),
    },
  ];
});

/**
 * The career as the page's one timeline: eight roles on an axis from 2010 to now that runs from
 * edge to edge, the bars its tabs, the selected role in a card joined to its bar. The heading is
 * a single row; everything else is the instrument (`Timeline`) and the panel each role opens.
 */
export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="pt-[clamp(4rem,6vw,5rem)]">
      <Container as="header" className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 md:mb-6">
        <p className="type-eyebrow text-muted">Experience</p>
        <h2 id="experience-title">
          Eight <em className="type-serif-em">roles</em>
        </h2>
      </Container>
      <DetailSet label="Roles" items={items}>
        <Timeline roles={roleViews} lanes={laneLayouts.map((layout) => layout.lanes)}>
          <Axis />
        </Timeline>
      </DetailSet>
    </section>
  );
}
