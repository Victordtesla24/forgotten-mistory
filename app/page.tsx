import { About } from '@/components/sections/About/About';
import { Capabilities } from '@/components/sections/Capabilities/Capabilities';
import { Contact } from '@/components/sections/Contact/Contact';
import { Experience } from '@/components/sections/Experience/Experience';
import { Hero } from '@/components/sections/Hero/Hero';
import { Work } from '@/components/sections/Work/Work';

/**
 * The portfolio: one page, seven sections, in reading order. The hero renders the headline
 * figures as well, because the two share the first screen's grid.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Work />
      <Experience />
      <Capabilities />
      <About />
      <Contact />
    </>
  );
}
