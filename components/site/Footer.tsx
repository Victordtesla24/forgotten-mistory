import Link from 'next/link';

import { Container } from '@/components/ui/Container';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { contact } from '@/content/contact';
import { copyright } from '@/content/legal';
import { site } from '@/content/site';

import { MotionToggle } from './MotionToggle';

const linkClass =
  'type-small inline-flex min-h-11 min-w-11 items-center text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-text hover:decoration-muted';

/** Legal links, the CV, the repository, the way to report a problem with the site and the Motion control. */
export function Footer() {
  return (
    <footer className="mt-section border-t border-line">
      <Container className="grid gap-6 pt-12 pb-24 md:pb-16">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Terms
              </Link>
            </li>
            <li>
              <a href={site.cvHref} download className={linkClass}>
                CV (PDF)
              </a>
            </li>
            <li>
              <ExternalLink href={site.repositoryHref} className={`${linkClass} text-muted`}>
                Repository
              </ExternalLink>
            </li>
            <li>
              <a href={contact.support.href} className={linkClass}>
                {contact.support.label}
              </a>
            </li>
            <li className="js-only">
              <MotionToggle className={`${linkClass} cursor-pointer`} />
            </li>
          </ul>
        </nav>
        <p className="type-meta text-muted">{copyright}</p>
      </Container>
    </footer>
  );
}
