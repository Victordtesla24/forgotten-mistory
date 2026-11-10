import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Disclosure';
import { Ruler } from '@/components/ui/Ruler';
import { Section } from '@/components/ui/Section';
import { SnapRow } from '@/components/ui/SnapRow';
import {
  NOW,
  TIMELINE_START,
  roles,
  yearsOf,
  type ExperienceRole,
  type RoleHeadline,
} from '@/content/experience';

function Headline({ headline }: { headline: RoleHeadline }) {
  return (
    <p className="flex items-baseline gap-3">
      <span className="type-figure text-[1.75rem] text-proof">{headline.value}</span>
      <span className="type-small text-muted">{headline.label}</span>
    </p>
  );
}

function RoleCard({ role }: { role: ExperienceRole }) {
  return (
    <Card as="article" aria-labelledby={`role-${role.id}`} className="p-0">
      <Disclosure
        id={`role-${role.id}-detail`}
        summaryClassName="p-4"
        panelClassName="grid gap-4 border-t border-line p-4"
        summary={
          <div className="grid gap-1">
            <h3 id={`role-${role.id}`} className="text-[1.0625rem]">
              {role.short}
            </h3>
            <p className="type-small text-muted">{role.shortTitle}</p>
            <p className="type-meta text-muted">{yearsOf(role.span)}</p>
          </div>
        }
      >
        <div className="grid gap-1">
          <p className="font-medium">{role.title}</p>
          {role.additionalTitle ? (
            <p className="type-small text-muted">{role.additionalTitle}</p>
          ) : null}
          <p className="type-small text-muted">
            {role.employer} · {role.location}
          </p>
          <p className="type-meta text-muted">{role.dates}</p>
        </div>
        <p className="type-small max-w-none">{role.summary}</p>
        {role.headline ? <Headline headline={role.headline} /> : null}
        <ul className="type-small grid list-disc gap-3 pl-5 marker:text-muted">
          {role.achievements.map((achievement) => (
            <li key={achievement} className="pl-1">
              {achievement}
            </li>
          ))}
        </ul>
      </Disclosure>
    </Card>
  );
}

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Eight roles"
      accent="roles"
    >
      <Ruler
        min={TIMELINE_START}
        max={Math.floor(NOW)}
        step={1}
        labelStep={8}
        label={`Career timeline, ${TIMELINE_START} to ${Math.floor(NOW)}`}
        className="mb-8"
      />
      <SnapRow as="ol" columns={4} className="reveal">
        {roles.map((role) => (
          <li key={role.id}>
            <RoleCard role={role} />
          </li>
        ))}
      </SnapRow>
    </Section>
  );
}
