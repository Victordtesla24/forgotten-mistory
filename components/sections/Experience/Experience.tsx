import { ChevronDown } from 'lucide-react';

import { Ruler } from '@/components/ui/Ruler';
import { Section } from '@/components/ui/Section';
import { NOW, TIMELINE_START, roles } from '@/content/experience';

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Eight roles over sixteen years"
      accent="sixteen years"
    >
      <Ruler
        min={TIMELINE_START}
        max={Math.floor(NOW)}
        step={1}
        labelStep={2}
        label={`Career timeline, ${TIMELINE_START} to ${Math.floor(NOW)}`}
        className="mb-12"
      />
      <ol className="grid gap-4">
        {roles.map((role) => (
          <li key={role.id} className="reveal">
            <details
              open
              className="group rounded-md border border-line bg-surface shadow-card transition-colors hover:border-line-strong"
            >
              <summary className="flex items-start gap-4 p-5 marker:content-none sm:p-6 [&::-webkit-details-marker]:hidden">
                <div className="grid flex-1 gap-2 md:grid-cols-[12rem_1fr] md:gap-8">
                  <p className="type-meta pt-1 text-muted">{role.dates}</p>
                  <div className="grid gap-1.5">
                    <h3>{role.role}</h3>
                    <p className="type-small text-muted">
                      {role.company} · {role.location}
                    </p>
                    {role.headline ? (
                      <p className="type-small mt-1">
                        <span className="type-meta mr-2 text-[1rem] font-medium text-proof">
                          {role.headline.value}
                        </span>
                        <span className="text-muted">{role.headline.label}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <ChevronDown
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="border-t border-line px-5 pt-5 pb-6 sm:px-6 md:grid md:grid-cols-[12rem_1fr] md:gap-8">
                <span aria-hidden="true" className="hidden md:block" />
                <ul className="grid list-disc gap-3 pl-5 marker:text-muted">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="type-small pl-1">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </Section>
  );
}
